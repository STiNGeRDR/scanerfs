import { promisify } from 'util'
import { trpc } from '../../lib/trpc'
import { scanEventRegistrationTrpcInput } from './input'
import { exec } from 'child_process'

const execAsync = promisify(exec)

export const scanEventRegistrationTrpcRoute = trpc.procedure
  .input(scanEventRegistrationTrpcInput)
  .mutation(async ({ input }) => {
    // Замените .query на .mutation
    if (input.scan === true) {
      try {
        const { stdout, stderr } = await execAsync('auditctl -l')
        return {
          success: true,
          message: 'Команда выполнена успешно',
          output: stdout,
          error: stderr || null,
        }
      } catch (error: any) {
        return {
          success: false,
          message: 'Ошибка выполнения команды',
          error: error.message || String(error),
          output: null,
        }
      }
    }
    return {
      success: false,
      message: 'Неправильный порядок запуска команды',
      error: 'Неправильный порядок запуска команды',
      output: null,
    }
  })
