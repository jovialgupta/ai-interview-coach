import type { ReactNode } from 'react'

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <p className="state-loading">{label}</p>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="state-empty">{children}</div>
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="state-error" role="alert">
      {message}
    </div>
  )
}
