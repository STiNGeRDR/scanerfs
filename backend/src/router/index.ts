import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { trpc } from '../lib/trpc'
// @index('./**/index.ts', f => `import { ${f.path.split('/').slice(0, -1).pop()}TrpcRoute } from '${f.path.split('/').slice(0, -1).join('/')}'`)
import { scanAccountingSettingsTrpcRoute } from './scanAccountingSettings'
import { scanBaseInfoTrpcRoute } from './scanBaseInfo'
import { scanDeviceControlTrpcRoute } from './scanDeviceControl'
import { scanEventRegistrationTrpcRoute } from './scanEventRegistration'
import { scanFileSystemTrpcRoute } from './scanFileSystem'
import { scanIntegrityControlTrpcRoute } from './scanIntegrityControl'
import { scanITNConectionTrpcRoute } from './scanITNConection'
import { scanMashingDataTrpcRoute } from './scanMashingData'
import { scanPasswordPolicyTrpcRoute } from './scanPasswordPolicy'
import { scanUSBDeviceTrpcRoute } from './scanUSBDevice'
// @endindex

export const trpcRouter = trpc.router({
  // @index('./**/index.ts', f => `${f.path.split('/').slice(0, -1).pop()}: ${f.path.split('/').slice(0, -1).pop()}TrpcRoute,`)
  scanAccountingSettings: scanAccountingSettingsTrpcRoute,
  scanBaseInfo: scanBaseInfoTrpcRoute,
  scanDeviceControl: scanDeviceControlTrpcRoute,
  scanEventRegistration: scanEventRegistrationTrpcRoute,
  scanFileSystem: scanFileSystemTrpcRoute,
  scanIntegrityControl: scanIntegrityControlTrpcRoute,
  scanITNConection: scanITNConectionTrpcRoute,
  scanMashingData: scanMashingDataTrpcRoute,
  scanPasswordPolicy: scanPasswordPolicyTrpcRoute,
  scanUSBDevice: scanUSBDeviceTrpcRoute,
  // @endindex
})

export type TrpcRouter = typeof trpcRouter
export type TrpcRouterInput = inferRouterInputs<TrpcRouter>
export type TrpcRouterOutput = inferRouterOutputs<TrpcRouter>
