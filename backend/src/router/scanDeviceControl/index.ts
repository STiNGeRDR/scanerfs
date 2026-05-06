// backend/src/router/scanDeviceControl/index.ts
import { trpc } from '../../lib/trpc'
import { exec } from 'child_process'
import { promisify } from 'util'
import { scanDeviceControlTrpcInput } from './input'

const execAsync = promisify(exec)

export const scanDeviceControlTrpcRoute = trpc.procedure
  .input(scanDeviceControlTrpcInput)
  .mutation(async ({ input }) => {
    if (input.scan === true) {
      try {
        // Получаем статус обеих служб
        const [mountLockResult, formatLockResult] = await Promise.allSettled([
          execAsync('astra-mount-lock status').catch(() => ({
            stdout: '',
            stderr: 'Отрицательный результат выполнения astra-mount-lock',
          })),
          execAsync('astra-format-lock status').catch(() => ({
            stdout: '',
            stderr: 'Отрицательный результат выполнения astra-format-lock',
          })),
        ])

        // Обрабатываем результат astra-mount-lock
        let mountLockOutput = ''
        let mountLockError = ''
        let mountLockSuccess = false

        if (mountLockResult.status === 'fulfilled') {
          mountLockOutput = mountLockResult.value.stdout
          mountLockError = mountLockResult.value.stderr || ''
          mountLockSuccess = true
        } else {
          mountLockError = mountLockResult.reason?.message || 'Ошибка выполнения astra-mount-lock'
        }

        // Обрабатываем результат astra-format-lock
        let formatLockOutput = ''
        let formatLockError = ''
        let formatLockSuccess = false

        if (formatLockResult.status === 'fulfilled') {
          formatLockOutput = formatLockResult.value.stdout
          formatLockError = formatLockResult.value.stderr || ''
          formatLockSuccess = true
        } else {
          formatLockError = formatLockResult.reason?.message || 'Ошибка выполнения astra-format-lock'
        }

        // Определяем общий статус
        const anySuccess = mountLockSuccess || formatLockSuccess
        const mountLockActive = mountLockOutput && !mountLockOutput.includes('НЕАКТИВНО')
        const formatLockActive = formatLockOutput && !formatLockOutput.includes('НЕАКТИВНО')

        return {
          success: anySuccess,
          message: anySuccess ? 'Статус служб контроля устройств получен' : 'Не удалось получить статус служб',
          services: {
            mountLock: {
              name: 'astra-mount-lock',
              output: mountLockOutput,
              error: mountLockError,
              success: mountLockSuccess,
              active: mountLockActive,
            },
            formatLock: {
              name: 'astra-format-lock',
              output: formatLockOutput,
              error: formatLockError,
              success: formatLockSuccess,
              active: formatLockActive,
            },
          },
          anyActive: mountLockActive || formatLockActive,
          allActive: mountLockActive && formatLockActive,
        }
      } catch (error: any) {
        return {
          success: false,
          message: 'Критическая ошибка при выполнении команд',
          error: error.message || String(error),
          services: {
            mountLock: {
              name: 'astra-mount-lock',
              output: '',
              error: 'Ошибка выполнения',
              success: false,
              active: false,
            },
            formatLock: {
              name: 'astra-format-lock',
              output: '',
              error: 'Ошибка выполнения',
              success: false,
              active: false,
            },
          },
          anyActive: false,
          allActive: false,
        }
      }
    }

    return {
      success: false,
      message: 'Не указан параметр scan=true',
      error: 'Не указан параметр scan=true',
      services: {
        mountLock: { name: 'astra-mount-lock', output: '', error: 'Не проверено', success: false, active: false },
        formatLock: { name: 'astra-format-lock', output: '', error: 'Не проверено', success: false, active: false },
      },
      anyActive: false,
      allActive: false,
    }
  })
