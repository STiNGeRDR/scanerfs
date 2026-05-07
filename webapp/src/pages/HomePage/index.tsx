import { useEffect, useState } from 'react'

import BaseInfo from '../../components/BaseInfo'
import FileUpload from '../../components/FileUpload'
import ScanFileSystem from '../../components/ScanFileSystem'
import { Segment } from '../../components/Segment'
import useScanFullSystem from '../../lib/scanFullSystem'

export const HomePage = () => {
  const [rules, setRules] = useState<any>(null)

  
  useScanFullSystem(
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
