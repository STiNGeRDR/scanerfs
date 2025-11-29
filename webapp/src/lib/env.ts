import * as yup from 'yup'

export const yEnv = yup.object({
  VITE_BACKEND_TRPC_URL: yup.string().trim().required(),
})

type Env = yup.InferType<typeof yEnv>

// eslint-disable-next-line no-restricted-syntax
export const env = yEnv.validateSync(import.meta.env, { stripUnknown: true }) as Env
