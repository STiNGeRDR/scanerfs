import { useState } from 'react'

import { Segment } from '../../../components/Segment'
import { trpc } from '../../../lib/trpc'

import css from './index.module.scss'

type ServiceStatus = {
  service: string
  status: string
}

type ScanResult = {
  success: boolean
  message: string
  error?: string | null
  output?: string | null
  services?: {
    'astra-secdel-control'?: { active: boolean; status: string }
    'astra-swapwiper-control'?: { active: boolean; status: string }
  }
  allActive?: boolean
}

export const MashingDataPage = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const scanMutation = trpc.scanMashingData.useMutation({
    onSuccess: (data) => {
      setScanResult(data as ScanResult)
      sessionStorage.setItem('mashingData', JSON.stringify(data))
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

  const parseStatusOutput = (output: string): ServiceStatus[] => {
    if (!output) {
      return []
    }
    const lines = output.split('\n').filter((line) => line.trim())
    return lines.map((line) => {
      const parts = line.split(':').map((s) => s.trim())
      if (parts.length >= 2) {
        return { service: parts[0], status: parts[1] }
      }
      return { service: 'Неизвестно', status: line }
    })
  }

  const getServiceIcon = (active: boolean) => {
    return active ? '🔒' : '🔓'
  }

  const getServiceDescription = (serviceName: string): string => {
    const descriptions: Record<string, string> = {
      'astra-secdel-control': 'Гарантированное удаление данных с HDD',
      'astra-swapwiper-control': 'Очистка раздела подкачки (swap)',
    }
    return descriptions[serviceName] || 'Служба затирания данных'
  }

  return (
    <Segment title="Затирание данных">
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>Статус служб гарантированного удаления данных</h2>
          <p className={css.subtitle}>Проверка состояния служб затирания данных в системе Astra Linux</p>
        </div>

        <div className={css.controls}>
          <button onClick={handleScan} disabled={scanMutation.isPending} className={css.scanButton}>
            {scanMutation.isPending ? 'Проверка статуса...' : '🔄 Проверить статус служб затирания'}
          </button>

          {scanMutation.isPending && (
            <div className={css.loading}>
              <span className={css.loadingSpinner}></span>
              Выполняется проверка статуса служб...
            </div>
          )}
        </div>

        {scanResult && (
          <div className={css.result}>
            <div className={`${css.resultHeader} ${scanResult.success ? css.success : css.error}`}>
              <div className={css.resultStatus}>
                <span className={css.resultIcon}>{scanResult.success ? '✅' : '❌'}</span>
                <div>
                  <h3 className={css.resultMessage}>{scanResult.message}</h3>
                  {scanResult.allActive !== undefined && (
                    <p className={css.summary}>
                      {scanResult.allActive ? 'Все службы активны ✓' : 'Некоторые службы неактивны'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {scanResult.output && (
              <div className={css.servicesSection}>
                <h4 className={css.sectionTitle}>Детальный статус служб:</h4>

                <div className={css.servicesGrid}>
                  {parseStatusOutput(scanResult.output).map((service, index) => {
                    const isActive = service.status === 'АКТИВНО'

                    return (
                      <div key={index} className={`${css.serviceCard} ${isActive ? css.active : css.inactive}`}>
                        <div className={css.serviceHeader}>
                          <div className={css.serviceIcon}>{getServiceIcon(isActive)}</div>
                          <div>
                            <h5 className={css.serviceName}>{service.service}</h5>
                            <p className={css.serviceDescription}>{getServiceDescription(service.service)}</p>
                          </div>
                        </div>

                        <div className={css.serviceStatus}>
                          <span className={`${css.statusBadge} ${isActive ? css.statusActive : css.statusInactive}`}>
                            {service.status}
                          </span>
                        </div>

                        <div className={css.serviceDetails}>
                          <div className={css.statusRow}>
                            <span className={css.statusLabel}>Текущее состояние:</span>
                            <span className={`${css.statusValue} ${isActive ? css.active : css.inactive}`}>
                              {service.status}
                            </span>
                          </div>

                          {!isActive && (
                            <div className={css.recommendation}>
                              <span className={css.recommendationType}>⚠️ Требуется действие</span>
                              <code className={css.actionCommand}>sudo systemctl start {service.service}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {scanResult.error && (
              <div className={css.errorSection}>
                <h4 className={css.errorTitle}>Ошибка при анализе:</h4>
                <pre className={css.errorOutput}>{scanResult.error}</pre>
              </div>
            )}

            <div className={css.infoSection}>
              <h4 className={css.infoTitle}>Важная информация:</h4>
              <ul className={css.infoList}>
                <li>
                  <strong>astra-secdel-control</strong> - служба гарантированного удаления данных с накопителей HDD.
                  Неэффективна на SSD.
                </li>
                <li>
                  <strong>astra-swapwiper-control</strong> - служба очистки раздела подкачки (swap) от конфиденциальных
                  данных при выключении системы.
                </li>
                <li>
                  Для активации служб при загрузке выполните:
                  <code>sudo systemctl enable astra-secdel-control astra-swapwiper-control</code>
                </li>
                <li>
                  Для ручного запуска всех служб:
                  <code>sudo astra-secdel-swapwiper start</code>
                </li>
                <li>
                  Для проверки статуса:
                  <code>sudo astra-secdel-swapwiper status</code>
                </li>
              </ul>
            </div>
          </div>
        )}

        {!scanResult && !scanMutation.isPending && (
          <div className={css.initialState}>
            <div className={css.initialIcon}>🧹</div>
            <h3 className={css.initialTitle}>Начните проверку статуса служб</h3>
            <p className={css.initialText}>
              Нажмите кнопку выше, чтобы проверить состояние служб гарантированного удаления данных в системе Astra
              Linux.
            </p>
          </div>
        )}
      </div>
    </Segment>
  )
}
