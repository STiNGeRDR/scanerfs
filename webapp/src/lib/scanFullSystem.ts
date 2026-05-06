import { useEffect } from 'react'

import { parseAuditRules } from '../pages/EventRegistration'

import { trpc } from './trpc'

type IntegrityRule = {
  path: string
  rule: string
  alias: string
  description: string
  isActive: boolean
  isDirectory: boolean
  isExcluded: boolean
}
type IntegrityControlSettings = {
  rules: IntegrityRule[]
  totalRules: number
  activeRules: number
  excludedRules: number
  directoryRules: number
  aliases: Record<string, string>
  directives: Record<string, string>
}
export type IntegrityControlRule = {
  success: boolean
  message: string
  error?: string | null
  policy: IntegrityControlSettings | null
  rawFiles: Record<string, string> | null
}

export const useScanFullSystem = () => {
  const eventRegistrationinfo = trpc.scanEventRegistration.useMutation({
    onSuccess: (data: any) => {
      if (data.success && data.output) {
        const rawRules = data.output.split('\n').filter((line: any) => line.trim())
        const parsedRules = parseAuditRules(rawRules)
        sessionStorage.setItem('eventRegistration', JSON.stringify(parsedRules))
      }
    },
  })

  const accountingInfo = trpc.scanAccountingSettings.useMutation({
    onSuccess: (data: any) => {
      sessionStorage.setItem('accountingSettings', JSON.stringify(data))
    },
  })

  const deviceControlInfo = trpc.scanDeviceControl.useMutation({
    onSuccess: (data: any) => {
      sessionStorage.setItem('deviceControlInfo', JSON.stringify(data))
    },
  })

  const integrityControlInfo = trpc.scanIntegrityControl.useMutation({
    onSuccess: (data: any) => {
      sessionStorage.setItem('integrityControl', JSON.stringify(data))
    },
  })

  const mashingDataInfo = trpc.scanMashingData.useMutation({
    onSuccess: (data: any) => {
      sessionStorage.setItem('mashingData', JSON.stringify(data))
    },
  })

  const passwordPolicyInfo = trpc.scanPasswordPolicy.useMutation({
    onSuccess: (data) => {
      sessionStorage.setItem('passwordPolicy', JSON.stringify(data))
    },
  })

  useEffect(() => {
    accountingInfo.mutate({ scan: true })
    deviceControlInfo.mutate({ scan: true })
    integrityControlInfo.mutate({ scan: true })
    mashingDataInfo.mutate({ scan: true })
    passwordPolicyInfo.mutate({ scan: true })
    eventRegistrationinfo.mutate({ scan: true })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export default useScanFullSystem
