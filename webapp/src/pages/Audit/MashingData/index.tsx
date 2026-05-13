import { useState } from 'react'

import { Segment } from '../../../components/Segment'
import { trpc } from '../../../lib/trpc'

import css from './index.module.scss'

// Тип для политики
type MashingDataPolicy = {
  version: string
  name: string
  description: string
  policy: {
    [key: string]: {
      description: string
      value: string
      severity: string
    }
  }
}

type ScanResult = {
  success: boolean
  message: string
  error?: string | null
  rawOutput?: string | null
  policy?: MashingDataPolicy | null
}

export const MashingDataPage = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const scanMutation = trpc.scanMashingData.useMutation({
    onSuccess: (data) => {
      setScanResult(data as ScanResult)
      if (data.policy) {
        sessionStorage.setItem('mashingData', JSON.stringify(data.policy))
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

  const getStatusIcon = (value: string): string => {
    return value === 'АКТИВНО' ? '✅' : '❌'
  }

  const getServiceName = (key: string): string => {
    const names: Record<string, string> = {
      'astra-secdel-control': 'Служба гарантированного удаления данных',
      'astra-swapwiper-control': 'Служба очистки раздела подкачки',
    }
    return names[key] || key
  }

  const isAnyActive = (policy: MashingDataPolicy): boolean => {
    return Object.values(policy.policy).some(
      (item) => item.value === 'АКТИВНО'
    )
  }

  const isAllActive = (policy: MashingDataPolicy): boolean => {
    return Object.values(policy.policy).every(
      (item) => item.value === 'АКТИВНО'
    )
  }

  return (
    <Segment title="Затирание данных">
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>Статус служб гарантированного удаления данных</h2>
          <p className={css.subtitle}>
            Проверка состояния служб затирания данных в системе Astra Linux
          </p>
        </div>

        <div className={css.controls}>
          <button
            onClick={handleScan}
            disabled={scanMutation.isPending}
            className={css.scanButton}
          >
            {scanMutation.isPending
              ? 'Проверка статуса...'
              : '🔄 Проверить статус служб затирания'}
          </button>

          {scanMutation.isPending && (
            <div className={css.loading}>
              <span className={css.loadingSpinner}></span>
              Выполняется проверка статуса служб...
            </div>
          )}
        </div>

        {scanResult?.policy && (
          <div className={css.result}>
            <div
              className={`${css.resultHeader} ${
                scanResult.success ? css.success : css.error
              }`}
            >
              <div className={css.resultStatus}>
                <span className={css.resultIcon}>
                  {scanResult.success ? '✅' : '❌'}
                </span>
                <div>
                  <h3 className={css.resultMessage}>{scanResult.policy.name}</h3>
                  <p className={css.resultDescription}>
                    {scanResult.policy.description}
                  </p>
                  <span className={css.resultVersion}>
                    Версия: {scanResult.policy.version}
                  </span>
                  {scanResult.success && (
                    <p className={css.summary}>
                      {isAllActive(scanResult.policy)
                        ? '✅ Все службы активны'
                        : isAnyActive(scanResult.policy)
                        ? '⚠️ Некоторые службы неактивны'
                        : '❌ Все службы неактивны'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className={css.servicesSection}>
              <h4 className={css.sectionTitle}>Детальный статус служб:</h4>

              <div className={css.servicesGrid}>
                {Object.entries(scanResult.policy.policy).map(
                  ([serviceKey, serviceData]) => {
                    const isActive = serviceData.value === 'АКТИВНО'

                    return (
                      <div
                        key={serviceKey}
                        className={`${css.serviceCard} ${
                          isActive ? css.active : css.inactive
                        }`}
                      >
                        <div className={css.serviceHeader}>
                          <div className={css.serviceIcon}>
                            {getStatusIcon(serviceData.value)}
                          </div>
                          <div>
                            <h5 className={css.serviceName}>
                              {getServiceName(serviceKey)}
                            </h5>
                            <p className={css.serviceDescription}>
                              {serviceData.description}
                            </p>
                          </div>
                        </div>

                        <div className={css.serviceStatus}>
                          <span
                            className={`${css.statusBadge} ${
                              isActive ? css.statusActive : css.statusInactive
                            } ${getSeverityClass(serviceData.severity)}`}
                          >
                            {serviceData.value}
                          </span>
                        </div>

                        <div className={css.serviceDetails}>
                          <div className={css.statusRow}>
                            <span className={css.statusLabel}>
                              Идентификатор:
                            </span>
                            <span className={css.statusValue}>
                              {serviceKey}
                            </span>
                          </div>
                          <div className={css.statusRow}>
                            <span className={css.statusLabel}>
                              Уровень критичности:
                            </span>
                            <span className={`${css.statusValue} ${getSeverityClass(serviceData.severity)}`}>
                              {serviceData.severity === 'high' ? 'Высокий' : 
                               serviceData.severity === 'medium' ? 'Средний' : 'Низкий'}
                            </span>
                          </div>

                          {!isActive && (
                            <div className={css.recommendation}>
                              <span className={css.recommendationType}>
                                ⚠️ Требуется действие
                              </span>
                              <code className={css.actionCommand}>
                                sudo systemctl start {serviceKey}
                              </code>
                              <code className={css.actionCommand}>
                                sudo astra-secdel-swapwiper start
                              </code>
                            </div>
                          )}

                          {isActive && (
                            <div className={css.recommendationSuccess}>
                              <span className={css.recommendationSuccessType}>
                                ✅ Служба работает корректно
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </div>

            {scanResult.error && (
              <div className={css.errorSection}>
                <h4 className={css.errorTitle}>Ошибка при анализе:</h4>
                <pre className={css.errorOutput}>{scanResult.error}</pre>
              </div>
            )}

            {scanResult.rawOutput && (
              <div className={css.rawOutputSection}>
                <details className={css.details}>
                  <summary className={css.detailsSummary}>
                    <span>📄 Показать сырой вывод команды</span>
                  </summary>
                  <pre className={css.rawOutput}>{scanResult.rawOutput}</pre>
                </details>
              </div>
            )}

            <div className={css.infoSection}>
              <h4 className={css.infoTitle}>Важная информация:</h4>
              <ul className={css.infoList}>
                <li>
                  <strong>astra-secdel-control</strong> - служба гарантированного
                  удаления данных с накопителей HDD. Неэффективна на SSD.
                </li>
                <li>
                  <strong>astra-swapwiper-control</strong> - служба очистки
                  раздела подкачки (swap) от конфиденциальных данных при
                  выключении системы.
                </li>
                <li>
                  Для активации служб при загрузке выполните:
                  <code>
                    sudo systemctl enable astra-secdel-control
                    astra-swapwiper-control
                  </code>
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
              Нажмите кнопку выше, чтобы проверить состояние служб
              гарантированного удаления данных в системе Astra Linux.
            </p>
          </div>
        )}
      </div>
    </Segment>
  )
}