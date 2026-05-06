import * as yup from 'yup'

export const scanEventRegistrationTrpcInput = yup.object({
  scan: yup.boolean().required(),
})
