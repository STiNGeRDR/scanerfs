import * as yup from 'yup'

export const scanIntegrityControlTrpcInput = yup.object({
  scan: yup.boolean().required(),
})
