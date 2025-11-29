import { createRef } from 'react'
import { Link, Outlet } from 'react-router-dom'

// Импортируем функции-хелперы для генерации маршрутов (обеспечивают типобезопасность и централизованное управление путями)
import { getHomePageRoute } from '../../lib/routes'

import css from './index.module.scss'

export const layoutContentElref = createRef<HTMLDivElement>()

// Компонент Layout определяет общую структуру страницы: навигация + контент
export const Layout = () => {
  return (
    <div className={css.layout}>
      <div className={css.navigation}>
        <div className={css.logo}>Сканер ФС</div>
        <ul className={css.menu}>
          <li className={css.item}>
            <Link className={css.link} to={getHomePageRoute()}>
              Главная
            </Link>
            <br />
          </li>
        </ul>
      </div>
      <div className={css.content} ref={layoutContentElref}>
        <Outlet />
      </div>
    </div>
  )
}
