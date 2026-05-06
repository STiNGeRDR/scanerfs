import * as yup from 'yup'

export const yAccountingSettingsTrpcInput = yup.object({
  scan: yup.boolean().required(),
})
