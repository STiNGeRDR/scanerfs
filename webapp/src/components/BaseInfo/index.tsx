import { useEffect, useState } from 'react'

import { trpc } from '../../lib/trpc'

import css from './index.module.scss'

type BaseInfoResponse = {
  success: boolean
  message: string
  services: {
    IPInfo: {
      name: string
      output?: string
    }
    nameUser: {
      name: string
      output?: string
    }
    userArray: {
      name: string
      output?: string
    }
  }
  error?: string
}

const BaseInfo = () => {
  const [info, setInfo] = useState<BaseInfoResponse>()
  const baseInfo = trpc.scanBaseInfo.useMutation({
    onSuccess: (data) => {
      setInfo(data)
    },
  })
  
  useEffect(() => {
    baseInfo.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={css.mainContainer}>
      {info ? (
        <>
          <div className={css.blockInfo}>
            <p>IP адрес АРМ</p>
            <p>{info.services.IPInfo.output?.split(' ')[0]}</p>
          </div>
          <div className={css.blockInfo}>
            <p>Имя пользователя</p>
            <p>{info.services.nameUser.output?.split(' ')[0]}</p>
          </div>
          <div className={css.blockInfo}>
            <p>IP адрес АРМ</p>
            <p>{info.services.userArray.output?.split(' ')[0]}</p>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default BaseInfo
