import { useEffect, useState } from 'react';

import FileUpload from '../../components/FileUpload';
import { Segment } from '../../components/Segment'
// import { trpc } from '../../lib/trpc';

import css from './index.module.scss'

export const HomePage = () => {
  const [rules, setRules] = useState<any>(null);
  // const scanMutation = trpc.scanFileSystem.useMutation()
  useEffect(() => {
    const savedRules = localStorage.getItem('astra-scanner-rules');
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    }
  }, []);
  // const handleScan = () =>{
  //   console.log("123")
  //   scanMutation.mutate(rules)
  //   console.log(res) 
  // }
  
  return (
    <Segment title="Главная">
      <FileUpload setRules={setRules} />


      {rules && (
        <div className={css.rulesContainer}>
          <h2 className={css.title}>{rules.name || 'Без названия'}</h2>
          {rules.description && (
            <p className={css.description}>{rules.description}</p>
          )}
          {rules.version && (
            <div className={css.version}>Версия: {rules.version}</div>
          )}

          {rules.checks && Object.entries(rules.checks).map(([checkKey, check]: [string, any]) => (
            <div key={checkKey} className={css.checkItem}>
              <h3 className={css.checkName}>{check.name || checkKey}</h3>
              {check.description && (
                <p className={css.checkDescription}>{check.description}</p>
              )}
              {check.severity && (
                <div className={`${css.severity} ${css[check.severity]}`}>
                  Важность: {check.severity === 'high' ? 'Высокая' :
                    check.severity === 'medium' ? 'Средняя' : 'Низкая'}
                </div>
              )}

              {check.files && Object.entries(check.files).map(([filePath, fileChecks]: [string, any]) => (
                <div key={filePath} className={css.fileSection}>
                  <h4 className={css.filePath}>Файл: {filePath}</h4>
                  <div className={css.parameters}>
                    {Object.entries(fileChecks).map(([paramKey, param]: [string, any]) => (
                      <div key={paramKey} className={css.parameter}>
                        <span className={css.paramName}>{paramKey}:</span>
                        {param.expected && (
                          <span className={css.paramExpected}>"{param.expected}"</span>
                        )}
                        {param.description && (
                          <div className={css.paramDescription}>{param.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      

      <button 
        // onClick={handleScan}
        // disabled={!rules || scanMutation.isLoading}
        className={css.scanButton}
      >
        {/* {scanMutation.isLoading ? 'Анализ выполняется...' : 'Анализ'} */}
        Анализ
      </button>
    </Segment>
  )
}
