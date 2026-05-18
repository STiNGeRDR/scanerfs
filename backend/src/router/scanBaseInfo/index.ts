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

    // Парсим пользователей, фильтруя nobody и системных пользователей
    let usersList: Array<{ username: string; uid: string; gid: string; home: string; shell: string }> = []

    if (usersArray.status === 'fulfilled') {
      const lines = usersArray.value.stdout.split('\n')
      usersList = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [username, , uid, gid, , home, shell] = line.split(':')
          return { username, uid, gid, home, shell }
        })
        .filter((user) => {
          // Исключаем пользователя nobody и системных пользователей (UID < 1000)
          const uid = parseInt(user.uid)
          return user.username !== 'nobody' && uid >= 1000
        })
    }

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
          output: usersList,
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
        },
        nameUser: {
          name: 'Name User',
          output: '',
        },
        userArray: {
          name: 'User Array',
          output: [],
        },
      },
    }
  }
})
