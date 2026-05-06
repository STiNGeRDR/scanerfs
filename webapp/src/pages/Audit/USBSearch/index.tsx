import { useState, useEffect } from 'react'

import { Segment } from '../../../components/Segment'
import { trpc } from '../../../lib/trpc'

import css from './index.module.scss'

type USBDevice = {
  date: string
  time: string
  vendor: string
  product: string
  vendorName: string
  productName: string
  serialNumber: string
  deviceType: string
}

type USBDataResponse = {
  success: boolean
  message: string
  devices: USBDevice[]
  count: number
  output?: string
  error?: string
  source?: string
}

type SortField = 'date' | 'time' | 'productName' | 'vendorName' | 'serialNumber' | 'deviceType'
type SortOrder = 'asc' | 'desc'

const USBSearchPage = () => {
  const [usbData, setUsbData] = useState<USBDataResponse | null>(null)

  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [sortedDevices, setSortedDevices] = useState<USBDevice[]>([])

  const scanMutation = trpc.scanUSBDevice.useMutation({
    onSuccess: (data: any) => {
      setUsbData({
        success: data.success,
        message: data.message,
        devices: data.devices || [],
        count: data.count || 0,
        output: data.output || undefined,
        error: data.error || undefined,
        source: data.source || undefined,
      })
    },
    onError: (error: any) => {
      console.error('Ошибка:', error)
      setUsbData({
        success: false,
        message: 'Ошибка запроса',
        error: error.message,
        devices: [],
        count: 0,
      })
    },
  })

  useEffect(() => {
    scanMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Сортировка устройств при изменении данных или параметров сортировки
  useEffect(() => {
    if (usbData?.devices && usbData.devices.length > 0) {
      const sorted = [...usbData.devices].sort((a, b) => {
        let valueA: any = a[sortField]
        let valueB: any = b[sortField]

        // Специальная обработка для даты (преобразуем в timestamp)
        if (sortField === 'date') {
          const dateA = parseDateToTimestamp(a.date, a.time)
          const dateB = parseDateToTimestamp(b.date, b.time)
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        }

        // Для строковых полей
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase()
          valueB = valueB.toLowerCase()
        }

        if (valueA < valueB) {
          return sortOrder === 'asc' ? -1 : 1
        }
        if (valueA > valueB) {
          return sortOrder === 'asc' ? 1 : -1
        }
        return 0
      })
      setSortedDevices(sorted)
    } else {
      setSortedDevices([])
    }
  }, [usbData?.devices, sortField, sortOrder])

  // Функция для преобразования даты и времени в timestamp
  const parseDateToTimestamp = (date: string, time: string): number => {
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
      Январь: 0,
      Февраль: 1,
      Март: 2,
      Апрель: 3,
      Май: 4,
      Июнь: 5,
      Июль: 6,
      Август: 7,
      Сентябрь: 8,
      Октябрь: 9,
      Ноябрь: 10,
      Декабрь: 11,
    }

    const dateParts = date.split(' ')
    const month = months[dateParts[0]] || 0
    const day = parseInt(dateParts[1])
    const timeParts = time.split(':')
    const hours = parseInt(timeParts[0])
    const minutes = parseInt(timeParts[1])
    const seconds = parseInt(timeParts[2])

    // Используем текущий год для сравнения
    const currentYear = new Date().getFullYear()
    return new Date(currentYear, month, day, hours, minutes, seconds).getTime()
  }

  // Обработчик клика по заголовку для сортировки
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Получение иконки сортировки
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return '↕️'
    }
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const getDeviceTypeIcon = (deviceType: string) => {
    if (deviceType.includes('Flash Drive')) {
      return '💾'
    }
    if (deviceType.includes('Keyboard')) {
      return '⌨️'
    }
    if (deviceType.includes('Mouse')) {
      return '🖱️'
    }
    if (deviceType.includes('Headset') || deviceType.includes('Audio')) {
      return '🎧'
    }
    if (deviceType.includes('Webcam')) {
      return '📷'
    }
    if (deviceType.includes('Printer')) {
      return '🖨️'
    }
    if (deviceType.includes('Smartphone')) {
      return '📱'
    }
    if (deviceType.includes('Tablet')) {
      return '📟'
    }
    if (deviceType.includes('Bluetooth')) {
      return '📡'
    }
    if (deviceType.includes('Network') || deviceType.includes('WiFi')) {
      return '🌐'
    }
    if (deviceType.includes('Hub')) {
      return '🔌'
    }
    return '🔌'
  }

  const getDeviceTypeColor = (deviceType: string) => {
    if (deviceType.includes('Flash Drive')) {
      return '#27ae60'
    }
    if (deviceType.includes('Keyboard') || deviceType.includes('Mouse')) {
      return '#3498db'
    }
    if (deviceType.includes('Headset') || deviceType.includes('Audio')) {
      return '#9b59b6'
    }
    if (deviceType.includes('Webcam')) {
      return '#e67e22'
    }
    if (deviceType.includes('Printer')) {
      return '#e74c3c'
    }
    if (deviceType.includes('Smartphone') || deviceType.includes('Tablet')) {
      return '#f39c12'
    }
    if (deviceType.includes('Bluetooth')) {
      return '#1abc9c'
    }
    if (deviceType.includes('Network') || deviceType.includes('WiFi')) {
      return '#2c3e50'
    }
    return '#7f8c8d'
  }

  const formatDate = (date: string) => {
    const months: Record<string, string> = {
      Jan: 'Январь',
      Feb: 'Февраль',
      Mar: 'Март',
      Apr: 'Апрель',
      May: 'Май',
      Jun: 'Июнь',
      Jul: 'Июль',
      Aug: 'Август',
      Sep: 'Сентябрь',
      Oct: 'Октябрь',
      Nov: 'Ноябрь',
      Dec: 'Декабрь',
    }

    let formatted = date
    for (const [eng, rus] of Object.entries(months)) {
      if (date.includes(eng)) {
        formatted = date.replace(eng, rus)
        break
      }
    }
    return formatted
  }

  return (
    <Segment title="USB подключения">
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>История USB подключений</h2>
          <p className={css.subtitle}>Полный журнал всех USB устройств, подключавшихся к системе Astra Linux</p>
        </div>

        <div className={css.controls}>
          <button onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending} className={css.refreshButton}>
            {scanMutation.isPending ? 'Обновление...' : '🔄 Обновить'}
          </button>

          {scanMutation.isPending && (
            <div className={css.loading}>
              <span className={css.loadingSpinner}></span>
              Получение информации об USB устройствах...
            </div>
          )}
        </div>

        {usbData && (
          <div className={css.result}>
            <div className={`${css.resultHeader} ${usbData.success ? css.success : css.error}`}>
              <div className={css.resultStatus}>
                <span className={css.resultIcon}>{usbData.success ? '✅' : '❌'}</span>
                <div>
                  <h3 className={css.resultMessage}>{usbData.message}</h3>
                  {usbData.success && (
                    <p className={css.summary}>
                      Найдено USB подключений: {usbData.count}
                      {usbData.source && (
                        <span className={css.sourceInfo}>
                          (Источник: {usbData.source === 'usbSearch' ? 'usbSearch ✓' : 'journalctl'})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {usbData.success && sortedDevices && sortedDevices.length > 0 && (
              <div className={css.devicesSection}>
                <h4 className={css.sectionTitle}>Список USB устройств:</h4>
                <div className={css.devicesTable}>
                  <table className={css.table}>
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('date')} className={css.sortableHeader}>
                          Дата {getSortIcon('date')}
                        </th>
                        <th onClick={() => handleSort('time')} className={css.sortableHeader}>
                          Время {getSortIcon('time')}
                        </th>
                        <th onClick={() => handleSort('productName')} className={css.sortableHeader}>
                          Устройство (Product) {getSortIcon('productName')}
                        </th>
                        <th onClick={() => handleSort('vendorName')} className={css.sortableHeader}>
                          Производитель {getSortIcon('vendorName')}
                        </th>
                        <th onClick={() => handleSort('serialNumber')} className={css.sortableHeader}>
                          Серийный номер {getSortIcon('serialNumber')}
                        </th>
                        <th onClick={() => handleSort('deviceType')} className={css.sortableHeader}>
                          Тип {getSortIcon('deviceType')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDevices.map((device, index) => (
                        <tr key={index} className={css.deviceRow}>
                          <td className={css.dateCell}>{formatDate(device.date)}</td>
                          <td className={css.timeCell}>{device.time}</td>
                          <td className={css.productCell}>
                            <strong>{device.productName}</strong>
                            <span className={css.vidPid}>
                              ({device.vendor}:{device.product})
                            </span>
                          </td>
                          <td className={css.manufacturerCell}>{device.vendorName}</td>
                          <td className={css.serialCell}>
                            <code>{device.serialNumber !== 'Неизвестно' ? device.serialNumber : '—'}</code>
                          </td>
                          <td className={css.typeCell}>
                            <span
                              className={css.deviceTypeBadge}
                              style={{
                                backgroundColor: getDeviceTypeColor(device.deviceType),
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: 'white',
                              }}
                            >
                              <span>{getDeviceTypeIcon(device.deviceType)}</span>
                              <span>{device.deviceType}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {usbData.success && (!usbData.devices || usbData.devices.length === 0) && (
              <div className={css.noDevices}>
                <div className={css.noDevicesIcon}>🔍</div>
                <h4>USB устройства не найдены</h4>
                <p>В системных журналах не обнаружено записей о подключении USB устройств.</p>
              </div>
            )}

            {usbData.error && (
              <div className={css.errorSection}>
                <h4 className={css.errorTitle}>Ошибка при анализе:</h4>
                <div className={css.errorMessage}>{usbData.error}</div>
              </div>
            )}

            {usbData.success && usbData.output && (
              <div className={css.rawOutputSection}>
                <details className={css.details}>
                  <summary className={css.detailsSummary}>
                    <span>📋 Показать сырой вывод usbSearch</span>
                  </summary>
                  <pre className={css.rawOutput}>{usbData.output}</pre>
                </details>
              </div>
            )}
          </div>
        )}

        {!usbData && !scanMutation.isPending && (
          <div className={css.initialState}>
            <div className={css.initialIcon}>🔍</div>
            <h3 className={css.initialTitle}>Анализ USB подключений</h3>
            <p className={css.initialText}>Анализ журнала подключений USB устройств в системе Astra Linux.</p>
            <p className={css.initialTextSmall}>
              Будут отображены все USB устройства: флешки, клавиатуры, мыши, гарнитуры и другие.
            </p>
          </div>
        )}
      </div>
    </Segment>
  )
}

export default USBSearchPage
