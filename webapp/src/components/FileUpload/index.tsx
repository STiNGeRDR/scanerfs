import React, { useRef } from 'react';

import css from './index.module.scss';

type FileUploadProps = {
  // eslint-disable-next-line no-unused-vars
  setRules: (rules: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ setRules }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { return; }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let rules;

        // Определяем формат файла по расширению
        if (file.name.endsWith('.json')) {
          rules = JSON.parse(content);
          localStorage.setItem('astra-scanner-rules', JSON.stringify(rules))
        }
        // } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        //   // Для YAML нужно будет установить yaml парсер
        //   // rules = YAML.parse(content);
        //   console.log('YAML support requires yaml library');
        //   return;
        // } else {
        //   console.log('Unsupported file format');
        //   return;
        // }

        setRules(rules);
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    };

    reader.readAsText(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={css.fileUpload}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.yaml,.yml"
        onChange={handleFileSelect}
        className={css.fileInput}
      />
      <button
        type="button"
        onClick={handleClick}
        className={css.uploadButton}
      >
        📁 Загрузить правила
      </button>
    </div>
  );
};

export default FileUpload;
