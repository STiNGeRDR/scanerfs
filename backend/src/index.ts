import express from 'express'
import { trpcRouter } from './router/index'
import cors from 'cors'
import { applyTrpcToExpressApp } from './lib/trpc'
import { env } from './lib/env'

void (async () => {
  try {
    const expressApp = express()
    expressApp.use(cors()) // Включаем CORS для всех запросов

    // ВАЖНО: Добавляем tRPC middleware!
    await applyTrpcToExpressApp(expressApp, trpcRouter) // Передаем пустой appContext

    // Простой тестовый endpoint
    expressApp.get('/ping', (req, res) => {
      res.send('<h3>weifb</h3>')
    })

    expressApp.listen(env.PORT, () => {
      console.info(`Listening at http://localhost:${env.PORT}`)
      console.info(`✅ tRPC available at http://localhost:${env.PORT}/trpc`)
    })
  } catch (error) {
    console.error(error)
  }
})()
