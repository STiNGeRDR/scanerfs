// backend/src/router/scanMashingData/index.ts
import { trpc } from '../../lib/trpc'
import { exec } from 'child_process'
import { promisify } from 'util'
import { scanMashingDataTrpcInput } from './input'

const execAsync = promisify(exec)

export const scanMashingDataTrpcRoute = trpc.procedure.input(scanMashingDataTrpcInput).mutation(async ({ input }) => {
  if (input.scan === true) {
    try {
      const { stdout, stderr } = await execAsync('astra-secdel-swapwiper status')

      // ВАЖНО: Команда вернула код 2, но stdout содержит полезные данные
      // Интерпретируем это как успех, если есть вывод
      return {
        success: true,
        message: 'Статус служб затирания данных получен',
        output: stdout,
        error: stderr || null,
        // Добавляем флаг, что службы неактивны
        isActive: !stdout.includes('НЕАКТИВНО'), // или более сложная логика
      }
    } catch (error: any) {
      // Если команда завершилась с ошибкой, но есть stdout - обрабатываем
      if (error.stdout) {
        return {
          success: true, // Все равно считаем успехом
          message: 'Статус служб получен (команда завершилась с предупреждением)',
          output: error.stdout,
          error: error.stderr || error.message,
          isActive: false,
        }
      }

      // Если совсем не удалось выполнить команду
      return {
        success: false,
        message: 'Не удалось выполнить команду проверки статуса',
        error: error.message || String(error),
        output: null,
        isActive: false,
      }
    }
  }

  return {
    success: false,
    message: 'Не указан параметр scan=true',
    error: 'Не указан параметр scan=true',
    output: null,
    isActive: false,
  }
})
