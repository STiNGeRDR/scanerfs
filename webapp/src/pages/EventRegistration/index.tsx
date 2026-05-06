import { useState } from 'react'

import { Segment } from '../../components/Segment'
import { trpc } from '../../lib/trpc'

import css from './index.module.scss'

// Типы для правил auditd
type AuditRule = {
  id: string
  value: string
  type: 'watch' | 'syscall' | 'control'
  target: string
  permissions: string
  key: string
  description: string
  category: string
}

// Категории для группировки
const CATEGORIES = {
  authentication: 'Аутентификация и вход в систему',
  file_monitoring: 'Мониторинг файлов и каталогов',
  process_monitoring: 'Мониторинг процессов',
  system_changes: 'Изменения системных файлов',
  network: 'Сетевая активность',
  security: 'Безопасность и привилегии',
  audit_protection: 'Защита логов аудита',
  terminal: 'Доступ к терминалам',
  system_config: 'Системные конфигурации',
  astra_specific: 'Специфичные для Astra Linux'
} as const

// Генерация человеко-читаемого описания
const generateDescription = (key: string, rule: string): string => {
  const descriptions: Record<string, string> = {
    'user_session_management': 'Управление сессиями пользователей',
    'successful_logins': 'Успешные входы в систему',
    'failed_login_attempts': 'Неудачные попытки входа',
    'last_login_info': 'Информация о последнем входе',
    'ssh_config_changes': 'Изменения конфигурации SSH',
    'pam_config_changes': 'Изменения конфигурации PAM',
    'login_execution': 'Выполнение процесса входа',
    'user_identity_change': 'Смена идентификатора пользователя',
    'program_execution': 'Выполнение программ',
    'process_termination': 'Завершение процессов',
    'process_exit': 'Выход из процессов',
    'cron_config': 'Изменения конфигурации Cron',
    'user_cron_jobs': 'Пользовательские задания Cron',
    'critical_system_files': 'Критичные системные файлы',
    'file_deletion': 'Удаление файлов',
    'file_renaming': 'Переименование файлов',
    'file_modification': 'Изменение файлов',
    'terminal_access': 'Доступ к терминалу',
    'console_access': 'Доступ к консоли',
    'pseudo_terminal': 'Доступ к псевдо-терминалу',
    'usb_device_access': 'Доступ к USB устройствам',
    'network_connections': 'Сетевые подключения',
    'network_sockets': 'Создание сетевых сокетов',
    'filesystem_mount': 'Монтирование файловых систем',
    'privilege_escalation': 'Повышение привилегий',
    'file_permissions_change': 'Изменение прав доступа к файлам',
    'file_ownership_change': 'Изменение владельца файлов',
    'sudo_execution': 'Выполнение команды sudo',
    'sudoers_changes': 'Изменения файла sudoers',
    'su_execution': 'Выполнение команды su',
    'remove_audit': 'Удаление логов аудита',
    'rename_audit': 'Переименование логов аудита',
    'remove_events': 'Удаление событий Astra',
    'rename_events': 'Переименование событий Astra',
    'parsec-p': 'События Parsec (субъекты)',
    'parsec-f': 'События Parsec (объекты)'
  }
  
  if (descriptions[key]) {
    return descriptions[key]
  }
  
  // Для правил без ключа или с кастомными ключами
  if (rule.includes('-k /')) {
    const pathMatch = rule.match(/-k\s+(\/\S+)/)
    if (pathMatch) {
      return `Мониторинг изменений файла: ${pathMatch[1]}`
    }
  }
  
  return 'Правило мониторинга системы'
}

// Определение категории правила
const determineCategory = (key: string, target: string, rule: string): string => {
  // Аутентификация
  if (key.includes('login') || key.includes('session') || 
      target.includes('/var/log/wtmp') || target.includes('/var/log/btmp')) {
    return 'authentication'
  }
  
  // Терминалы
  if (key.includes('terminal') || key.includes('console') || 
      target.includes('/dev/tty') || target.includes('/dev/console')) {
    return 'terminal'
  }
  
  // Мониторинг файлов
  if (rule.startsWith('-w ') && !target.includes('/dev/')) {
    return 'file_monitoring'
  }
  
  // Процессы
  if (key.includes('process') || key.includes('execution') || 
      key.includes('termination') || target.includes('execve')) {
    return 'process_monitoring'
  }
  
  // Сеть
  if (key.includes('network') || key.includes('socket') || 
      target.includes('connect') || target.includes('accept')) {
    return 'network'
  }
  
  // Безопасность
  if (key.includes('sudo') || key.includes('su') || 
      key.includes('privilege') || key.includes('critical')) {
    return 'security'
  }
  
  // Защита логов
  if (key.includes('audit') || key.includes('events') || 
      target.includes('/var/log/audit') || target.includes('/var/log/astra')) {
    return 'audit_protection'
  }
  
  // Astra специфичные
  if (target.includes('/etc/parsec') || target.includes('/etc/astra') || 
      key.includes('parsec') || target.includes('/etc/fly-kiosk')) {
    return 'astra_specific'
  }
  
  // Системные конфигурации
  if (target.includes('/etc/') && !target.includes('/etc/parsec')) {
    return 'system_config'
  }
  
  return 'system_changes'
}

// Функция для парсинга правил
export const parseAuditRules = (rawRules: string[]): AuditRule[] => {
  return rawRules.map((rule, index) => {
    const id = `rule-${index}`
    
    // Определяем тип правила
    let type: AuditRule['type'] = 'control'
    let target = ''
    let permissions = ''
    let key = ''
    
    if (rule.startsWith('-w ')) {
      // Watch rule
      type = 'watch'
      const match = rule.match(/-w\s+(\S+)\s+-p\s+(\S+)\s+-k\s+(\S+)/)
      if (match) {
        target = match[1]
        permissions = match[2]
        key = match[3]
      }
    } else if (rule.startsWith('-a ')) {
      // Syscall rule
      type = 'syscall'
      const keyMatch = rule.match(/-k\s+(\S+)/)
      const archMatch = rule.match(/-F\s+arch=(\S+)/)
      const syscallMatch = rule.match(/-S\s+(\S+)/)
      
      if (keyMatch) {key = keyMatch[1]}
      target = syscallMatch ? syscallMatch[1] : 'all'
      permissions = archMatch ? archMatch[1] : 'b64'
    }
    
    // Генерируем описание на основе ключа
    const description = generateDescription(key, rule)
    
    // Определяем категорию
    const category = determineCategory(key, target, rule)
    const value = rule
    
    return {
      id,
      value,
      type,
      target,
      permissions,
      key,
      description,
      category
    }
  })
}

export const EventRegistrationPage = () => {
  const [rules, setRules] = useState<AuditRule[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Используем useMutation правильно
  const scanMutation = trpc.scanEventRegistration.useMutation({
    onSuccess: (data) => {
      if (data.success && data.output) {
        try {
          const rawRules = data.output.split('\n').filter(line => line.trim())
          const parsedRules = parseAuditRules(rawRules)
          setRules(parsedRules)
          sessionStorage.setItem('eventRegistration', JSON.stringify(parsedRules))
          setError(null)
        } catch (parseError) {
          console.error('Ошибка парсинга правил:', parseError)
          setError('Ошибка обработки полученных данных')
        }
      } else {
        setError(data.error || 'Не удалось получить правила аудита')
      }
    },
    onError: (error) => {
      console.error('Ошибка анализа:', error)
      setError(`Ошибка при выполнении анализа: ${error.message}`)
    }
  })

  const handleScan = () => {
    // Вызываем мутацию с параметром scan: true
    scanMutation.mutate({ scan: true })
  }

  // Фильтрация правил
  const filteredRules = rules.filter(rule => {
    const matchesCategory = activeCategory === 'all' || rule.category === activeCategory
    const matchesSearch = !searchTerm || 
      rule.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.target.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  // Группировка по категориям
  const rulesByCategory = filteredRules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = []
    }
    acc[rule.category].push(rule)
    return acc
  }, {} as Record<string, AuditRule[]>)

  // Статистика
  const stats = {
    total: rules.length,
    watch: rules.filter(r => r.type === 'watch').length,
    syscall: rules.filter(r => r.type === 'syscall').length,
    active: filteredRules.length
  }

  return (
    <Segment title="Регистрация событий">
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>Анализ правил аудита событий</h2>
          <p className={css.subtitle}>
            Проверка и анализ правил auditd для регистрации событий в системе
          </p>
        </div>

        <div className={css.controls}>
          <button 
            onClick={handleScan} 
            disabled={scanMutation.isPending}
            className={css.scanButton}
          >
            {scanMutation.isPending ? 'Анализ выполняется...' : '📊 Выполнить анализ auditd'}
          </button>
          
          {scanMutation.isPending && (
            <div className={css.loading}>
              <span className={css.loadingSpinner}></span>
              Выполняется анализ правил аудита...
            </div>
          )}
          
          {error && (
            <div className={css.errorMessage}>
              <strong>Ошибка:</strong> {error}
            </div>
          )}
          
          {scanMutation.data?.success && scanMutation.data.output && rules.length > 0 && (
            <div className={css.successMessage}>
              <strong>Успешно:</strong> Получено {rules.length} правил аудита
            </div>
          )}
        </div>

        {rules.length > 0 && (
          <div className={css.results}>
            {/* Статистика */}
            <div className={css.stats}>
              <div className={css.statCard}>
                <span className={css.statNumber}>{stats.total}</span>
                <span className={css.statLabel}>Всего правил</span>
              </div>
              <div className={css.statCard}>
                <span className={css.statNumber}>{stats.watch}</span>
                <span className={css.statLabel}>Наблюдение за файлами</span>
              </div>
              <div className={css.statCard}>
                <span className={css.statNumber}>{stats.syscall}</span>
                <span className={css.statLabel}>Системные вызовы</span>
              </div>
              <div className={css.statCard}>
                <span className={css.statNumber}>{stats.active}</span>
                <span className={css.statLabel}>Отображается</span>
              </div>
            </div>

            {/* Фильтры */}
            <div className={css.filters}>
              <div className={css.searchBox}>
                <input
                  type="text"
                  placeholder="Поиск по ключу, описанию или пути..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={css.searchInput}
                />
              </div>
              
              <div className={css.categoryFilter}>
                <button
                  className={`${css.categoryBtn} ${activeCategory === 'all' ? css.active : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  Все категории
                </button>
                
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <button
                    key={key}
                    className={`${css.categoryBtn} ${activeCategory === key ? css.active : ''}`}
                    onClick={() => setActiveCategory(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Список правил */}
            <div className={css.rulesList}>
              {Object.entries(rulesByCategory).map(([category, categoryRules]) => (
                <div key={category} className={css.categorySection}>
                  <h3 className={css.categoryTitle}>
                    {CATEGORIES[category as keyof typeof CATEGORIES] || category}
                    <span className={css.categoryCount}>({categoryRules.length})</span>
                  </h3>
                  
                  <div className={css.rulesGrid}>
                    {categoryRules.map((rule) => (
                      <div key={rule.id} className={css.ruleCard}>
                        <div className={css.ruleHeader}>
                          <span className={`${css.ruleType} ${css[rule.type]}`}>
                            {rule.type === 'watch' ? 'Наблюдение' : 
                             rule.type === 'syscall' ? 'Системный вызов' : 'Контроль'}
                          </span>
                          <span className={css.ruleKey}>{rule.key}</span>
                        </div>
                        
                        <div className={css.ruleBody}>
                          <h4 className={css.ruleDescription}>{rule.description}</h4>
                          
                          {rule.target && (
                            <div className={css.ruleDetail}>
                              <span className={css.detailLabel}>Цель:</span>
                              <code className={css.detailValue}>{rule.target}</code>
                            </div>
                          )}
                          
                          {rule.permissions && (
                            <div className={css.ruleDetail}>
                              <span className={css.detailLabel}>Права:</span>
                              <span className={css.detailValue}>{rule.permissions}</span>
                            </div>
                          )}
                          
                          <div className={css.rawRule}>
                            <span className={css.rawLabel}>Исходное правило:</span>
                            <code className={css.rawCode}>{rule.value}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredRules.length === 0 && (
                <div className={css.noResults}>
                  {searchTerm ? 'Правила по вашему запросу не найдены' : 'Нет правил для отображения'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Если правил нет и не выполняется анализ */}
        {!scanMutation.isPending && rules.length === 0 && !error && (
          <div className={css.initialState}>
            <div className={css.initialIcon}>📋</div>
            <h3 className={css.initialTitle}>Начните анализ правил аудита</h3>
            <p className={css.initialText}>
              Нажмите кнопку выше, чтобы выполнить команду <code>auditctl -l</code> 
              и получить список активных правил аудита событий в системе.
            </p>
          </div>
        )}
      </div>
    </Segment>
  )
}