import { useState } from 'react'

import { Segment } from '../../../components/Segment'
import { trpc } from '../../../lib/trpc'

import css from './index.module.scss'

// Определяем типы для правил
type IntegrityRule = {
  path: string
  rule: string
  alias: string
  description: string
  isActive: boolean
  isDirectory: boolean
  isExcluded: boolean
}

type IntegrityControlSettings = {
  rules: IntegrityRule[]
  totalRules: number
  activeRules: number
  excludedRules: number
  directoryRules: number
  aliases: Record<string, string>
  directives: Record<string, string>
}

type IntegrityControlRule = {
  success: boolean
  message: string
  error?: string | null
  policy: IntegrityControlSettings | null
  rawFiles: Record<string, string> | null
}

export const IntegrityControlPage = () => {
  const [scanResult, setScanResult] = useState<IntegrityControlRule | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showExcluded, setShowExcluded] = useState(false)
  const [selectedAlias, setSelectedAlias] = useState<string>('all')

  const scanMutation = trpc.scanIntegrityControl.useMutation({
    onSuccess: (data: any) => {
      setScanResult(data as IntegrityControlRule)
      sessionStorage.setItem('integrityControl', JSON.stringify(data))
    },
    onError: (error: any) => {
      console.error('Mutation error:', error)
      setScanResult({
        success: false,
        message: 'Ошибка запроса',
        error: error.message,
        policy: null,
        rawFiles: null,
      })
    },
  })

  const handleScan = () => {
    scanMutation.mutate({ scan: true })
  }

  const getAliasIcon = (alias: string): string => {
    if (alias.includes('PARSEC')) {
      return '🛡️'
    }
    if (alias.includes('GOST')) {
      return '🔐'
    }
    if (alias.includes('ETC')) {
      return '⚙️'
    }
    if (alias.includes('DIR')) {
      return '📂'
    }
    if (alias.includes('Logs')) {
      return '📝'
    }
    return '📁'
  }

  const getPathIcon = (rule: IntegrityRule): string => {
    if (rule.isExcluded) {
      return '🚫'
    }
    if (rule.isDirectory) {
      return '📂'
    }
    return '📄'
  }

  // Фильтрация правил
  const filteredRules =
    scanResult?.policy?.rules.filter((rule: IntegrityRule) => {
      // Фильтр по поиску
      const matchesSearch =
        !searchTerm ||
        rule.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase())

      // Фильтр по исключенным
      const matchesExcluded = showExcluded || !rule.isExcluded

      // Фильтр по алиасу
      const matchesAlias = selectedAlias === 'all' || rule.alias === selectedAlias

      return matchesSearch && matchesExcluded && matchesAlias
    }) || []

  // Уникальные алиасы для фильтра
  const uniqueAliases: string[] = scanResult?.policy?.rules
    ? [...new Set(scanResult.policy.rules.map((r: IntegrityRule) => r.alias).filter(Boolean))]
    : []

  return (
    <Segment title="Контроль целостности">
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>Анализ контроля целостности файлов</h2>
          <p className={css.subtitle}>Проверка настроек Afick для контроля целостности системных файлов и каталогов</p>
        </div>

        <div className={css.controls}>
          <button onClick={handleScan} disabled={scanMutation.isPending} className={css.scanButton}>
            {scanMutation.isPending ? 'Анализ выполняется...' : '🔍 Проанализировать контроль целостности'}
          </button>

          {scanMutation.isPending && (
            <div className={css.loading}>
              <span className={css.loadingSpinner}></span>
              Чтение и анализ конфигурационного файла /etc/afick.conf...
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
                  {scanResult.success && scanResult.policy && (
                    <p className={css.summary}>
                      Всего правил: {scanResult.policy.totalRules} • Активных: {scanResult.policy.activeRules} •
                      Исключенных: {scanResult.policy.excludedRules} • Директорий: {scanResult.policy.directoryRules}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {scanResult.success && scanResult.policy && scanResult.policy.rules.length > 0 && (
              <div className={css.rulesSection}>
                <div className={css.filters}>
                  <div className={css.searchBox}>
                    <input
                      type="text"
                      placeholder="Поиск по пути, алиасу или описанию..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={css.searchInput}
                    />
                  </div>

                  <div className={css.filterControls}>
                    <div className={css.filterGroup}>
                      <label className={css.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={showExcluded}
                          onChange={(e) => setShowExcluded(e.target.checked)}
                        />
                        Показывать исключенные
                      </label>
                    </div>

                    {uniqueAliases.length > 0 && (
                      <div className={css.filterGroup}>
                        <select
                          value={selectedAlias}
                          onChange={(e) => setSelectedAlias(e.target.value)}
                          className={css.aliasSelect}
                        >
                          <option value="all">Все алиасы</option>
                          {uniqueAliases.map((alias: string) => (
                            <option key={alias} value={alias}>
                              {alias} {getAliasIcon(alias)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className={css.rulesGrid}>
                  {filteredRules.map((rule: IntegrityRule, index: number) => (
                    <div
                      key={index}
                      className={`${css.ruleCard} ${rule.isExcluded ? css.excluded : ''} ${!rule.isActive ? css.inactive : ''}`}
                    >
                      <div className={css.ruleHeader}>
                        <div className={css.pathInfo}>
                          <span className={css.pathIcon}>{getPathIcon(rule)}</span>
                          <span className={css.pathValue}>{rule.path}</span>
                        </div>
                        {rule.alias && (
                          <span className={`${css.aliasBadge} ${css[rule.alias.toLowerCase()] || ''}`}>
                            {getAliasIcon(rule.alias)} {rule.alias}
                          </span>
                        )}
                      </div>

                      <div className={css.ruleBody}>
                        <p className={css.ruleDescription}>{rule.description}</p>

                        <div className={css.ruleDetails}>
                          {rule.isDirectory && (
                            <span className={css.detailTag} title="Контроль директории (без поддиректорий)">
                              📁 Только директория
                            </span>
                          )}
                          {rule.isExcluded && (
                            <span className={`${css.detailTag} ${css.excludedTag}`} title="Исключено из контроля">
                              🚫 Исключено
                            </span>
                          )}
                          {!rule.isActive && !rule.isExcluded && (
                            <span className={`${css.detailTag} ${css.inactiveTag}`} title="Неактивно">
                              ⚠️ Неактивно
                            </span>
                          )}
                        </div>

                        <div className={css.rawRule}>
                          <span className={css.rawLabel}>Правило:</span>
                          <code className={css.rawCode}>{rule.rule}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredRules.length === 0 && (
                  <div className={css.noResults}>
                    {searchTerm || selectedAlias !== 'all' || !showExcluded
                      ? 'Правила по вашему запросу не найдены'
                      : 'Нет правил для отображения'}
                  </div>
                )}
              </div>
            )}

            {scanResult.success && scanResult.policy && scanResult.policy.rules.length === 0 && (
              <div className={css.noRules}>
                <p>В файле /etc/afick.conf не найдено правил контроля целостности.</p>
              </div>
            )}

            {scanResult.error && (
              <div className={css.errorSection}>
                <h4 className={css.errorTitle}>Ошибка при анализе:</h4>
                <div className={css.errorMessage}>{scanResult.error}</div>
              </div>
            )}

            {scanResult.success && scanResult.rawFiles && (
              <div className={css.rawFilesSection}>
                <details className={css.details}>
                  <summary className={css.detailsSummary}>
                    <span>📄 Показать содержимое файла /etc/afick.conf</span>
                  </summary>
                  <div className={css.rawFiles}>
                    {Object.entries(scanResult.rawFiles).map(([filename, content]) => (
                      <div key={filename} className={css.rawFile}>
                        <h6 className={css.rawFileTitle}>{filename}</h6>
                        <pre className={css.rawFileContent}>{content as string}</pre>
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
            <div className={css.initialIcon}>🛡️</div>
            <h3 className={css.initialTitle}>Начните анализ контроля целостности</h3>
            <p className={css.initialText}>
              Нажмите кнопку выше, чтобы проанализировать файл <code>/etc/afick.conf</code>и получить список
              контролируемых файлов и каталогов.
            </p>
          </div>
        )}
      </div>
    </Segment>
  )
}
