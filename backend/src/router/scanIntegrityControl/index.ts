// backend/src/router/scanIntegrityControl/index.ts
import { trpc } from '../../lib/trpc'
import { readFile } from 'fs/promises'
import { scanIntegrityControlTrpcInput } from './input'

type IntegrityRule = {
  path: string
  rule: string
  alias: string
  description: string
  isActive: boolean
  isDirectory: boolean
  isExcluded: boolean
}

type IntegrityControlSettings = {
  rules: IntegrityRule[]
  totalRules: number
  activeRules: number
  excludedRules: number
  directoryRules: number
  aliases: Record<string, string>
  directives: Record<string, string>
}

export const scanIntegrityControlTrpcRoute = trpc.procedure
  .input(scanIntegrityControlTrpcInput)
  .mutation(async ({ input }) => {
    if (input.scan === true) {
      try {
        // Проверяем существование файла
        try {
          await readFile('/etc/afick.conf', 'utf-8')
        } catch (fileError) {
          console.error('File not found:', fileError)
          return {
            success: false,
            message: 'Файл /etc/afick.conf не найден',
            error: 'Файл конфигурации отсутствует',
            policy: null,
            rawFiles: null,
          }
        }

        // Читаем конфигурационный файл
        const afickConf = await readFile('/etc/afick.conf', 'utf-8')

        // Парсим настройки из файлов
        const policy = parseIntegrityControl(afickConf)

        return {
          success: true,
          message: 'Контроль целостности успешно проанализирован',
          policy,
          rawFiles: {
            'afick.conf': afickConf,
          },
        }
      } catch (error: any) {
        console.error('Error in scanIntegrityControl:', error)
        return {
          success: false,
          message: 'Ошибка анализа контроля целостности',
          error: error.message || String(error),
          policy: null,
          rawFiles: null,
        }
      }
    }

    return {
      success: false,
      message: 'Не указан параметр scan=true',
      error: 'Не указан параметр scan=true',
      policy: null,
      rawFiles: null,
    }
  })

function parseIntegrityControl(afickConf: string): IntegrityControlSettings {
  const lines = afickConf.split('\n')
  const rules: IntegrityRule[] = []
  const aliases: Record<string, string> = {}
  const directives: Record<string, string> = {}

  // Предопределенные описания алиасов
  const aliasDescriptions: Record<string, string> = {
    PARSEC: 'Полный контроль с учетом мандатного доступа Parsec',
    GOST: 'Контроль с использованием ГОСТ хеширования',
    ETC: 'Контроль системных конфигураций',
    DIR: 'Контроль директорий',
    MyRule: 'Пользовательское правило контроля',
    Logs: 'Контроль лог-файлов',
    PARSEConly: 'Только Parsec атрибуты',
    MSEC: 'Контроль безопасности',
    P: 'Базовый контроль прав доступа',
    L: 'Контроль ссылок',
    R: 'Расширенный контроль',
  }

  // Флаги для определения текущей секции
  let inDirectivesSection = false
  let inAliasSection = false
  let inFileSection = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Пропускаем пустые строки
    if (trimmed === '') {
      continue
    }

    // Определяем секции по комментариям
    if (trimmed.includes('directives section')) {
      inDirectivesSection = true
      inAliasSection = false
      inFileSection = false
      continue
    }
    if (trimmed.includes('alias section')) {
      inDirectivesSection = false
      inAliasSection = true
      inFileSection = false
      continue
    }
    if (trimmed.includes('file section')) {
      inDirectivesSection = false
      inAliasSection = false
      inFileSection = true
      continue
    }

    // Пропускаем строки с комментариями (начинающиеся с #)
    if (trimmed.startsWith('#')) {
      continue
    }

    // Парсим директивы
    if (inDirectivesSection && trimmed.includes(':=')) {
      const match = trimmed.match(/(\w+)\s*:=\s*(.+)/)
      if (match) {
        const [, key, value] = match
        directives[key] = value.trim()
      }
    }

    // Парсим алиасы
    if (inAliasSection && trimmed.includes('=') && !trimmed.startsWith('@@')) {
      const match = trimmed.match(/(\w+)\s*=\s*(.+)/)
      if (match) {
        const [, aliasName, aliasValue] = match
        aliases[aliasName] = aliasValue.trim()
      }
    }

    // Парсим правила из file section
    if (inFileSection) {
      // Пропускаем строки с макросами
      if (trimmed.startsWith('@@')) {
        continue
      }

      // Ищем правила вида "/path ALIAS" или "=/path ALIAS" или "!/path"
      const ruleMatch = trimmed.match(/^(!?=?)\s*(\/\S+)\s*(\w+)?/)
      if (ruleMatch) {
        const [, prefix, path, alias = ''] = ruleMatch

        const isExcluded = prefix.includes('!')
        const isDirectory = prefix.includes('=')
        const isActive = !isExcluded

        // Определяем описание для алиаса
        let description = aliasDescriptions[alias] || `Контроль по правилу ${alias}`

        // Если алиас не указан, пытаемся определить из контекста
        if (!alias) {
          description = 'Контроль файла/каталога'
        }

        rules.push({
          path,
          rule: trimmed,
          alias,
          description,
          isActive,
          isDirectory,
          isExcluded,
        })
      }
    }
  }

  // Если в процессе парсинга не нашли правила в file section,
  // ищем правила во всем файле (для обратной совместимости)
  if (rules.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim()

      // Пропускаем комментарии и пустые строки
      if (trimmed.startsWith('#') || trimmed === '' || trimmed.startsWith('@@')) {
        continue
      }

      // Пропускаем строки с директивами и алиасами
      if (trimmed.includes(':=') || (trimmed.includes('=') && !trimmed.startsWith('/'))) {
        continue
      }

      const ruleMatch = trimmed.match(/^(!?=?)\s*(\/\S+)\s*(\w+)?/)
      if (ruleMatch) {
        const [, prefix, path, alias = ''] = ruleMatch

        const isExcluded = prefix.includes('!')
        const isDirectory = prefix.includes('=')
        const isActive = !isExcluded

        rules.push({
          path,
          rule: trimmed,
          alias,
          description: aliasDescriptions[alias] || `Контроль по правилу ${alias}`,
          isActive,
          isDirectory,
          isExcluded,
        })
      }
    }
  }

  // Сортируем правила: сначала активные, потом по пути
  rules.sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1
    }
    return a.path.localeCompare(b.path)
  })

  return {
    rules,
    totalRules: rules.length,
    activeRules: rules.filter((r) => r.isActive).length,
    excludedRules: rules.filter((r) => r.isExcluded).length,
    directoryRules: rules.filter((r) => r.isDirectory).length,
    aliases,
    directives,
  }
}

export type { IntegrityControlSettings, IntegrityRule }
