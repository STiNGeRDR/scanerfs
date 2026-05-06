import { initTRPC } from '@trpc/server'
import { type TrpcRouter } from '../router/index'
import * as trpcExpress from '@trpc/server/adapters/express'
import { type Express } from 'express'

// Упрощаем - убираем ненужную сложность для начала
export type TrpcContext = {
  // Пока пустой контекст
}

// Инициализация tRPC
export const trpc = initTRPC.context<TrpcContext>().create()

export const applyTrpcToExpressApp = async (
  expressApp: Express,
  // appContext: any, // Временно any
  trpcRouter: TrpcRouter
) => {
  expressApp.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: trpcRouter,
      createContext: () => ({}), // Простой контекст
    })
  )
}
