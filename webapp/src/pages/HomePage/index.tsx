import { useEffect, useState } from 'react'

import BaseInfo from '../../components/BaseInfo'
import FileUpload from '../../components/FileUpload'
// import ScanResult from '../../components/ScanResult'
import ScanFileSystem from '../../components/ScanFileSystem'
import { Segment } from '../../components/Segment'
import useScanFullSystem from '../../lib/scanFullSystem'

export const HomePage = () => {
  const [rules, setRules] = useState<any>(null)

  // const [accountingSettingInfo, setAccountingSettingInfo] = useState<any>(null)
  // const [deviceControlInfo, setDeviceControlInfo] = useState<any>(null)
  // const [integrityControlInfo, setIntegrityControlInfo] = useState<any>(null)
  // const [mashingDataInfo, setMashingDataInfo] = useState<any>(null)
  // const [passwordPolicyInfo, setPasswordPolicyInfo] = useState<any>(null)

  useScanFullSystem(
    // setAccountingSettingInfo,
    // setDeviceControlInfo,
    // setIntegrityControlInfo,
    // setMashingDataInfo,
    // setPasswordPolicyInfo
  )


  useEffect(() => {
    const savedRules = sessionStorage.getItem('astra-scanner-rules')
    if (savedRules) {
      setRules(JSON.parse(savedRules))
    }
  }, [])

  return (
    <Segment title="Главная">
      <BaseInfo />
      <FileUpload setRules={setRules} />
      <ScanFileSystem rules={rules} />
    </Segment>
  )
}
