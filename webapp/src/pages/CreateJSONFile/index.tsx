import { useState, useEffect } from 'react'

import { Segment } from "../../components/Segment"

import css from './index.module.scss'

// Типы для JSON структуры
type PolicyValue = {
  value: string | number | boolean | string[]
  severity: string
  description: string
  groupList?: string[]
}

type Check = {
  name: string
  description: string
  policy: Record<string, PolicyValue>
}

type JsonData = {
  version: string
  name: string
  description: string
  checks: Record<string, Check>
}

// Начальные данные
const initialData: JsonData = {
  version: "1.0",
  name: "Astra Linux 1.7 Security Policy",
  description: "Проверка политик безопасности Astra Linux 1.7",
  checks: {
    passwordPolicy: {
      name: "Парольная политика",
      description: "Проверка настроек парольной политики",
      policy: {
        "PASS_MAX_DAYS": { value: 100, severity: "low", description: "Максимальное количество дней действия пароля" },
        "PASS_MIN_DAYS": { value: 1, severity: "high", description: "Минимальное количество дней между сменами пароля" },
        "PASS_WARN_AGE": { value: 7, severity: "medium", description: "Количество дней предупреждения перед истечением срока пароля" },
        "dcredit": { value: 1, severity: "medium", description: "Количество цифр (отрицательное = минимум)" },
        "difok": { value: 3, severity: "medium", description: "Минимальное количество измененных символов" },
        "minLength": { value: 8, severity: "medium", description: "Минимальная длина пароля" },
        "passwordHistory": { value: true, severity: "medium", description: "Хранение истории паролей" },
        "storedPasswords": { value: 5, severity: "medium", description: "Количество хранимых паролей" },
        "rootEnforcement": { value: true, severity: "medium", description: "Политика применяется к root" },
        "uppercaseChars": { value: 1, severity: "medium", description: "Количество заглавных букв (отрицательное = минимум)" },
        "lowercaseChars": { value: 1, severity: "hard", description: "Количество строчных букв (отрицательное = минимум)" },
        "otherChars": { value: 1, severity: "medium", description: "Количество специальных символов (отрицательное = минимум)" },
        "usernameCheck": { value: true, severity: "medium", description: "Запрещает использовать имя пользователя в пароле" },
        "gecosCheck": { value: true, severity: "medium", description: "Запрещает использовать информацию из GECOS в пароле" },
        "rootPasswordCheck": { value: true, severity: "medium", description: "Применять политику паролей к пользователю root" },
        "failedAttempts": { value: 5, severity: "medium", description: "Количество неудачных попыток до блокировки" },
        "lockTime": { value: 10, severity: "medium", description: "Время блокировки в секундах" },
        "unlockTime": { value: 10, severity: "medium", description: "Время автоматической разблокировки в секундах" },
        "perUserSettings": { value: false, severity: "medium", description: "Индивидуальный счетчик неудачных попыток для каждого пользователя" },
        "noReset": { value: false, severity: "medium", description: "Не сбрасывать счетчик неудачных попыток" },
        "magicRoot": { value: false, severity: "medium", description: "Не учитывать неудачные попытки для root" }
      }
    },
    mashingData: {
      name: "Затирание данных",
      description: "Проверка настройки политики очистки данных",
      policy: {
        "astra-swapwiper-control": { value: true, severity: "medium", description: "Очистка раздела подкачки (swap)" },
        "astra-secdel-control": { value: true, severity: "medium", description: "Затирание освобождаемых разделов жесткого диска" }
      }
    },
    accountingSettings: {
      name: "Параметры учетных записей",
      description: "Проверка настроек параметров учетных записей",
      policy: {
        "addExtraGroups": { value: true, severity: "medium", description: "Добавлять пользователя в дополнительные группы (ADD_EXTRA_GROUPS)" },
        "dhome": { value: "/home", severity: "medium", description: "Местонахождение домашнего каталога (DHOME)" },
        "dshell": { value: "/bin/bash", severity: "medium", description: "Оболочка по умолчанию (DSHELL)" },
        "extraGroups": { 
          value: "astra-admin users person user video admsys plugdev audio user1 dialout", 
          severity: "medium", 
          description: "Дополнительные группы (EXTRA_GROUPS)",
          groupList: ["astra-admin", "users", "person", "user", "video", "admsys", "plugdev", "audio", "user1", "dialout"]
        },
        "screenSaverDelay": { value: 600, severity: "medium", description: "Блокировка сеанса после бездействия (ScreenSaverDelay)" },
        "skel": { value: "/etc/skel", severity: "medium", description: "Каталог шаблонов (SKEL)" },
        "usergroups": { value: true, severity: "medium", description: "Создавать одноименную группу для пользователя (USERGROUPS)" },
        "usersGid": { value: "100", severity: "medium", description: "Первичная группа (USERS_GID)" }
      }
    }
  }
}

export const CreateJSONFilePage = () => {
  const [jsonData, setJsonData] = useState<JsonData>(initialData)
  const [expandedChecks, setExpandedChecks] = useState<Record<string, boolean>>({})
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // Загружаем сохранённые данные из localStorage при монтировании
    const savedData = localStorage.getItem('jsonEditorData')
    if (savedData) {
      try {
        setJsonData(JSON.parse(savedData))
      } catch (e) {
        console.error('Ошибка загрузки данных', e)
      }
    }
  }, [])

  // Сохраняем данные в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('jsonEditorData', JSON.stringify(jsonData))
  }, [jsonData])

  const toggleCheck = (checkKey: string) => {
    setExpandedChecks(prev => ({ ...prev, [checkKey]: !prev[checkKey] }))
  }

  const updatePolicyValue = (checkKey: string, policyKey: string, newValue: any) => {
    setJsonData(prev => ({
      ...prev,
      checks: {
        ...prev.checks,
        [checkKey]: {
          ...prev.checks[checkKey],
          policy: {
            ...prev.checks[checkKey].policy,
            [policyKey]: {
              ...prev.checks[checkKey].policy[policyKey],
              value: newValue
            }
          }
        }
      }
    }))
  }

  const saveToFile = () => {
    try {
      const dataStr = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `security_policy_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setSaveMessage({ type: 'success', text: 'Файл успешно сохранён!' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage({ type: 'error', text: `Ошибка при сохранении файла ${error}` })
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const resetToDefault = () => {
    if (confirm('Вы уверены, что хотите сбросить все изменения к значениям по умолчанию?')) {
      setJsonData(initialData)
      setSaveMessage({ type: 'success', text: 'Данные сброшены к значениям по умолчанию' })
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const renderPolicyValue = (checkKey: string, policyKey: string, policy: PolicyValue) => {
    const value = policy.value
    
    if (typeof value === 'boolean') {
      return (
        <label className={css.switch}>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updatePolicyValue(checkKey, policyKey, e.target.checked)}
          />
          <span className={css.slider}></span>
        </label>
      )
    }
    
    if (policy.groupList && Array.isArray(policy.groupList)) {
      return (
        <div className={css.groupListEditor}>
          <input
            type="text"
            value={String(value)}
            onChange={(e) => updatePolicyValue(checkKey, policyKey, e.target.value)}
            className={css.input}
            placeholder="Введите группы через пробел"
          />
          <div className={css.groupTags}>
            {policy.groupList.map((group, idx) => (
              <span key={idx} className={css.groupTag}>{group}</span>
            ))}
          </div>
        </div>
      )
    }
    
    return (
      <input
        type={typeof value === 'number' ? 'number' : 'text'}
        value={String(value)}
        onChange={(e) => {
          const newVal = typeof value === 'number' ? Number(e.target.value) : e.target.value
          updatePolicyValue(checkKey, policyKey, newVal)
        }}
        className={css.input}
      />
    )
  }

  return (
    <Segment title="Создать JSON-файл">
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>Редактор политик безопасности</h2>
          <p className={css.subtitle}>
            Редактируйте параметры политик и сохраняйте их в JSON-файл для последующего использования в сканере
          </p>
        </div>

        <div className={css.toolbar}>
          <button onClick={saveToFile} className={`${css.button} ${css.saveButton}`}>
             Сохранить JSON-файл
          </button>
          <button onClick={resetToDefault} className={`${css.button} ${css.resetButton}`}>
            Сбросить 
          </button>
          {saveMessage && (
            <div className={`${css.message} ${saveMessage.type === 'success' ? css.success : css.error}`}>
              {saveMessage.text}
            </div>
          )}
        </div>

        <div className={css.jsonData}>
          <div className={css.metaInfo}>
            <div className={css.metaField}>
              <label>Версия:</label>
              <input
                type="text"
                value={jsonData.version}
                onChange={(e) => setJsonData(prev => ({ ...prev, version: e.target.value }))}
                className={css.input}
              />
            </div>
            <div className={css.metaField}>
              <label>Название:</label>
              <input
                type="text"
                value={jsonData.name}
                onChange={(e) => setJsonData(prev => ({ ...prev, name: e.target.value }))}
                className={css.input}
              />
            </div>
            <div className={css.metaField}>
              <label>Описание:</label>
              <input
                type="text"
                value={jsonData.description}
                onChange={(e) => setJsonData(prev => ({ ...prev, description: e.target.value }))}
                className={css.input}
              />
            </div>
          </div>

          {Object.entries(jsonData.checks).map(([checkKey, check]) => (
            <div key={checkKey} className={css.checkCard}>
              <div 
                className={css.checkHeader} 
                onClick={() => toggleCheck(checkKey)}
              >
                <div className={css.checkTitle}>
                  <span className={css.expandIcon}>{expandedChecks[checkKey] ? '▼' : '▶'}</span>
                  <div>
                    <h3>{check.name}</h3>
                    <p>{check.description}</p>
                  </div>
                </div>
              </div>
              
              {expandedChecks[checkKey] && (
                <div className={css.policyGrid}>
                  {Object.entries(check.policy).map(([policyKey, policy]) => (
                    <div key={policyKey} className={css.policyCard}>
                      <div className={css.policyHeader}>
                        <span className={css.policyName}>{policyKey}</span>
                        <span className={`${css.severity} ${css[policy.severity]}`}>
                          {policy.severity === 'high' ? 'Высокая' : 
                           policy.severity === 'medium' ? 'Средняя' : 'Низкая'}
                        </span>
                      </div>
                      <div className={css.policyDescription}>
                        {policy.description}
                      </div>
                      <div className={css.policyValue}>
                        {renderPolicyValue(checkKey, policyKey, policy)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={css.footer}>
          <button onClick={saveToFile} className={`${css.button} ${css.saveButton}`}>
            Сохранить JSON-файл
          </button>
        </div>
      </div>
    </Segment>
  )
}