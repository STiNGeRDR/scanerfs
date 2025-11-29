import { type FormikHelpers, useFormik } from 'formik'
import { useMemo, useState } from 'react'
import { type InferType, type Schema } from 'yup'

import { type AlertProps } from '../components/Alert'
import { type ButtonProps } from '../components/Button'

export const useForm = <TYupSchema extends Schema<any>>({
  successMessage = false,
  resetOnSuccess = true,
  showValidationAlert = false,
  initialValues = {},
  validationSchema,
  onSubmit,
}: {
  successMessage?: string | false
  resetOnSuccess?: boolean
  showValidationAlert?: boolean
  initialValues?: InferType<TYupSchema>
  validationSchema?: TYupSchema
  // eslint-disable-next-line no-unused-vars
  onSubmit: (values: InferType<TYupSchema>, actions: FormikHelpers<InferType<TYupSchema>>) => Promise<any> | any
}) => {
  const [successMessageVisible, setSuccessMessageVisible] = useState(false)
  const [submittingError, setSubmittingError] = useState<Error | null>(null)

  const formik = useFormik<InferType<TYupSchema>>({
    initialValues: initialValues,
    validationSchema, // Yup работает напрямую с Formik
    onSubmit: async (values, formikHelpers) => {
      try {
        setSubmittingError(null)
        await onSubmit(values, formikHelpers)
        if (resetOnSuccess) {
          formik.resetForm()
        }
        setSuccessMessageVisible(true)
        setTimeout(() => {
          setSuccessMessageVisible(false)
        }, 3000)
      } catch (error: any) {
        setSubmittingError(error)
        setTimeout(() => {
          setSubmittingError(null)
        }, 3000)
      }
    },
  })

  const alertProps = useMemo<AlertProps>(() => {
    if (submittingError) {
      return {
        hidden: false,
        children: submittingError.message,
        color: 'red',
      }
    }
    if (showValidationAlert && !formik.isValid && !!formik.submitCount) {
      return {
        hidden: false,
        children: 'Some fields are invalid',
        color: 'red',
      }
    }
    if (successMessageVisible && successMessage) {
      return {
        hidden: false,
        children: successMessage,
        color: 'green',
      }
    }
    return {
      color: 'red',
      hidden: true,
      children: null,
    }
  }, [submittingError, formik.isValid, formik.submitCount, successMessageVisible, successMessage, showValidationAlert])

  const buttonProps = useMemo<Omit<ButtonProps, 'children'>>(() => {
    return {
      loading: formik.isSubmitting,
    }
  }, [formik.isSubmitting])

  return {
    formik,
    alertProps,
    buttonProps,
  }
}
