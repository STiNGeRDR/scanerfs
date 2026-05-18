import css from './index.module.scss'


const returnCurrentValue = (value: boolean | number) =>{
if (typeof(value) === "boolean"){
  return value? 'Активно' : "Неактивно"
 }
 else{
  return value
 }
}
const returnPerfectValue = (parametrName: string, police: string) => {
  const parametr = sessionStorage.getItem(parametrName)
  if (!parametr) {
    return null
  }
  const parseParametr = JSON.parse(parametr)
  return returnCurrentValue(parseParametr.policy?.[police].value)
}

const ScanFileSystem = ({ rules }: { rules: any }) => {
  return (
    <>
      {rules ? (
        <div className={css.mainContainer}>
          <header className={css.checkInfo}>
            <p>{rules.name}</p>
            <p>{rules.description}</p>
          </header>
          {Object.keys(rules.checks).map((check) => (
            <div className={css.checkBlock} key={check}>
              <p>{rules.checks[check].name}</p>
              <p>{rules.checks[check].description}</p>
              <table>
                <thead>
                  <tr>
                    <th>Название параметра</th>
                    <th>Критичность</th>
                    <th>Эталонное значение</th>
                    <th>Действительное значение</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(rules.checks[check].policy).map((police) => (
                    <tr key={police}>
                      <td>{police}</td>
                      <td>{rules.checks[check].policy[police].severity}</td>
                      <td>{returnCurrentValue(rules.checks[check].policy[police].value)}</td>
                      <td>{returnPerfectValue(check, police)}</td>
                    </tr>
                  ))}
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
