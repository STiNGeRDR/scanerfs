import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { Layout } from './components/layout'
import * as routes from './lib/routes'
import { TrpcProvider } from './lib/trpc'
import './styles/global.scss'
import { AccountingSettingsPage } from './pages/Audit/AccountingSettings'
import { AdditionalSettingsPage } from './pages/Audit/AdditionalSettings'
import { ClosedSoftwareEnvironmentPage } from './pages/Audit/ClosedSoftwareEnvironment'
import { DeviceControlPage } from './pages/Audit/DeviceControl'
import { IntegrityControlPage } from './pages/Audit/IntegrityControl'
import { MandatoryAccessControlPage } from './pages/Audit/MandatoryAccessControl'
import { MashingDataPage } from './pages/Audit/MashingData'
import { PasswordPolicyPage } from './pages/Audit/PasswordPolicy'
import USBSearchPage from './pages/Audit/USBSearch'
import { CreateJSONFilePage } from './pages/CreateJSONFile'
import { EventRegistrationPage } from './pages/EventRegistration'
import { HomePage } from './pages/HomePage'

export const App = () => {
  return (
    <TrpcProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path={routes.getHomePageRoute()} element={<HomePage />} />
            <Route path={routes.getEventRegistrationPageRoute()} element={<EventRegistrationPage />} />
            <Route path={routes.getCreateJSONFileRoute()} element={<CreateJSONFilePage />} />
            <Route path={routes.getMashingDataRoute()} element={<MashingDataPage />} />
            <Route path={routes.getPassworPolicyRoute()} element={<PasswordPolicyPage />} />
            <Route path={routes.getAccountingSettingsRoute()} element={<AccountingSettingsPage />} />
            <Route path={routes.getDeviceControlRoute()} element={<DeviceControlPage />} />
            <Route path={routes.getIntegrityControlRoute()} element={<IntegrityControlPage />} />
            <Route path={routes.getMandatoryAccessControlRoute()} element={<MandatoryAccessControlPage />} />
            <Route path={routes.getClosedSoftwareEnvironmentRoute()} element={<ClosedSoftwareEnvironmentPage />} />
            <Route path={routes.getAdditionalSettingsRoute()} element={<AdditionalSettingsPage />} />
            <Route path={routes.getUSBSearchRoute()} element={<USBSearchPage/>} />
          </Route>
          A
        </Routes>
      </BrowserRouter>
    </TrpcProvider>
  )
}
