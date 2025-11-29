import crypto from 'crypto'
import { env } from '../lib/env'

// ⚠️ Это упрощённый подход — в продакшене рекомендуется использовать bcrypt/scrypt/argon2
export const getPasswordHash = (password: string) => {
  return crypto.createHash('sha256').update(`${env.PASSWORD_SALT}${password}`).digest('hex')
}
