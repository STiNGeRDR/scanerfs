import * as yup from 'yup'

// Схема валидации для правил
export const rulesSchema = yup.object({
  version: yup.string().required('Версия обязательна'),
  name: yup.string().required('Название обязательно'),
  description: yup.string().optional(),
  checks: yup
    .object()
    .required('Проверки обязательны')
    .test('non-empty-checks', 'Должна быть хотя бы одна проверка', (checks) => checks && Object.keys(checks).length > 0)
    .shape({
      // Динамические ключи для проверок
    })
    .test('valid-checks', 'Некорректная структура проверок', (checks) => {
      if (!checks) {
        return false
      }

      return Object.values(checks).every((check) =>
        yup
          .object({
            name: yup.string().required('Название проверки обязательно'),
            description: yup.string().optional(),
            severity: yup.string().oneOf(['high', 'medium', 'low']).optional(),
            files: yup
              .object()
              .optional()
              .test('valid-files', 'Некорректная структура файлов', (files) => {
                if (!files) {
                  return true
                } // files опциональны

                return Object.values(files).every((fileChecks) =>
                  yup
                    .object()
                    .test('valid-parameters', 'Некорректные параметры', (params) => {
                      if (!params) {
                        return true
                      }

                      return Object.values(params).every((param) =>
                        yup
                          .object({
                            expected: yup.string().required('Ожидаемое значение обязательно'),
                            description: yup.string().optional(),
                          })
                          .isValidSync(param)
                      )
                    })
                    .isValidSync(fileChecks)
                )
              }),
          })
          .isValidSync(check)
      )
    }),
})

// Функция валидации
export const validateRules = async (rules: any) => {
  try {
    await rulesSchema.validate(rules, { abortEarly: false })
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return {
        isValid: false,
        errors: error.errors,
      }
    }
    return { isValid: false, errors: ['Неизвестная ошибка валидации'] }
  }
}

export const yChecksTrpsinput = yup.object({
  checks: yup.string().min(1).required(),
})

// Тип для ответа
export type ScanFileSystemResponse = {
  success: boolean
  message: string
  output: string | null
  error: string | null
}
