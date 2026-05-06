import * as yup from 'yup'

export const scanMashingDataTrpcInput = yup.object({
  scan: yup.boolean().required(),
})
