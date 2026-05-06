// backend/src/router/scanUSBDevice/index.ts
import { promisify } from 'util'
import { trpc } from '../../lib/trpc'
import { exec } from 'child_process'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

// Путь к скрипту usbSearch
const USBSEARCH_PATH = '/home/admsys/scanerfs/backend/usbSearch.sh'

export const scanUSBDeviceTrpcRoute = trpc.procedure.mutation(async () => {
  try {
    let command: string
    let useUsbSearch = false

    if (existsSync(USBSEARCH_PATH)) {
      command = `sudo ${USBSEARCH_PATH}`
      useUsbSearch = true
      console.info('Используем usbSearch для анализа USB устройств')
    } else {
      command = 'journalctl --no-pager | grep -i "New USB device found"'
      console.info('usbSearch не найден, используем journalctl')
    }

    const { stdout, stderr } = await execAsync(command, { timeout: 30000 })

    let devices = []

    if (useUsbSearch) {
      devices = parseUsbSearchOutput(stdout)
    } else {
      devices = parseJournalctlOutput(stdout)
    }

    return {
      success: true,
      message: 'Информация о USB подключениях получена',
      output: stdout,
      error: stderr || null,
      devices: devices,
      count: devices.length,
      source: useUsbSearch ? 'usbSearch' : 'journalctl',
    }
  } catch (error: any) {
    if (error.stdout) {
      const devices = parseUsbSearchOutput(error.stdout)
      return {
        success: true,
        message: 'Информация о USB подключениях получена',
        output: error.stdout,
        error: error.stderr || error.message,
        devices: devices,
        count: devices.length,
        source: 'usbSearch',
      }
    }
    return {
      success: false,
      message: 'Не удалось получить информацию о USB устройствах',
      error: error.message || String(error),
      output: null,
      devices: [],
      count: 0,
      source: null,
    }
  }
})

// Функция для удаления ANSI escape кодов из строки
function cleanAnsi(str: string): string {
  let result = ''
  let i = 0
  while (i < str.length) {
    if (str[i] === '\x1b' || str.charCodeAt(i) === 27) {
      i++
      if (i < str.length && str[i] === '[') {
        i++
        while (i < str.length && (str[i] === ';' || (str[i] >= '0' && str[i] <= '9') || str[i] === '?')) {
          i++
        }
        if (i < str.length) {
          i++
        }
      }
    } else {
      result += str[i]
      i++
    }
  }
  return result.trim()
}

// Функция для определения типа устройства
function getDeviceTypeFromProduct(productName: string, vendor: string): string {
  const product = productName.toLowerCase()

  if (product.includes('disk') || product.includes('flash') || product.includes('drive') || product.includes('udisk')) {
    return 'USB Flash Drive'
  }
  if (product.includes('keyboard') || product.includes('key pad')) {
    return 'Keyboard'
  }
  if (product.includes('mouse') || product.includes('gaming mouse')) {
    return 'Mouse'
  }
  if (product.includes('headset') || product.includes('headphone') || product.includes('audio')) {
    return 'Headset/Audio'
  }
  if (product.includes('webcam') || product.includes('camera')) {
    return 'Webcam'
  }
  if (product.includes('printer')) {
    return 'Printer'
  }
  if (product.includes('tablet') || product.includes('stylus')) {
    return 'Tablet'
  }
  if (product.includes('bluetooth') || product.includes('adapter')) {
    return 'Bluetooth Adapter'
  }
  if (product.includes('hub')) {
    return 'USB Hub'
  }

  // По VID определяем тип
  if (vendor === '046d' || vendor === '045e' || vendor === '09da') {
    return 'Keyboard/Mouse'
  }
  if (vendor === '0c45' || vendor === '1bcf') {
    return 'Webcam'
  }
  if (vendor === '04f9' || vendor === '03f0') {
    return 'Printer'
  }
  if (vendor === '0a12' || vendor === '8087') {
    return 'Bluetooth Adapter'
  }
  if (vendor === '0bda' || vendor === '148f') {
    return 'Network/WiFi Adapter'
  }
  if (vendor === '2717' || vendor === '22b8' || vendor === '12d1') {
    return 'Smartphone'
  }

  return 'USB Device'
}

// Парсинг вывода usbSearch (все устройства)
function parseUsbSearchOutput(output: string): Array<{
  date: string
  time: string
  vendor: string
  product: string
  vendorName: string
  productName: string
  serialNumber: string
  deviceType: string
}> {
  const devices: Array<{
    date: string
    time: string
    vendor: string
    product: string
    vendorName: string
    productName: string
    serialNumber: string
    deviceType: string
  }> = []

  const lines = output.split('\n')

  let currentDevice: any = null

  for (const rawLine of lines) {
    // Очищаем строку от ANSI кодов
    const line = cleanAnsi(rawLine)

    if (
      line === '' ||
      line.includes('---') ||
      line.includes('File') ||
      line.includes('usbSearch') ||
      line.includes('совпадает')
    ) {
      continue
    }

    // Отмечаем USB Mass Storage устройства (для информации, но не фильтруем)
    if (line.includes('USB Mass Storage device')) {
      continue
    }

    // Находим строку с VID и PID
    if (line.startsWith('Дата:') && line.includes('VID:') && line.includes('PID:')) {
      // Сохраняем предыдущее устройство, если оно есть
      if (currentDevice && currentDevice.productName) {
        currentDevice.deviceType = getDeviceTypeFromProduct(currentDevice.productName, currentDevice.vendor)
        devices.push({ ...currentDevice })
      }

      // Парсим строку
      const datePart = line.match(/Дата:\s+(\w+\s+\d+\s+\d+:\d+:\d+)/)
      const vidMatch = line.match(/VID:([0-9a-f]+)/i)
      const pidMatch = line.match(/PID:([0-9a-f]+)/i)

      if (datePart && vidMatch && pidMatch) {
        const fullDate = datePart[1]
        const dateParts = fullDate.split(' ')
        const date = `${dateParts[0]} ${dateParts[1]}`
        const time = dateParts[2]

        currentDevice = {
          date: date,
          time: time,
          vendor: vidMatch[1],
          product: pidMatch[1],
          vendorName: '',
          productName: '',
          serialNumber: '',
          deviceType: 'USB Device',
        }
      }
      continue
    }

    // Парсим Product
    if (currentDevice && line.includes('Product:')) {
      const productMatch = line.match(/Product:\s+(.+)/i)
      if (productMatch) {
        currentDevice.productName = productMatch[1].trim()
      }
      continue
    }

    // Парсим Manufacturer
    if (currentDevice && line.includes('Manufacturer:')) {
      const manufacturerMatch = line.match(/Manufacturer:\s+(.+)/i)
      if (manufacturerMatch) {
        let name = manufacturerMatch[1].trim()
        name = name.replace(/\s+/g, ' ').trim()
        currentDevice.vendorName = name
      }
      continue
    }

    // Парсим SerialNumber
    if (currentDevice && line.includes('SerialNumber:')) {
      const serialMatch = line.match(/SerialNumber:\s+(.+)/i)
      if (serialMatch) {
        let serial = serialMatch[1].trim()
        if (serial === 'Љ' || serial.length < 4 || serial === '0' || serial === '' || serial === '-') {
          serial = 'Неизвестно'
        }
        currentDevice.serialNumber = serial
      }
      continue
    }
  }

  // Сохраняем последнее устройство
  if (currentDevice && currentDevice.productName) {
    currentDevice.deviceType = getDeviceTypeFromProduct(currentDevice.productName, currentDevice.vendor)
    devices.push({ ...currentDevice })
  }

  // Фильтруем только USB Mass Storage? НЕТ - показываем все устройства
  // Просто убираем явно системные устройства
  const filteredDevices = devices.filter((device) => {
    // VID 1d6b - это Linux Foundation (системные USB хабы и контроллеры)
    // Исключаем их, так как это не реальные устройства
    if (device.vendor === '1d6b') {
      return false
    }
    return true
  })

  // Удаляем дубликаты (по времени и продукту)
  const uniqueDevices = []
  const seen = new Set()

  for (const device of filteredDevices) {
    const key = `${device.date}_${device.time}_${device.productName}_${device.vendor}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueDevices.push(device)
    }
  }

  return uniqueDevices
}

// Парсинг вывода journalctl (fallback)
function parseJournalctlOutput(output: string): Array<{
  date: string
  time: string
  vendor: string
  product: string
  vendorName: string
  productName: string
  serialNumber: string
  deviceType: string
}> {
  const devices = []
  const lines = output.split('\n')

  const vendorDatabase: Record<string, string> = {
    '0dd8': 'Netac',
    '048d': 'General',
    '0781': 'SanDisk',
    '090c': 'Samsung',
    '13fe': 'Kingston',
    '0951': 'Kingston Technology',
    '1058': 'Western Digital',
    '046d': 'Logitech',
    '045e': 'Microsoft',
    '05ac': 'Apple',
    '0bda': 'Realtek',
    '2d99': 'C-Media Electronics Inc.',
    '80ee': 'VirtualBox',
    '1d6b': 'Linux Foundation',
  }

  for (const line of lines) {
    if (line.trim() === '') {
      continue
    }
    if (!line.includes('New USB device found')) {
      continue
    }

    const timestampMatch = line.match(/^(\w+\s+\d+\s+(\d+:\d+:\d+))/)
    const date = timestampMatch ? timestampMatch[1].split(' ').slice(0, 2).join(' ') : 'Неизвестно'
    const time = timestampMatch ? timestampMatch[2] : 'Неизвестно'

    const idVendorMatch = line.match(/idVendor=([0-9a-f]+)/i)
    const idProductMatch = line.match(/idProduct=([0-9a-f]+)/i)

    const vendor = idVendorMatch ? idVendorMatch[1] : 'Неизвестно'
    const product = idProductMatch ? idProductMatch[1] : 'Неизвестно'
    const vendorName = vendorDatabase[vendor] || vendor

    // Пропускаем системные USB хабы, но показываем все остальные
    if (vendor === '1d6b') {
      continue
    }

    const productName = vendorDatabase[vendor] === 'VirtualBox' ? 'Virtual USB Device' : product

    devices.push({
      date,
      time,
      vendor,
      product,
      vendorName,
      productName: productName,
      serialNumber: 'Неизвестно',
      deviceType: getDeviceTypeFromProduct(productName, vendor),
    })
  }

  return devices
}
