import type { TrpcRouter } from '@scanerfs/backend/src/router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/react-query'
import Cookies from 'js-cookie'
import React from 'react'

import { env } from './env'

// Создание tRPC клиента с типами из бэкенда
export const trpc = createTRPCReact<TrpcRouter>()

// Настройка QueryClient для react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Не повторять запросы при ошибке
      refetchOnWindowFocus: false, // Не обновлять данные при фокусе окна
    },
  },
})

// Создание tRPC клиента с настройками
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: env.VITE_BACKEND_TRPC_URL, // URL бэкенда
      headers: () => {
        const token = Cookies.get('token')
        return {
          ...(token && { authorization: `Bearer ${token}` }),
        }
      },
    }),
  ],
})

// Провайдер для оборачивания приложения
export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
