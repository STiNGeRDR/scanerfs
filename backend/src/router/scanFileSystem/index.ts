import { trpc } from '../../lib/trpc'
import { yChecksTrpsinput } from './input'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const scanFileSystemTrpcRoute = trpc.procedure.input(yChecksTrpsinput).mutation(async ({ input }) => {
  if (input.checks === 'yes') {
    console.info('Запускаем astra-secdel-swapwiper status')

    try {
      // Выполняем команду systemctl -l
      const { stdout, stderr } = await execAsync('astra-secdel-swapwiper status')

      console.info('Команда выполнена успешно')

      // Возвращаем результат
      return {
        success: true,
        message: 'Команда astra-secdel-swapwiper status выполнена успешно',
        output: stdout,
        error: stderr || null,
      }
    } catch (error: any) {
      console.error('Ошибка выполнения команды:', error)

      return {
        success: false,
        message: 'Ошибка выполнения команды astra-secdel-swapwiper status',
        error: error.message || String(error),
        output: null,
      }
    }
  }

  // Если checks не 'yes'
  return {
    success: false,
    message: 'Проверка не пройдена',
    error: "checks должен быть 'yes'",
    output: null,
  }
})
