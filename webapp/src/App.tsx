import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { Layout } from './components/layout'
import * as routes from './lib/routes'
import { TrpcProvider } from './lib/trpc'
import './styles/global.scss'
import { HomePage } from './pages/HomePage'

export const App = () => {
  return (
    <TrpcProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path={routes.getHomePageRoute()} element={<HomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TrpcProvider>
  )
}
