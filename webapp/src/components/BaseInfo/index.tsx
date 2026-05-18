import { useEffect, useState } from 'react'

import { trpc } from '../../lib/trpc'

import css from './index.module.scss'

type UserInfo = {
  username: string
  uid: string
  gid: string
  home: string
  shell: string
}

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
      output?: UserInfo[]
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

  const getUsersList = (): UserInfo[] => {
    if (!info?.services.userArray.output) {return []}
    return info.services.userArray.output
  }

  const users = getUsersList()

  return (
    <div className={css.mainContainer}>
      {info ? (
        <>
          <div className={css.infoGrid}>
            <div className={css.blockInfo}>
              <div className={css.blockIcon}>🛰</div>
              <div className={css.blockContent}>
                <p className={css.blockLabel}>IP адрес АРМ</p>
                <p className={css.blockValue}>{info.services.IPInfo.output?.split(' ')[0] || 'Не определен'}</p>
              </div>
            </div>
            <div className={css.blockInfo}>
              <div className={css.blockIcon}>🖥</div>
              <div className={css.blockContent}>
                <p className={css.blockLabel}>Имя хоста</p>
                <p className={css.blockValue}>{info.services.nameUser.output?.split(' ')[0] || 'Не определен'}</p>
              </div>
            </div>
            <div className={css.blockInfo}>
              <div className={css.blockIcon}>📊</div>
              <div className={css.blockContent}>
                <p className={css.blockLabel}>Всего пользователей</p>
                <p className={css.blockValue}>{users.length}</p>
              </div>
            </div>
          </div>

          {users.length > 0 && (
            <div className={css.usersSection}>
              <h3 className={css.usersTitle}>
                Список пользователей системы
              </h3>
              <div className={css.tableWrapper}>
                <table className={css.usersTable}>
                  <thead>
                    <tr>
                      <th>Имя пользователя</th>
                      <th>UID</th>
                      <th>GID</th>
                      <th>Домашняя директория</th>
                      <th>Оболочка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={index}>
                        <td className={css.username}>{user.username}</td>
                        <td>{user.uid}</td>
                        <td>{user.gid}</td>
                        <td className={css.homeDir}>{user.home}</td>
                        <td className={css.shell}>{user.shell}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

export default BaseInfo