import * as dotenv from 'dotenv'
import * as yup from 'yup'

dotenv.config()

const yEnv = yup.object({
  PORT: yup.string().trim().required(),
  DATABASE_URL: yup.string().trim().required(),
  JWT_SECRET: yup.string().trim().required(),
  PASSWORD_SALT: yup.string().trim().required(),
})

// eslint-disable-next-line node/no-process-env
export const env = yEnv.validateSync(process.env, { stripUnknown: true })
