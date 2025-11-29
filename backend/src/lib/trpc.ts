import { initTRPC } from '@trpc/server'
import { type TrpcRouter } from '../router/index'
import * as trpcExpress from '@trpc/server/adapters/express'
import { type Express } from 'express'
import { type AppContext } from './ctx'
import { type ExpressRequest } from '../utils/types'

const getCreateTrpcContext =
  (appContext: AppContext) =>
  ({ req }: trpcExpress.CreateExpressContextOptions) => ({
    ...appContext,
    me: (req as ExpressRequest).user || null,
  })

export type TrpcContext = Awaited<ReturnType<ReturnType<typeof getCreateTrpcContext>>>
// Инициализация tRPC
export const trpc = initTRPC.context<TrpcContext>().create()
export const applyTrpcToExpressApp = async (expressApp: Express, appContext: AppContext, trpcRouter: TrpcRouter) => {
  expressApp.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: trpcRouter,
      createContext: getCreateTrpcContext(appContext),
    })
  )
}
