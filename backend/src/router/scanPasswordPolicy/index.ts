import { trpc } from '../../lib/trpc'
import { readFile } from 'fs/promises'
import { scanPasswordPolicyTrpcInput } from './input'

// Типы для парсинга
type PasswordPolicy = {
  usernameCheck: { value: boolean; description: string }
  gecosCheck: { value: boolean; description: string }
  rootPasswordCheck: { value: boolean; description: string }
  minLength: { value: number; description: string }
  lowercaseChars: { value: number; description: string }
  uppercaseChars: { value: number; description: string }
  dcredit: { value: number; description: string }
  difok: { value: number; description: string }
  otherChars: { value: number; description: string }
  passwordHistory: { value: boolean; description: string }
  rootEnforcement: { value: boolean; description: string }
  storedPasswords: { value: number; description: string }
  perUserSettings: { value: boolean; description: string }
  noReset: { value: boolean; description: string }
  magicRoot: { value: boolean; description: string }
  failedAttempts: { value: number; description: string }
  lockTime: { value: number; description: string }
  unlockTime: { value: number; description: string }
  PASS_MAX_DAYS: { value: number; description: string }
  PASS_MIN_DAYS: { value: number; description: string }
  PASS_WARN_AGE: { value: number; description: string }
  [key: string]: any
}

// Функция для преобразования отрицательных значений в положительные
const normalizeValue = (value: number): number => {
  return Math.abs(value)
}

export const scanPasswordPolicyTrpcRoute = trpc.procedure
  .input(scanPasswordPolicyTrpcInput)
  .mutation(async ({ input }) => {
    if (input.scan === true) {
      try {
        // Читаем конфигурационные файлы
        const [commonPassword, commonAuth, loginDefs] = await Promise.all([
          readFile('/etc/pam.d/common-password', 'utf-8'),
          readFile('/etc/pam.d/common-auth', 'utf-8'),
          readFile('/etc/login.defs', 'utf-8'),
        ])

        // Парсим настройки из файлов
        const policy = parsePasswordPolicy(commonPassword, commonAuth, loginDefs)

        return {
          success: true,
          message: 'Парольная политика успешно проанализирована',
          policy,
          rawFiles: {
            'common-password': commonPassword,
            'common-auth': commonAuth,
            'login.defs': loginDefs,
          },
        }
      } catch (error: any) {
        return {
          success: false,
          message: 'Ошибка анализа парольной политики',
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

// Функция парсинга парольной политики
function parsePasswordPolicy(commonPassword: string, commonAuth: string, loginDefs: string): PasswordPolicy {
  const policy: Partial<PasswordPolicy> = {}

  const lines = commonPassword.split('\n')

  // Парсим /etc/pam.d/common-password
  const pamPwhistoryLine = lines.find((line) => line.includes('pam_pwhistory.so'))
  const pamCracklibLine = lines.find((line) => line.includes('pam_cracklib.so'))
  const pamUnixLine = lines.find((line) => line.includes('pam_unix.so'))

  // История паролей (pam_pwhistory)
  if (pamPwhistoryLine) {
    // 10. История паролей
    policy.passwordHistory = {
      value: true, // Если строка есть, значит история активна
      description: 'Хранение истории паролей через pam_pwhistory',
    }

    // 12. Количество хранимых паролей
    const rememberMatch = pamPwhistoryLine.match(/remember=(\d+)/)
    policy.storedPasswords = {
      value: rememberMatch ? parseInt(rememberMatch[1]) : 0,
      description: 'Количество хранимых паролей',
    }

    // 11. Применять для root
    policy.rootEnforcement = {
      value: pamPwhistoryLine.includes('enforce_for_root'),
      description: 'Применять историю паролей к root',
    }
  }

  // Основные проверки (pam_cracklib)
  if (pamCracklibLine) {
    // 1. Проверка имени пользователя
    policy.usernameCheck = {
      value: pamCracklibLine.includes('reject_username'),
      description: 'Запрещает использовать имя пользователя в пароле',
    }

    // 2. Проверка GECOS
    policy.gecosCheck = {
      value: pamCracklibLine.includes('gecoscheck'),
      description: 'Запрещает использовать информацию из GECOS в пароле',
    }

    // 3. Проверка пароля root (для cracklib)
    policy.rootPasswordCheck = {
      value: pamCracklibLine.includes('enforce_for_root'),
      description: 'Применять политику паролей к пользователю root',
    }

    // 4. Минимальная длина пароля
    const minlenMatch = pamCracklibLine.match(/minlen=(\d+)/)
    policy.minLength = {
      value: minlenMatch ? parseInt(minlenMatch[1]) : 0,
      description: 'Минимальная длина пароля',
    }

    // 5-9. Проверки символов (преобразуем отрицательные значения в положительные)
    const lcreditMatch = pamCracklibLine.match(/lcredit=(-?\d+)/)
    policy.lowercaseChars = {
      value: lcreditMatch ? normalizeValue(parseInt(lcreditMatch[1])) : 0,
      description: 'Количество строчных букв',
    }

    const ucreditMatch = pamCracklibLine.match(/ucredit=(-?\d+)/)
    policy.uppercaseChars = {
      value: ucreditMatch ? normalizeValue(parseInt(ucreditMatch[1])) : 0,
      description: 'Количество заглавных букв',
    }

    const dcreditMatch = pamCracklibLine.match(/dcredit=(-?\d+)/)
    policy.dcredit = {
      value: dcreditMatch ? normalizeValue(parseInt(dcreditMatch[1])) : 0,
      description: 'Количество цифр',
    }

    const difokMatch = pamCracklibLine.match(/difok=(\d+)/)
    policy.difok = {
      value: difokMatch ? parseInt(difokMatch[1]) : 0,
      description: 'Минимальное количество измененных символов',
    }

    const ocreditMatch = pamCracklibLine.match(/ocredit=(-?\d+)/)
    policy.otherChars = {
      value: ocreditMatch ? normalizeValue(parseInt(ocreditMatch[1])) : 0,
      description: 'Количество специальных символов',
    }
  }

  // Если нет pam_pwhistory, проверяем pam_unix
  if (!pamPwhistoryLine && pamUnixLine) {
    policy.passwordHistory = {
      value: pamUnixLine.includes('remember'),
      description: 'Хранение истории паролей',
    }

    const rememberMatch = pamUnixLine.match(/remember=(\d+)/)
    policy.storedPasswords = {
      value: rememberMatch ? parseInt(rememberMatch[1]) : 0,
      description: 'Количество хранимых паролей',
    }

    policy.rootEnforcement = {
      value: pamUnixLine.includes('enforce_for_root'),
      description: 'Применять историю паролей к root',
    }
  }

  // Парсим /etc/pam.d/common-auth
  const pamTallyLine = commonAuth.split('\n').find((line) => line.includes('pam_tally.so'))

  if (pamTallyLine) {
    // 13. Индивидуальные настройки
    policy.perUserSettings = {
      value: pamTallyLine.includes('per_user'),
      description: 'Индивидуальный счетчик неудачных попыток для каждого пользователя',
    }

    // 14. Не сбрасывать счетчик
    policy.noReset = {
      value: pamTallyLine.includes('no_reset'),
      description: 'Не сбрасывать счетчик неудачных попыток',
    }

    // 15. Исключение root
    policy.magicRoot = {
      value: pamTallyLine.includes('magic_root'),
      description: 'Не учитывать неудачные попытки для root',
    }

    // 16. Количество неудачных попыток
    const denyMatch = pamTallyLine.match(/deny=(\d+)/)
    policy.failedAttempts = {
      value: denyMatch ? parseInt(denyMatch[1]) : 0,
      description: 'Количество неудачных попыток до блокировки',
    }

    // 17. Время блокировки
    const lockTimeMatch = pamTallyLine.match(/lock_time=(\d+)/)
    policy.lockTime = {
      value: lockTimeMatch ? parseInt(lockTimeMatch[1]) : 0,
      description: 'Время блокировки в секундах',
    }

    // 18. Время разблокировки
    const unlockTimeMatch = pamTallyLine.match(/unlock_time=(\d+)/)
    policy.unlockTime = {
      value: unlockTimeMatch ? parseInt(unlockTimeMatch[1]) : 0,
      description: 'Время автоматической разблокировки в секундах',
    }
  }

  // Парсим /etc/login.defs
  // 19-21. Политика старения паролей
  const maxDaysMatch = loginDefs.match(/PASS_MAX_DAYS\s+(\d+)/)
  policy.PASS_MAX_DAYS = {
    value: maxDaysMatch ? parseInt(maxDaysMatch[1]) : 0,
    description: 'Максимальное количество дней действия пароля',
  }

  const minDaysMatch = loginDefs.match(/PASS_MIN_DAYS\s+(\d+)/)
  policy.PASS_MIN_DAYS = {
    value: minDaysMatch ? parseInt(minDaysMatch[1]) : 0,
    description: 'Минимальное количество дней между сменами пароля',
  }

  const warnAgeMatch = loginDefs.match(/PASS_WARN_AGE\s+(\d+)/)
  policy.PASS_WARN_AGE = {
    value: warnAgeMatch ? parseInt(warnAgeMatch[1]) : 0,
    description: 'Количество дней предупреждения перед истечением срока пароля',
  }

  // Если какие-то значения не были найдены, устанавливаем defaults
  const defaultValues: Partial<PasswordPolicy> = {
    passwordHistory: { value: false, description: 'История паролей не настроена' },
    storedPasswords: { value: 0, description: 'Не настроено' },
    rootEnforcement: { value: false, description: 'Не применяется' },
  }

  // Заполняем отсутствующие значения дефолтными
  Object.keys(defaultValues).forEach((key) => {
    if (!policy[key as keyof PasswordPolicy]) {
      policy[key as keyof PasswordPolicy] = defaultValues[key as keyof PasswordPolicy]
    }
  })

  return policy as PasswordPolicy
}
