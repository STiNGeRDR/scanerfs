import * as yup from 'yup'

export const scanPasswordPolicyTrpcInput = yup.object({
  scan: yup.boolean().required(),
})
