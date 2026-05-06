// backend/src/router/scanBaseInfo/index.ts
import { trpc } from '../../lib/trpc'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const scanBaseInfoTrpcRoute = trpc.procedure.mutation(async () => {
  try {
    // Получаю IP адрес, имя хоста и список пользователей
    const [IPInfo, nameUser, usersArray] = await Promise.allSettled([
      execAsync('hostname -I').catch(() => ({ stdout: '', stderr: 'Отрицательный результат выполнения hostname -I' })),
      execAsync('hostname').catch(() => ({ stdout: '', stderr: 'Отрицательный результат выполнения hostname' })),
      execAsync('cat /etc/passwd').catch(() => ({
        stdout: '',
        stderr: 'Отрицательный результат выполнения cat /etc/passwd',
      })),
    ])

    const ipValue = IPInfo.status === 'fulfilled' ? IPInfo.value.stdout : IPInfo.reason?.message || 'Ошибка'
    const nameValue = nameUser.status === 'fulfilled' ? nameUser.value.stdout : nameUser.reason?.message || 'Ошибка'
    const usersValue =
      usersArray.status === 'fulfilled'
        ? usersArray.value.stdout
            .split('\n')
            .filter((str) => Number(str.split(':')[2]) >= 1000)
            .join('\n')
        : usersArray.reason?.message || 'Ошибка'

    const anySuccess =
      IPInfo.status === 'fulfilled' || nameUser.status === 'fulfilled' || usersArray.status === 'fulfilled'

    return {
      success: anySuccess,
      message: anySuccess ? 'Базовая информация получена' : 'Не удалось получить базовую информацию',
      services: {
        IPInfo: {
          name: 'IP address',
          output: ipValue.trim(),
        },
        nameUser: {
          name: 'Name User',
          output: nameValue.trim(),
        },
        userArray: {
          name: 'User Array',
          output: usersValue.trim(),
        },
      },
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Критическая ошибка при выполнении команд',
      error: error.message || String(error),
      services: {
        IPInfo: {
          name: 'IP address',
          output: '',
          error: 'Ошибка выполнения',
        },
        nameUser: {
          name: 'Name User',
          output: '',
          error: 'Ошибка выполнения',
        },
        userArray: {
          name: 'User Array',
          output: '',
          error: 'Ошибка выполнения',
        },
      },
    }
  }
})
