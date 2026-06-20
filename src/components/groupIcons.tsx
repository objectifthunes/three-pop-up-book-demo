import {
  Boxes,
  ListTree,
  PlayCircle,
  Rocket,
  Shapes,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { GroupId } from './exports'

export const GROUP_ICONS: Record<GroupId, LucideIcon> = {
  start:     Rocket,
  popupbook: Sparkles,
  scenes:    Boxes,
  elements:  Shapes,
  reference: Wrench,
  live:      PlayCircle,
}

/** Use this for sidebar nav items + group eyebrows. */
export function GroupIcon({ group, size = 12 }: { group: GroupId; size?: number }) {
  const Icon = GROUP_ICONS[group] ?? ListTree
  return <Icon size={size} strokeWidth={1.75} />
}
