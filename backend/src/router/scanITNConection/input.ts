import * as yup from 'yup'

export const scanITNConnectionTrpcInput = yup.object({
  scan: yup.boolean().required(),
})
