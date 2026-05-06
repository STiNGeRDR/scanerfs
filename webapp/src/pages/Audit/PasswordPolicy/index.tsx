import { useState } from 'react'

import { Segment } from '../../../components/Segment'
import { trpc } from '../../../lib/trpc'

import css from './index.module.scss'

export const PasswordPolicyPage = () => {
  const [scanResult, setScanResult] = useState<any>(null)
  
  const scanMutation = trpc.scanPasswordPolicy.useMutation({
    onSuccess: (data) => {
      setScanResult(data)
        sessionStorage.setItem('passwordPolicy', JSON.stringify(data))

    },
    onError: (error) => {
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

  // Функция для форматирования статуса
  const formatStatus = (value: any, isBoolean: boolean = false) => {
    if (isBoolean) {
      return value ? 'АКТИВНО' : 'НЕАКТИВНО'
    }
    return value || 'Не установлено'
  }

  // Группировка настроек по категориям
  const policyGroups = [
    {
      title: 'Базовые проверки пароля',
      items: [
        { key: 'usernameCheck', label: '1. Проверка имени пользователя', isBoolean: true },
        { key: 'gecosCheck', label: '2. Проверка GECOS', isBoolean: true },
        { key: 'rootPasswordCheck', label: '3. Проверка пароля root', isBoolean: true },
        { key: 'minLength', label: '4. Минимальная длина пароля', isBoolean: false },
      ]
    },
    {
      title: 'Требования к символам',
      items: [
        { key: 'lowercaseChars', label: '5. Строчные буквы (минимум)', isBoolean: false },
        { key: 'uppercaseChars', label: '6. Заглавные буквы (минимум)', isBoolean: false },
        { key: 'dcredit', label: '7. Цифры (минимум)', isBoolean: false },
        { key: 'difok', label: '8. Специальные символы (минимум)', isBoolean: false },
        { key: 'otherChars', label: '9. Измененные символы', isBoolean: false },
      ]
    },
    {
      title: 'История паролей',
      items: [
        { key: 'passwordHistory', label: '10. Поддержка истории', isBoolean: true },
        { key: 'rootEnforcement', label: '11. Применять для root', isBoolean: true },
        { key: 'storedPasswords', label: '12. Хранимых паролей', isBoolean: false },
      ]
    },
    {
      title: 'Блокировка при неудачных попытках',
      items: [
        { key: 'perUserSettings', label: '13. Индивидуальные настройки', isBoolean: true },
        { key: 'noReset', label: '14. Не сбрасывать счетчик', isBoolean: true },
        { key: 'magicRoot', label: '15. Исключение root', isBoolean: true },
        { key: 'failedAttempts', label: '16. Неудачных попыток', isBoolean: false },
        { key: 'lockTime', label: '17. Время блокировки (сек)', isBoolean: false },
        { key: 'unlockTime', label: '18. Время разблокировки (сек)', isBoolean: false },
      ]
    },
    {
      title: 'Старение паролей',
      items: [
        { key: 'PASS_MAX_DAYS', label: '19. Максимальное время (дни)', isBoolean: false },
        { key: 'PASS_MIN_DAYS', label: '20. Минимальное время (дни)', isBoolean: false },
        { key: 'PASS_WARN_AGE', label: '21. Предупреждение (дни)', isBoolean: false },
      ]
      
    }
  ]

  return (
    <Segment title="Парольная политика">
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>Анализ парольной политики системы</h2>
          <p className={css.subtitle}>
            Проверка настроек безопасности паролей в файлах PAM и login.defs
          </p>
        </div>

        <div className={css.controls}>
          <button 
            onClick={handleScan} 
            disabled={scanMutation.isPending}
            className={css.scanButton}
          >
            {scanMutation.isPending ? 'Анализ выполняется...' : '🔒 Проанализировать парольную политику'}
          </button>
          
          {scanMutation.isPending && (
            <div className={css.loading}>
              <span className={css.loadingSpinner}></span>
              Чтение и анализ конфигурационных файлов...
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
                  {scanResult.success && scanResult.policy && (
                    <p className={css.summary}>
                      Настроек проанализировано: {Object.keys(scanResult.policy).length}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {scanResult.success && scanResult.policy && (
              <div className={css.policyResults}>
                <h4 className={css.sectionTitle}>Детали парольной политики:</h4>
                
                {policyGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className={css.policyGroup}>
                    <h5 className={css.groupTitle}>{group.title}</h5>
                    <div className={css.policyItems}>
                      {group.items.map((item, itemIndex) => {
                        const policyItem = scanResult.policy[item.key]
                        const isActive = item.isBoolean && policyItem?.value
                        const value = item.isBoolean ? policyItem?.value : policyItem?.value
                        
                        return (
                          <div key={itemIndex} className={css.policyItem}>
                            <div className={css.itemHeader}>
                              <span className={css.itemLabel}>{item.label}</span>
                              <span className={`${css.itemValue} ${isActive ? css.active : css.inactive}`}>
                                {formatStatus(value, item.isBoolean)}
                              </span>
                            </div>
                            {policyItem?.description && (
                              <div className={css.itemDescription}>
                                {policyItem.description}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                
                <div className={css.fileInfo}>
                  <h5 className={css.fileTitle}>Проанализированные файлы:</h5>
                  <ul className={css.fileList}>
                    <li><code>/etc/pam.d/common-password</code> - основные настройки паролей</li>
                    <li><code>/etc/pam.d/common-auth</code> - настройки аутентификации</li>
                    <li><code>/etc/login.defs</code> - глобальные настройки системы</li>
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
            <div className={css.initialIcon}>🔐</div>
            <h3 className={css.initialTitle}>Начните анализ парольной политики</h3>
            <p className={css.initialText}>
              Нажмите кнопку выше, чтобы проанализировать настройки безопасности паролей
              в системе. Будут проверены файлы PAM и login.defs.
            </p>
          </div>
        )}
      </div>
    </Segment>
  )
}