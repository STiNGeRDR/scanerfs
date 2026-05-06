import * as yup from 'yup'

export const scanDeviceControlTrpcInput = yup.object({
  scan: yup.boolean().required(),
})
