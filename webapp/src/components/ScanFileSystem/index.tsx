import css from './index.module.scss'

const returnCurrentValue = (value: boolean | number | string) => {
  if (typeof value === "boolean") {
    return value ? 'Активно' : "Неактивно"
  }
  return value
}

const returnPerfectValue = (parametrName: string, police: string) => {
  const parametr = sessionStorage.getItem(parametrName)
  if (!parametr) {
    return null
  }
  try {
    const parseParametr = JSON.parse(parametr)
    const perfectValue = parseParametr.policy?.[police]?.value
    if (perfectValue === undefined) {return null}
    return returnCurrentValue(perfectValue)
  } catch (error) {
    console.error('Ошибка парсинга:', error)
    return null
  }
}

const ScanFileSystem = ({ rules }: { rules: any }) => {
  return (
    <>
      {rules ? (
        <div className={css.mainContainer}>
          <div className={css.checkInfo}>
            <h2>{rules.name}</h2>
            <p>{rules.description}</p>
          </div>
          {Object.keys(rules.checks).map((check) => (
            <div className={css.checkBlock} key={check}>
              <div className={css.checkInfo}>
                <h3>{rules.checks[check].name}</h3>
                <p>{rules.checks[check].description}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Название параметра</th>
                    <th>Критичность</th>
                    <th>Действительное значение</th>
                    <th>Эталонное значение</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(rules.checks[check].policy).map((police) => {
                    const currentVal = returnCurrentValue(rules.checks[check].policy[police].value)
                    const perfectVal = returnPerfectValue(check, police)
                    const isMismatch = currentVal !== perfectVal && perfectVal !== null
                    
                    const severity = rules.checks[check].policy[police].severity
                    const severityClass = 
                      severity === 'high' ? css.highSeverity :
                      severity === 'medium' ? css.mediumSeverity : css.lowSeverity
                    
                    return (
                      <tr key={police} className={isMismatch ? css.mismatchValue : ''}>
                        <td className={css.namePolicy}>{police}</td>
                        <td className={css.criticValue}>
                          <span className={severityClass}>
                            {severity === 'high' ? 'Высокая' : 
                             severity === 'medium' ? 'Средняя' : 'Низкая'}
                          </span>
                        </td>
                        <td className={css.referenceValue}>{perfectVal || '—'}</td>
                        <td className={css.realValue}>
                          {currentVal}
                          {isMismatch && <span className={css.warningIcon}>⚠️</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}

export default ScanFileSystem