import { useState } from 'react'

import { Segment } from '../../../components/Segment'
import { trpc } from '../../../lib/trpc'

import css from './index.module.scss'

export const AccountingSettingsPage = () => {
  const [scanResult, setScanResult] = useState<any>(null)
  
  const scanMutation = trpc.scanAccountingSettings.useMutation({
    onSuccess: (data:any) => {
      setScanResult(data)
    },
    onError: (error:any) => {
      setScanResult({
        success: false,
        message: 'Ошибка запроса',
        error: error.message
      })
    }
  })

  const handleScan = () => {
    scanMutation.mutate({ scan: true })
  }

  const formatStatus = (active: boolean) => {
    return active ? 'АКТИВНО' : 'НЕАКТИВНО'
  }

  const formatTimeout = (seconds: number) => {
    if (seconds <= 0) {return 'Не установлено'}
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${seconds} сек (${minutes} мин ${remainingSeconds} сек)`
  }

  // ИСПРАВЛЕНО: Используем только groupList, не value
  const formatExtraGroups = (setting: any) => {
    if (setting?.groupList && Array.isArray(setting.groupList) && setting.groupList.length > 0) {
      return setting.groupList.join(', ')
    }
    return 'Не установлено'
  }

  const settingsList = [
    {
      key: 'dhome',
      label: 'Местонахождение домашнего каталога (DHOME)',
      type: 'path'
    },
    {
      key: 'skel',
      label: 'Каталог шаблонов (SKEL)',
      type: 'path'
    },
    {
      key: 'dshell',
      label: 'Оболочка (DSHELL)',
      type: 'path'
    },
    {
      key: 'usersGid',
      label: 'Первичная группа (USERS_GID)',
      type: 'string'
    },
    {
      key: 'usergroups',
      label: 'Создавать пользовательскую группу (USERGROUPS)',
      type: 'boolean'
    },
    {
      key: 'addExtraGroups',
      label: 'Добавлять пользовательские группы (ADD_EXTRA_GROUPS)',
      type: 'boolean'
    },
    {
      key: 'extraGroups',
      label: 'Дополнительные группы (EXTRA_GROUPS)',
      type: 'extragroups'
    },
    {
      key: 'screenSaverDelay',
      label: 'Блокирование сеанса после бездействия (ScreenSaverDelay)',
      type: 'timeout'
    }
  ]

  return (
    <Segment title="Параметры учетных записей">
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>Анализ параметров учетных записей</h2>
          <p className={css.subtitle}>
            Проверка настроек создания учетных записей в /etc/adduser.conf и параметров блокировки в Fly
          </p>
        </div>

        <div className={css.controls}>
          <button 
            onClick={handleScan} 
            disabled={scanMutation.isPending}
            className={css.scanButton}
          >
            {scanMutation.isPending ? 'Анализ выполняется...' : '👤 Проанализировать учетные записи'}
          </button>
          
          {scanMutation.isPending && (
            <div className={css.loading}>
              <span className={css.loadingSpinner}></span>
              Чтение конфигурационных файлов...
            </div>
          )}
        </div>

        {scanResult && (
          <div className={css.result}>
            <div className={`${css.resultHeader} ${scanResult.success ? css.success : css.error}`}>
              <div className={css.resultStatus}>
                <span className={css.resultIcon}>
                  {scanResult.success ? '✅' : '❌'}
                </span>
                <div>
                  <h3 className={css.resultMessage}>{scanResult.message}</h3>
                </div>
              </div>
            </div>
            
            {scanResult.success && scanResult.settings && (
              <div className={css.settingsResults}>
                <div className={css.settingsGroup}>
                  <div className={css.settingsItems}>
                    {settingsList.map((item, index) => {
                      const setting = scanResult.settings[item.key]
                      if (!setting) {return null}
                      
                      // ИСПРАВЛЕНО: Не используем setting.value для extragroups
                      let displayValue = ''
                      let statusClass = ''
                      
                      if (item.type === 'boolean') {
                        displayValue = formatStatus(setting.active)
                        statusClass = setting.active ? css.active : css.inactive
                      } else if (item.type === 'timeout') {
                        displayValue = formatTimeout(setting.value)
                      } else if (item.type === 'extragroups') {
                        displayValue = formatExtraGroups(setting)
                        if (setting?.groupList?.length > 0) {
                          statusClass = css.active
                        }
                      } else {
                        displayValue = setting.value || 'Не установлено'
                      }
                      
                      return (
                        <div key={index} className={css.settingItem}>
                          <div className={css.itemHeader}>
                            <span className={css.itemLabel}>{item.label}</span>
                            <span className={`${css.itemValue} ${statusClass}`}>
                              {displayValue}
                            </span>
                          </div>
                          <div className={css.itemDescription}>
                            {setting.description}
                            {item.type === 'extragroups' && setting?.groupList?.length > 0 && (
                              <div className={css.groupTags}>
                                {setting.groupList.map((group: string, i: number) => (
                                  <span key={i} className={css.groupTag}>{group}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className={css.fileInfo}>
                  <h5 className={css.fileTitle}>Проанализированные файлы:</h5>
                  <ul className={css.fileList}>
                    <li><code>/etc/adduser.conf</code> - параметры создания пользователей</li>
                    <li><code>/usr/share/fly-wm/theme/default.themerc</code> - настройки Fly (ScreenSaverDelay)</li>
                  </ul>
                </div>
              </div>
            )}
            
            {scanResult.error && (
              <div className={css.errorSection}>
                <h4 className={css.errorTitle}>Ошибка при анализе:</h4>
                <div className={css.errorMessage}>
                  {scanResult.error}
                </div>
              </div>
            )}
            
            {scanResult.success && scanResult.rawFiles && (
              <div className={css.rawFilesSection}>
                <details className={css.details}>
                  <summary className={css.detailsSummary}>
                    <span>📄 Показать содержимое файлов</span>
                  </summary>
                  <div className={css.rawFiles}>
                    {Object.entries(scanResult.rawFiles).map(([filename, content]) => (
                      <div key={filename} className={css.rawFile}>
                        <h6 className={css.rawFileTitle}>{filename}</h6>
                        <pre className={css.rawFileContent}>
                          {content as string}
                        </pre>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
        
        {!scanResult && !scanMutation.isPending && (
          <div className={css.initialState}>
            <div className={css.initialIcon}>👥</div>
            <h3 className={css.initialTitle}>Начните анализ учетных записей</h3>
            <p className={css.initialText}>
              Нажмите кнопку выше, чтобы проанализировать настройки создания учетных записей
              и параметры блокировки сеансов в системе Astra Linux.
            </p>
          </div>
        )}
      </div>
    </Segment>
  )
}

