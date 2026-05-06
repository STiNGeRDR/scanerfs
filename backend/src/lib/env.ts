import * as dotenv from 'dotenv'
import * as yup from 'yup'

dotenv.config()

const yEnv = yup.object({
  PORT: yup.string().trim().required(),
})

// eslint-disable-next-line node/no-process-env
export const env = yEnv.validateSync(process.env, { stripUnknown: true })
