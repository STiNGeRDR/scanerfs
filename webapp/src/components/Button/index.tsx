import cn from 'classnames'
import React from 'react'
import { Link } from 'react-router-dom'

import css from './index.module.scss'

export type ButtonProps = { children: React.ReactNode; loading?: boolean }
export const Button = ({ children, loading = false }: ButtonProps) => {
  return (
    <button
      className={cn({ [css.button]: true, [css.disabled]: loading, [css.loading]: loading })}
      type="submit"
      disabled={loading}
    >
      <span className={css.text}>{children}</span>
    </button>
  )
}

export const LinkButton = ({ children, to }: { children: React.ReactNode; to: string }) => {
  return (
    <Link className={cn({ [css.button]: true })} to={to}>
      {children}
    </Link>
  )
}
