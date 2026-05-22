import { createRef } from 'react'
import { Link, Outlet } from 'react-router-dom'

import {
  getAccountingSettingsRoute,
  getAdditionalSettingsRoute,
  getClosedSoftwareEnvironmentRoute,
  getCreateJSONFileRoute,
  getDeviceControlRoute,
  getEventRegistrationPageRoute,
  getHomePageRoute,
  getIntegrityControlRoute,
  getITNSearchRoute,
  getMandatoryAccessControlRoute,
  getMashingDataRoute,
  getPassworPolicyRoute,
  getUSBSearchRoute,
} from '../../lib/routes'

import css from './index.module.scss'

export const layoutContentElref = createRef<HTMLDivElement>()

export const Layout = () => {
  return (
    <div className={css.layout}>
      <div className={css.navigation}>
        <div className={css.navHeader}>
          <div className={css.logo}>
            <span className={css.logoIcon}>🔍</span>
            <span className={css.logoText}>ScanerFS</span>
          </div>
          <div className={css.navInfo}>
            Анализ безопасности системы
          </div>
        </div>
        
        <nav className={css.navMenu}>
          <div className={css.menuSection}>
            <div className={css.menuTitle}>Основные</div>
            <ul className={css.menuList}>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getHomePageRoute()}>
                  <span className={css.linkIcon}>🏠</span>
                  <span className={css.linkText}>Главная</span>
                </Link>
              </li>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getCreateJSONFileRoute()}>
                  <span className={css.linkIcon}>🖋</span>
                  <span className={css.linkText}>Создать JSON файл</span>
                </Link>
              </li>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getUSBSearchRoute()}>
                  <span className={css.linkIcon}>⚠</span>
                  <span className={css.linkText}>USB подключения</span>
                </Link>
              </li>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getITNSearchRoute()}>
                  <span className={css.linkIcon}>⇆</span>
                  <span className={css.linkText}>Подключения к ИТКС ОП</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className={css.menuSection}>
            <div className={css.menuTitle}>Безопасность</div>
            <ul className={css.menuList}>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getEventRegistrationPageRoute()}>
                  <span className={css.linkIcon}>📊</span>
                  <span className={css.linkText}>Регистрация событий</span>
                </Link>
              </li>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getMashingDataRoute()}>
                  <span className={css.linkIcon}>🗳</span>
                  <span className={css.linkText}>Затирание данных</span>
                </Link>
              </li>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getPassworPolicyRoute()}>
                  <span className={css.linkIcon}>💳</span>
                  <span className={css.linkText}>Парольная политика</span>
                </Link>
              </li>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getAccountingSettingsRoute()}>
                  <span className={css.linkIcon}>⌨</span>
                  <span className={css.linkText}>Учётные записи</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className={css.menuSection}>
            <div className={css.menuTitle}>Контроль доступа</div>
            <ul className={css.menuList}>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getDeviceControlRoute()}>
                  <span className={css.linkIcon}>💻</span>
                  <span className={css.linkText}>Контроль устройств</span>
                </Link>
              </li>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getIntegrityControlRoute()}>
                  <span className={css.linkIcon}>🗃</span>
                  <span className={css.linkText}>Контроль целостности</span>
                </Link>
              </li>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getMandatoryAccessControlRoute()}>
                  <span className={css.linkIcon}>🛡️</span>
                  <span className={css.linkText}>Мандатный доступ</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className={css.menuSection}>
            <div className={css.menuTitle}>Дополнительно</div>
            <ul className={css.menuList}>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getClosedSoftwareEnvironmentRoute()}>
                  <span className={css.linkIcon}>📚</span>
                  <span className={css.linkText}>Замкнутая среда</span>
                </Link>
              </li>
              <li className={css.menuItem}>
                <Link className={css.menuLink} to={getAdditionalSettingsRoute()}>
                  <span className={css.linkIcon}>⚙️</span>
                  <span className={css.linkText}>Доп. настройки</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      
      <div className={css.content} ref={layoutContentElref}>
        <Outlet />
      </div>
    </div>
  )
}