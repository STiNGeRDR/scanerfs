import cn from 'classnames'
import React from 'react'

import css from './index.module.scss'

export type AlertProps = { color: 'red' | 'green'; hidden?: boolean; children: React.ReactNode }
export const Alert = ({ color, hidden, children }: AlertProps) => {
  if (hidden) {
    return null
  }
  return <div className={cn({ [css.alert]: true, [css[color]]: true })}>{children}</div>
}
