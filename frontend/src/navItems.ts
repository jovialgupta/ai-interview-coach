import type { ComponentType } from 'react'
import { IconClock, IconDocument, IconHome, IconTrendingUp } from './icons'

export interface NavItem {
  to: string
  label: string
  description: string
  Icon: ComponentType<{ className?: string }>
}

/** Single source of truth for the signed-in nav destinations, shown in the sidebar (Layout). */
export const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Where you stand, and starting a new session.',
    Icon: IconHome,
  },
  {
    to: '/onboarding',
    label: 'My docs',
    description: 'Update the resume your questions are generated from.',
    Icon: IconDocument,
  },
  {
    to: '/history',
    label: 'Interview history',
    description: "Every session you've run, at a glance.",
    Icon: IconClock,
  },
  {
    to: '/learning-journey',
    label: 'Learning journey',
    description: 'How your scores have moved over time.',
    Icon: IconTrendingUp,
  },
]
