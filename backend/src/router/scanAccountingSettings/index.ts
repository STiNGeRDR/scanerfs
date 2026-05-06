// backend/src/router/scanAccountingSettings/index.ts
import { trpc } from '../../lib/trpc'
import { readFile } from 'fs/promises'
import { yAccountingSettingsTrpcInput } from './input'

type AccountingSettings = {
  dhome: { value: string; description: string }
  skel: { value: string; description: string }
  dshell: { value: string; description: string }
  usersGid: { value: string; description: string }
  usergroups: { value: boolean; description: string }
  addExtraGroups: { value: boolean; description: string }
  extraGroups: { value: string; description: string; groupList: string[] }
  screenSaverDelay: { value: number; description: string }
}

export const scanAccountingSettingsTrpcRoute = trpc.procedure
  .input(yAccountingSettingsTrpcInput)
  .mutation(async ({ input }) => {
    if (input.scan === true) {
      try {
        // Читаем конфигурационные файлы
        const [adduserConf, flyTheme] = await Promise.all([
          readFile('/etc/adduser.conf', 'utf-8').catch(() => ''),
          readFile('/usr/share/fly-wm/theme/default.themerc', 'utf-8').catch(() => ''),
        ])

        // Парсим настройки
        const policy = parseAccountingSettings(adduserConf, flyTheme)

        return {
          success: true,
          message: 'Параметры учетных записей успешно проанализированы',
          policy,
          rawFiles: {
            'adduser.conf': adduserConf || 'Файл не найден',
            'default.themerc': flyTheme || 'Файл не найден',
          },
        }
      } catch (error: any) {
        return {
          success: false,
          message: 'Ошибка анализа параметров учетных записей',
          error: error.message || String(error),
          settings: null,
          rawFiles: null,
        }
      }
    }

    return {
      success: false,
      message: 'Не указан параметр scan=true',
      error: 'Не указан параметр scan=true',
      settings: null,
      rawFiles: null,
    }
  })

// Функция для парсинга EXTRA_GROUPS
function parseExtraGroups(value: string): { value: string; groupList: string[] } {
  // Удаляем кавычки и лишние пробелы
  const cleanValue = value.replace(/"/g, '').trim()

  // Разбиваем на отдельные группы
  const groupList = cleanValue.split(/\s+/).filter((group) => group.length > 0)

  return {
    value: cleanValue,
    groupList: groupList,
  }
}

function parseAccountingSettings(adduserConf: string, flyTheme: string): AccountingSettings {
  const settings: Partial<AccountingSettings> = {
    dhome: { value: '/home', description: 'Местонахождение домашнего каталога (DHOME)' },
    skel: { value: '/etc/skel', description: 'Каталог шаблонов (SKEL)' },
    dshell: { value: '/bin/bash', description: 'Оболочка по умолчанию (DSHELL)' },
    usersGid: { value: '100', description: 'Первичная группа (USERS_GID)' },
    usergroups: { value: true, description: 'Создавать одноименную группу для пользователя (USERGROUPS)' },
    addExtraGroups: { value: false, description: 'Добавлять пользователя в дополнительные группы (ADD_EXTRA_GROUPS)' },
    extraGroups: {
      value: '',
      description: 'Дополнительные группы (EXTRA_GROUPS)',
      groupList: [],
    },
    screenSaverDelay: { value: 600, description: 'Блокировка сеанса после бездействия (ScreenSaverDelay)' },
  }

  const lines = adduserConf.split('\n')
  let flag = true
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || trimmed === '') {
      continue
    }

    // DHOME - местонахождение домашнего каталога
    if (trimmed.includes('DHOME=')) {
      const match = trimmed.match(/DHOME=(.+)/)
      if (match) {
        settings.dhome = {
          value: match[1].replace(/"/g, ''),
          description: 'Местонахождение домашнего каталога (DHOME)',
        }
      }
    }

    // SKEL - каталог шаблонов
    if (trimmed.includes('SKEL=')) {
      const match = trimmed.match(/SKEL=(.+)/)
      if (match) {
        settings.skel = {
          value: match[1].replace(/"/g, ''),
          description: 'Каталог шаблонов (SKEL)',
        }
      }
    }

    // DSHELL - оболочка
    if (trimmed.includes('DSHELL=')) {
      const match = trimmed.match(/DSHELL=(.+)/)
      if (match) {
        settings.dshell = {
          value: match[1].replace(/"/g, ''),
          description: 'Оболочка по умолчанию (DSHELL)',
        }
      }
    }

    // USERS_GID - первичная группа
    if (trimmed.includes('USERS_GID=')) {
      const match = trimmed.match(/USERS_GID=(.+)/)
      if (match) {
        settings.usersGid = {
          value: match[1].replace(/"/g, ''),
          description: 'Первичная группа (USERS_GID)',
        }
      }
    }

    // USERGROUPS - создавать пользовательскую группу
    if (trimmed.includes('USERGROUPS=')) {
      const match = trimmed.match(/USERGROUPS=(.+)/)
      if (match) {
        const value = match[1].replace(/"/g, '').toLowerCase()
        settings.usergroups = {
          value: value === 'yes' || value === 'true' || value === '1',
          description: 'Создавать одноименную группу для пользователя (USERGROUPS)',
        }
      }
    }

    // ADD_EXTRA_GROUPS - добавлять пользовательские группы
    if (trimmed.includes('ADD_EXTRA_GROUPS=')) {
      const match = trimmed.match(/ADD_EXTRA_GROUPS=(.+)/)
      if (match) {
        const value = match[1].replace(/"/g, '').toLowerCase()
        settings.addExtraGroups = {
          value: value === 'yes' || value === 'true' || value === '1',
          description: 'Добавлять пользователя в дополнительные группы (ADD_EXTRA_GROUPS)',
        }
      }
    }

    // EXTRA_GROUPS - дополнительные группы
    if (trimmed.includes('EXTRA_GROUPS=')) {
      const match = trimmed.match(/EXTRA_GROUPS=(.+)/)
      if (match && flag) {
        flag = false
        const parsed = parseExtraGroups(match[1])
        settings.extraGroups = {
          value: parsed.value,
          description: 'Дополнительные группы (EXTRA_GROUPS)',
          groupList: parsed.groupList,
        }
      }
    }
  }

  // Парсим /usr/share/fly-wm/theme/default.themerc для ScreenSaverDelay
  const flyLines = flyTheme.split('\n')

  for (const line of flyLines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || trimmed === '') {
      continue
    }

    // Ищем ScreenSaverDelay
    if (trimmed.includes('ScreenSaverDelay=')) {
      const match = trimmed.match(/ScreenSaverDelay=(\d+)/)
      if (match) {
        settings.screenSaverDelay = {
          value: parseInt(match[1]),
          description: 'Блокировка сеанса после бездействия (ScreenSaverDelay)',
        }
        break
      }
    }
  }

  return settings as AccountingSettings
}

export type { AccountingSettings }
