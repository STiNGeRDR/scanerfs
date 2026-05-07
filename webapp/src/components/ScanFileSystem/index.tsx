import css from './index.module.scss'

const ScanFileSystem = ({ rules }: { rules: any }) => {
  return (
    <>
    {rules? <div className={css.mainContainer}>
      <header className={css.checkInfo}>
        <p>{rules.name}</p>
        <p>{rules.description}</p>
        </header>
        {Object.keys(rules.checks).map((check) => (
          <div className={css.checkBlock}>
          <p>{rules.checks[check].name}</p>
          <p>{rules.checks[check].description}</p>
          <table>
            <thead>
              <th>Название параметра</th>
              <th>Критичность</th>
              <th>Действительное значение</th>
              <th>Эталонное значение</th>
            </thead>
            <tbody>
              {Object.keys(rules.checks[check].policy).map((polic) =>(<tr>
                <td>{polic}</td>
                <td>{rules.checks[check].policy[polic].severity}</td>
                <td>{rules.checks[check].policy[polic].value}</td>
                <td>{rules.checks[check].policy[polic].value}</td>
              </tr>))}
            </tbody>
          </table>
          </div>
        ))}
    </div>: null}
    </>
  )
}

export default ScanFileSystem
