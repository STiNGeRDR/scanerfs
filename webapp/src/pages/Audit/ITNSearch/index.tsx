import { useState } from 'react'

import { Segment } from '../../../components/Segment'
import { trpc } from '../../../lib/trpc'

import css from './index.module.scss'

type DNSDetails = {
  nameservers: string[]
  searchDomains: string[]
  options: string[]
}

type FileStatDetails = {
  size: number
  blocks: number
  ioBlock: number
  device: string
  inode: number
  links: number
  permissions: string
  uid: number
  gid: number
  accessTime: string
  modifyTime: string
  changeTime: string
  createTime: string
}

type ConnectionDetails = {
  lastModified: string
  timeSinceLastChange: string
  hasRecentChanges: boolean
}

type CheckItem = {
  name: string
  description: string
  status: {
    value: string
    description: string
    severity: string
  }
  details: DNSDetails | FileStatDetails | ConnectionDetails
}

type ITNPolicy = {
  version: string
  name: string
  description: string
  checks: {
    dnsConfiguration: CheckItem
    fileIntegrity: CheckItem
    connectionHistory: CheckItem
  }
}

type ScanResult = {
  success: boolean
  message: string
  error?: string | null
  policy?: ITNPolicy | null
  rawOutput?: {
    stat: string
    resolvConf: string
  } | null
}

export const ITNSearchPage = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const scanMutation = trpc.scanITNConection.useMutation({
    onSuccess: (data) => {
      setScanResult(data as ScanResult)
      if (data.policy) {
        sessionStorage.setItem('itnConnectionPolicy', JSON.stringify(data.policy))
      }
    },
    onError: (error) => {
      setScanResult({
        success: false,
        message: 'Ошибка запроса',
        error: error.message,
      })
    },
  })

  const handleScan = () => {
    scanMutation.mutate({ scan: true })
  }

  const getSeverityClass = (severity: string): string => {
    switch (severity) {
      case 'high':
        return css.highSeverity
      case 'medium':
        return css.mediumSeverity
      case 'low':
        return css.lowSeverity
      default:
        return ''
    }
  }

  const getStatusIcon = (severity: string): string => {
    switch (severity) {
      case 'high':
        return '❌'
      case 'medium':
        return '⚠️'
      case 'low':
        return '✅'
      default:
        return 'ℹ️'
    }
  }

  const renderDNSDetails = (details: DNSDetails) => {
    return (
      <div className={css.detailsBlock}>
        <div className={css.detailRow}>
          <span className={css.detailLabel}>DNS-серверы:</span>
          <div className={css.detailValue}>
            {details.nameservers.length > 0 ? (
              <ul className={css.list}>
                {details.nameservers.map((ns, idx) => (
                  <li key={idx}>{ns}</li>
                ))}
              </ul>
            ) : (
              <span className={css.emptyValue}>Не настроены</span>
            )}
          </div>
        </div>
        <div className={css.detailRow}>
          <span className={css.detailLabel}>Домены поиска:</span>
          <div className={css.detailValue}>
            {details.searchDomains.length > 0 ? (
              <ul className={css.list}>
                {details.searchDomains.map((sd, idx) => (
                  <li key={idx}>{sd}</li>
                ))}
              </ul>
            ) : (
              <span className={css.emptyValue}>Не настроены</span>
            )}
          </div>
        </div>
        <div className={css.detailRow}>
          <span className={css.detailLabel}>Опции:</span>
          <div className={css.detailValue}>
            {details.options.length > 0 ? (
              <ul className={css.list}>
                {details.options.map((opt, idx) => (
                  <li key={idx}>{opt}</li>
                ))}
              </ul>
            ) : (
              <span className={css.emptyValue}>Не заданы</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderFileStatDetails = (details: FileStatDetails) => {
    return (
      <div className={css.detailsBlock}>
        <div className={css.detailGrid}>
          <div className={css.detailItem}>
            <span className={css.detailLabel}>Размер:</span>
            <span className={css.detailValue}>{details.size} байт</span>
          </div>
          <div className={css.detailItem}>
            <span className={css.detailLabel}>Inode:</span>
            <span className={css.detailValue}>{details.inode}</span>
          </div>
          <div className={css.detailItem}>
            <span className={css.detailLabel}>Права доступа:</span>
            <span className={css.detailValue}>{details.permissions}</span>
          </div>
          <div className={css.detailItem}>
            <span className={css.detailLabel}>Владелец:</span>
            <span className={css.detailValue}>
              UID: {details.uid}, GID: {details.gid}
            </span>
          </div>
          <div className={css.detailItem}>
            <span className={css.detailLabel}>Доступ:</span>
            <span className={css.detailValue}>{details.accessTime}</span>
          </div>
          <div className={css.detailItem}>
            <span className={css.detailLabel}>Модифицирован:</span>
            <span className={css.detailValue}>{details.modifyTime}</span>
          </div>
          <div className={css.detailItem}>
            <span className={css.detailLabel}>Изменён:</span>
            <span className={css.detailValue}>{details.changeTime}</span>
          </div>
          <div className={css.detailItem}>
            <span className={css.detailLabel}>Создан:</span>
            <span className={css.detailValue}>{details.createTime}</span>
          </div>
        </div>
      </div>
    )
  }

  const renderConnectionDetails = (details: ConnectionDetails) => {
    return (
      <div className={css.detailsBlock}>
        <div className={css.detailRow}>
          <span className={css.detailLabel}>Последнее изменение:</span>
          <span className={css.detailValue}>{details.lastModified}</span>
        </div>
        <div className={css.detailRow}>
          <span className={css.detailLabel}>Время с последнего изменения:</span>
          <span className={css.detailValue}>{details.timeSinceLastChange}</span>
        </div>
        <div className={css.detailRow}>
          <span className={css.detailLabel}>Недавние изменения:</span>
          <span className={`${css.detailValue} ${details.hasRecentChanges ? css.warning : css.success}`}>
            {details.hasRecentChanges ? 'Да (последние 24 часа)' : 'Нет'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <Segment title="Подключения к ИТКС ОП">
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>Анализ подключения к ИТКС ОП</h2>
          <p className={css.subtitle}>
            Проверка сетевых настроек для определения факта подключения к информационной системе
          </p>
        </div>

        <div className={css.controls}>
          <button onClick={handleScan} disabled={scanMutation.isPending} className={css.scanButton}>
            {scanMutation.isPending ? 'Анализ выполняется...' : '🔍 Проанализировать подключение'}
          </button>

          {scanMutation.isPending && (
            <div className={css.loading}>
              <span className={css.loadingSpinner}></span>
              Анализ файла /etc/resolv.conf...
            </div>
          )}
        </div>

        {scanResult?.policy && (
          <div className={css.result}>
            <div className={`${css.resultHeader} ${scanResult.success ? css.success : css.error}`}>
              <div className={css.resultStatus}>
                <span className={css.resultIcon}>{scanResult.success ? '✅' : '❌'}</span>
                <div>
                  <h3 className={css.resultMessage}>{scanResult.policy.name}</h3>
                  <p className={css.resultDescription}>{scanResult.policy.description}</p>
                  <span className={css.resultVersion}>Версия: {scanResult.policy.version}</span>
                </div>
              </div>
            </div>

            <div className={css.checksSection}>
              {Object.entries(scanResult.policy.checks).map(([checkKey, checkData]) => {
                const isDNS = checkKey === 'dnsConfiguration'
                const isFileIntegrity = checkKey === 'fileIntegrity'
                const isHistory = checkKey === 'connectionHistory'

                let detailsContent = null
                if (isDNS && checkData.details) {
                  detailsContent = renderDNSDetails(checkData.details as DNSDetails)
                } else if (isFileIntegrity && checkData.details) {
                  detailsContent = renderFileStatDetails(checkData.details as FileStatDetails)
                } else if (isHistory && checkData.details) {
                  detailsContent = renderConnectionDetails(checkData.details as ConnectionDetails)
                }

                return (
                  <div key={checkKey} className={css.checkCard}>
                    <div className={css.checkHeader}>
                      <div className={css.checkTitle}>
                        <div className={css.checkIcon}>{getStatusIcon(checkData.status.severity)}</div>
                        <div>
                          <h3>{checkData.name}</h3>
                          <p>{checkData.description}</p>
                        </div>
                      </div>
                      <div className={css.checkStatus}>
                        <span className={`${css.statusBadge} ${getSeverityClass(checkData.status.severity)}`}>
                          {checkData.status.value}
                        </span>
                      </div>
                    </div>

                    <div className={css.checkBody}>
                      <div className={css.statusDescription}>{checkData.status.description}</div>
                      {detailsContent}
                    </div>
                  </div>
                )
              })}
            </div>

            {scanResult.rawOutput && (
              <div className={css.rawOutputSection}>
                <details className={css.details}>
                  <summary className={css.detailsSummary}>
                    <span>📄 Показать сырой вывод команд</span>
                  </summary>
                  <div className={css.rawOutputs}>
                    <div className={css.rawOutputBlock}>
                      <h6>stat /etc/resolv.conf</h6>
                      <pre className={css.rawOutputContent}>{scanResult.rawOutput.stat}</pre>
                    </div>
                    <div className={css.rawOutputBlock}>
                      <h6>cat /etc/resolv.conf</h6>
                      <pre className={css.rawOutputContent}>{scanResult.rawOutput.resolvConf}</pre>
                    </div>
                  </div>
                </details>
              </div>
            )}

            <div className={css.infoSection}>
              <h4 className={css.infoTitle}>Информация о методе анализа:</h4>
              <ul className={css.infoList}>
                <li>
                  <strong>Анализ основан на проверке файла /etc/resolv.conf</strong> — основного конфигурационного файла
                  DNS
                </li>
                <li>
                  <strong>Наличие DNS-серверов</strong> указывает на возможное подключение к сети (включая ИТКС ОП)
                </li>
                <li>
                  <strong>Временные метки файла</strong> позволяют определить, когда были последние изменения в
                  настройках DNS
                </li>
                <li>
                  Для полноценного определения подключения к ИТКС ОП рекомендуется дополнительно проверить:
                  <code>ip route show</code> — наличие маршрутов
                  <code>cat /etc/hosts</code> — статические записи DNS
                  <code>ss -tunap</code> — активные соединения
                </li>
              </ul>
            </div>
          </div>
        )}

        {!scanResult && !scanMutation.isPending && (
          <div className={css.initialState}>
            <div className={css.initialIcon}>🌐</div>
            <h3 className={css.initialTitle}>Начните анализ подключения</h3>
            <p className={css.initialText}>
              Нажмите кнопку выше, чтобы проанализировать настройки DNS и определить возможные факты подключения к ИТКС
              ОП на основе анализа файла <code>/etc/resolv.conf</code>.
            </p>
          </div>
        )}
      </div>
    </Segment>
  )
}
