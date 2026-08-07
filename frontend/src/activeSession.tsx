import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface ActiveSessionContextValue {
  activeSessionId: string | null
  setActiveSessionId: (sessionId: string | null) => void
}

const ActiveSessionContext = createContext<ActiveSessionContextValue | null>(null)

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  return (
    <ActiveSessionContext.Provider value={{ activeSessionId, setActiveSessionId }}>
      {children}
    </ActiveSessionContext.Provider>
  )
}

export function useActiveSession(): ActiveSessionContextValue {
  const ctx = useContext(ActiveSessionContext)
  if (!ctx) throw new Error('useActiveSession must be used within an ActiveSessionProvider')
  return ctx
}
