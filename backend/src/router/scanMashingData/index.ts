import { trpc } from '../../lib/trpc'
import { exec } from 'child_process'
import { promisify } from 'util'
import { scanMashingDataTrpcInput } from './input'

const execAsync = promisify(exec)

// Тип для политики
type MashingDataPolicy = {
  [key: string]: {
    description: string
    value: string
    severity: string
  }
}

export const scanMashingDataTrpcRoute = trpc.procedure.input(scanMashingDataTrpcInput).mutation(async ({ input }) => {
  if (input.scan === true) {
    try {
      const { stdout, stderr } = await execAsync('astra-secdel-swapwiper status')

      // Парсим вывод команды
      const services = parseServicesStatus(stdout)

      // Формируем политику
      const policy = createPolicy(services)

      return {
        success: true,
        message: 'Статус служб затирания данных получен',
        policy,
        rawOutput: stdout,
        error: stderr || null,
      }
    } catch (error: any) {
      if (error.stdout) {
        const services = parseServicesStatus(error.stdout)
        const policy = createPolicy(services)

        return {
          success: true,
          message: 'Статус служб получен (команда завершилась с предупреждением)',
          policy,
          rawOutput: error.stdout,
          error: error.stderr || error.message,
        }
      }

      return {
        success: false,
        message: 'Не удалось выполнить команду проверки статуса',
        error: error.message || String(error),
        policy: null,
        rawOutput: null,
      }
    }
  }

  return {
    success: false,
    message: 'Не указан параметр scan=true',
    error: 'Не указан параметр scan=true',
    policy: null,
    rawOutput: null,
  }
})

// Функция парсинга статуса служб
function parseServicesStatus(output: string): Record<string, string> {
  const services: Record<string, string> = {}
  const lines = output.split('\n').filter((line) => line.trim())

  for (const line of lines) {
    // Пропускаем строки с "для /"
    if (line.includes('для /')) {
      continue
    }

    const parts = line.split(':').map((s) => s.trim())
    if (parts.length >= 2) {
      services[parts[0]] = parts[1]
    }
  }
  return services
}

// Функция создания политики
function createPolicy(services: Record<string, string>): MashingDataPolicy {
  const isSecdelActive = services['astra-secdel-control'] === 'АКТИВНО'
  const isSwapwiperActive = services['astra-swapwiper-control'] === 'АКТИВНО'

  return {
    'astra-secdel-control': {
      description: 'Обеспечивает гарантированное удаление данных с накопителей HDD',
      value: services['astra-secdel-control'] || 'НЕАКТИВНО',
      severity: isSecdelActive ? 'low' : 'high',
    },
    'astra-swapwiper-control': {
      description: 'Очищает раздела подкачки (swap) от конфиденциальных данных при выключении системы',
      value: services['astra-swapwiper-control'] || 'НЕАКТИВНО',
      severity: isSwapwiperActive ? 'low' : 'high',
    },
  }
}

export type { MashingDataPolicy }
