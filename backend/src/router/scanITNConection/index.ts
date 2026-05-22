import { trpc } from '../../lib/trpc'
import { exec } from 'child_process'
import { promisify } from 'util'
import { scanITNConnectionTrpcInput } from './input'

const execAsync = promisify(exec)

type DNSInfo = {
  nameservers: string[]
  searchDomains: string[]
  options: string[]
}

type FileStatInfo = {
  size: number
  blocks: number
  ioBlock: number
  device: string
  inode: number
  links: number
  permissions: string
  uid: number
  gid: number
  accessTime: string
  modifyTime: string
  changeTime: string
  createTime: string
}

type ITNConnectionPolicy = {
  version: string
  name: string
  description: string
  checks: {
    dnsConfiguration: {
      name: string
      description: string
      status: {
        value: string
        description: string
        severity: string
      }
      details: {
        nameservers: string[]
        searchDomains: string[]
        options: string[]
      }
    }
    fileIntegrity: {
      name: string
      description: string
      status: {
        value: string
        description: string
        severity: string
      }
      details: FileStatInfo
    }
    connectionHistory: {
      name: string
      description: string
      status: {
        value: string
        description: string
        severity: string
      }
      details: {
        lastModified: string
        timeSinceLastChange: string
        hasRecentChanges: boolean
      }
    }
  }
}

export const scanITNConectionTrpcRoute = trpc.procedure
  .input(scanITNConnectionTrpcInput)
  .mutation(async ({ input }) => {
    if (input.scan === true) {
      try {
        // Получаем stat информацию о файле
        const { stdout: statOutput } = await execAsync('stat /etc/resolv.conf')
        const fileStat = parseStatOutput(statOutput)

        // Получаем содержимое resolv.conf
        const { stdout: resolvContent } = await execAsync('cat /etc/resolv.conf').catch(() => ({ stdout: '' }))
        const dnsInfo = parseResolvConf(resolvContent)

        // Определяем статус подключения к ИТКС ОП
        // const hasNameservers = dnsInfo.nameservers.length > 0
        const hasRecentChanges = checkRecentChanges(fileStat.modifyTime)

        // Формируем политику
        const policy = createPolicy(dnsInfo, fileStat, hasRecentChanges)

        return {
          success: true,
          message: 'Информация о подключении к ИТКС ОП успешно получена',
          policy,
          rawOutput: {
            stat: statOutput,
            resolvConf: resolvContent,
          },
          error: null,
        }
      } catch (error: any) {
        return {
          success: false,
          message: 'Ошибка анализа подключения к ИТКС ОП',
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

// Функция парсинга вывода stat
function parseStatOutput(output: string): FileStatInfo {
  const result: any = {}

  // Размер
  const sizeMatch = output.match(/Размер:\s+(\d+)/)
  if (sizeMatch) {
    result.size = parseInt(sizeMatch[1])
  }

  // Блоки
  const blocksMatch = output.match(/Блоков:\s+(\d+)/)
  if (blocksMatch) {
    result.blocks = parseInt(blocksMatch[1])
  }

  // Блок В/В
  const ioBlockMatch = output.match(/Блок В\/В:\s+(\d+)/)
  if (ioBlockMatch) {
    result.ioBlock = parseInt(ioBlockMatch[1])
  }

  // Устройство
  const deviceMatch = output.match(/Устройство:\s+(\S+)/)
  if (deviceMatch) {
    result.device = deviceMatch[1]
  }

  // Inode
  const inodeMatch = output.match(/Inode:\s+(\d+)/)
  if (inodeMatch) {
    result.inode = parseInt(inodeMatch[1])
  }

  // Ссылки
  const linksMatch = output.match(/Ссылки:\s+(\d+)/)
  if (linksMatch) {
    result.links = parseInt(linksMatch[1])
  }

  // Права доступа
  const permissionsMatch = output.match(/Доступ:\s+\((\d+)\/([-\w]+)\)/)
  if (permissionsMatch) {
    result.permissions = `${permissionsMatch[1]} (${permissionsMatch[2]})`
  }

  // UID и GID
  const uidMatch = output.match(/Uid:\s+\(\s+(\d+)\/\w+\)/)
  if (uidMatch) {
    result.uid = parseInt(uidMatch[1])
  }
  const gidMatch = output.match(/Gid:\s+\(\s+(\d+)\/\w+\)/)
  if (gidMatch) {
    result.gid = parseInt(gidMatch[1])
  }

  // Временные метки
  const accessMatch = output.match(/Доступ:\s+(.+)/)
  if (accessMatch) {
    result.accessTime = accessMatch[1].trim()
  }

  const modifyMatch = output.match(/Модифицирован:\s+(.+)/)
  if (modifyMatch) {
    result.modifyTime = modifyMatch[1].trim()
  }

  const changeMatch = output.match(/Изменён:\s+(.+)/)
  if (changeMatch) {
    result.changeTime = changeMatch[1].trim()
  }

  const createMatch = output.match(/Создан:\s+(.+)/)
  if (createMatch) {
    result.createTime = createMatch[1].trim() || 'Не определено'
  }

  return result as FileStatInfo
}

// Функция парсинга /etc/resolv.conf
function parseResolvConf(content: string): DNSInfo {
  const lines = content.split('\n')
  const nameservers: string[] = []
  const searchDomains: string[] = []
  const options: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || trimmed === '') {
      continue
    }

    if (trimmed.startsWith('nameserver')) {
      const parts = trimmed.split(/\s+/)
      if (parts[1]) {
        nameservers.push(parts[1])
      }
    } else if (trimmed.startsWith('search')) {
      const parts = trimmed.split(/\s+/)
      for (let i = 1; i < parts.length; i++) {
        searchDomains.push(parts[i])
      }
    } else if (trimmed.startsWith('options')) {
      const parts = trimmed.split(/\s+/)
      for (let i = 1; i < parts.length; i++) {
        options.push(parts[i])
      }
    }
  }

  return { nameservers, searchDomains, options }
}

// Функция проверки недавних изменений (последние 24 часа)
function checkRecentChanges(modifyTime: string): boolean {
  try {
    const modifyDate = new Date(modifyTime)
    const now = new Date()
    const hoursDiff = (now.getTime() - modifyDate.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  } catch {
    return false
  }
}

// Функция создания политики
function createPolicy(dnsInfo: DNSInfo, fileStat: FileStatInfo, hasRecentChanges: boolean): ITNConnectionPolicy {
  const hasNameservers = dnsInfo.nameservers.length > 0
  const isConnected = hasNameservers

  // Определяем время с последнего изменения
  let timeSinceLastChange = 'Не определено'
  try {
    const modifyDate = new Date(fileStat.modifyTime)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - modifyDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff === 0) {
      const hoursDiff = Math.floor((now.getTime() - modifyDate.getTime()) / (1000 * 60 * 60))
      timeSinceLastChange = `${hoursDiff} часов назад`
    } else if (daysDiff < 30) {
      timeSinceLastChange = `${daysDiff} дней назад`
    } else {
      const monthsDiff = Math.floor(daysDiff / 30)
      timeSinceLastChange = `${monthsDiff} месяцев назад`
    }
  } catch {
    timeSinceLastChange = 'Не определено'
  }

  return {
    version: '1.0',
    name: 'Подключения к ИТКС ОП',
    description: 'Анализ сетевых настроек для определения факта подключения к ИТКС ОП',
    checks: {
      dnsConfiguration: {
        name: 'DNS-конфигурация',
        description: 'Анализ DNS-серверов, используемых системой',
        status: {
          value: isConnected ? 'Настроены DNS-серверы' : 'DNS-серверы не настроены',
          description: isConnected
            ? `Обнаружено ${dnsInfo.nameservers.length} DNS-сервер(ов)`
            : 'DNS-серверы не обнаружены, подключение к ИТКС ОП маловероятно',
          severity: isConnected ? 'low' : 'high',
        },
        details: {
          nameservers: dnsInfo.nameservers,
          searchDomains: dnsInfo.searchDomains,
          options: dnsInfo.options,
        },
      },
      fileIntegrity: {
        name: 'Целостность конфигурационного файла',
        description: 'Проверка файла /etc/resolv.conf на предмет изменений',
        status: {
          value: hasRecentChanges ? 'Файл недавно изменён' : 'Файл не изменялся недавно',
          description: hasRecentChanges
            ? 'Обнаружены недавние изменения в настройках DNS'
            : 'Значительных изменений в настройках DNS не обнаружено',
          severity: hasRecentChanges ? 'medium' : 'low',
        },
        details: fileStat,
      },
      connectionHistory: {
        name: 'История подключений',
        description: 'Анализ времени последних изменений в настройках DNS',
        status: {
          value: hasNameservers ? 'Подключение вероятно' : 'Подключение маловероятно',
          description: hasNameservers
            ? `Последнее изменение конфигурации DNS: ${timeSinceLastChange}`
            : 'Отсутствуют DNS-серверы, подключение к сети не обнаружено',
          severity: hasNameservers ? 'low' : 'high',
        },
        details: {
          lastModified: fileStat.modifyTime,
          timeSinceLastChange: timeSinceLastChange,
          hasRecentChanges: hasRecentChanges,
        },
      },
    },
  }
}

export type { ITNConnectionPolicy }
