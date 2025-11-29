import cn from 'classnames'
import type { FormikProps } from 'formik'

import css from './index.module.scss'

export const Input = ({
  name,
  label,
  formik,
  type = 'text',
  maxWidth,
}: {
  name: string
  label: string
  type?: 'text' | 'password'
  formik: FormikProps<any>
  maxWidth?: number
}) => {
  // Получаем текущее значение поля из состояния Formik
  const value = formik.values[name]
  // Получаем ошибку валидации для этого поля (если есть)
  const error = formik.errors[name] as string | undefined
  // Проверяем, было ли поле "затронуто" (пользователь фокусировался и ушёл)
  const touched = formik.touched[name]
  // Отключаем поле, если форма находится в процессе отправки
  const disabled = formik.isSubmitting
  // Поле считается недействительным, если есть ошибка И поле было затронуто
  const invalid = !!error && !!touched

  return (
    <div className={cn({ [css.field]: true, [css.disabled]: disabled })}>
      {/* Связываем label с input через htmlFor/id для улучшения доступности */}
      <label className={css.label} htmlFor={name}>
        {label}
      </label>
      <input
        className={cn({ [css.input]: true, [css.invalid]: invalid })}
        style={{ maxWidth }}
        type={type}
        onChange={(e) => {
          // Обновляем значение поля в Formik при изменении
          // void используется, чтобы избежать предупреждений о неиспользуемом Promise (setFieldValue возвращает Promise)
          void formik.setFieldValue(name, e.target.value)
        }}
        onBlur={() => {
          // Помечаем поле как "затронутое" при потере фокуса
          void formik.setFieldTouched(name)
        }}
        value={value}
        name={name}
        id={name}
        disabled={disabled}
      />
      {/* Отображаем сообщение об ошибке только если поле недействительно */}
      {invalid && <div className={css.error}>{error}</div>}
    </div>
  )
}
