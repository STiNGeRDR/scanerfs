import express from 'express'
import { trpcRouter } from './router/index'
import cors from 'cors'
import { applyTrpcToExpressApp } from './lib/trpc'
import { AppContext, createAppContext } from './lib/ctx'
import { applyPassportToExpressApp } from './lib/passport'
import { env } from './lib/env'

void (async () => {
  let ctx: AppContext | null = null
  try {
    ctx = createAppContext()
    const expressApp = express()
    expressApp.use(cors()) // Включаем CORS для всех запросов
    // Простой тестовый endpoint
    expressApp.get('/ping', (req, res) => {
      res.send('<h3>weifb</h3>')
    })
    applyPassportToExpressApp(expressApp, ctx)
    await applyTrpcToExpressApp(expressApp, ctx, trpcRouter)
    expressApp.listen(env.PORT, () => {
      console.info(`Listening at http://localhost:${env.PORT}`)
    })
  } catch (error) {
    console.error(error)
    void ctx?.stop()
  }
})()
