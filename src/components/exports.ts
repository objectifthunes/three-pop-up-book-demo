export type Badge = 'FULL-SCREEN' | 'CLASS' | 'UTIL' | 'TYPE'

export const LIB_NAME = '@objectifthunes/three-pop-up-book'
export const LIB_VERSION = '0.1.3'
export const NPM_URL = 'https://www.npmjs.com/package/@objectifthunes/three-pop-up-book'
export const REPO_URL = 'https://github.com/objectifthunes/three-pop-up-book'

export interface ExportEntry {
  slug: string
  name: string
  group: GroupId
  href: string
  badge?: Badge
  lede: string
}

export type GroupId =
  | 'start'
  | 'popupbook'
  | 'scenes'
  | 'elements'
  | 'reference'

export const GROUPS: { id: GroupId; label: string }[] = [
  { id: 'start',     label: 'Getting started' },
  { id: 'popupbook', label: 'The PopUpBook'   },
  { id: 'scenes',    label: 'Scenes'          },
  { id: 'elements',  label: 'Elements'        },
  { id: 'reference', label: 'Reference'       },
]

export const EXPORTS: ExportEntry[] = [
  // Getting started
  { slug: 'quick-start', name: 'Quick start', group: 'start', href: '/start/quick-start/', lede: 'Wrap a three-book in a PopUpBook and make a cube rise off the page in a few lines.' },
  { slug: 'concepts',    name: 'Core concepts', group: 'start', href: '/start/concepts/', lede: 'The coordinator, scenes and elements — and how pop-ups follow the page as it turns.' },

  // The PopUpBook
  { slug: 'pop-up-book',  name: 'PopUpBook', group: 'popupbook', href: '/popupbook/pop-up-book/', lede: 'The coordinator that wraps a Book and positions every pop-up as the pages move.', badge: 'CLASS' },
  { slug: 'interaction',  name: 'Interaction & hit-testing', group: 'popupbook', href: '/popupbook/interaction/', lede: 'bindInteraction(), hitTest(), and the pointer-event callbacks for clicking pop-ups.' },

  // Scenes
  { slug: 'pop-up-scene',   name: 'PopUpScene', group: 'scenes', href: '/scenes/pop-up-scene/', lede: 'A container for the pop-ups on one page side — add, update, remove and broadcast progress.', badge: 'CLASS' },
  { slug: 'spread-scene',   name: 'PopUpSpreadScene', group: 'scenes', href: '/scenes/spread-scene/', lede: 'A two-page convenience scene exposing left and right groups for facing-page pop-ups.', badge: 'CLASS' },

  // Elements
  { slug: 'pop-up-element', name: 'PopUpElement', group: 'elements', href: '/elements/pop-up-element/', lede: 'A single 3D pop-up: any THREE.Object3D, placed by (x, z), scaled, rotated, spring-animated.', badge: 'CLASS' },
  { slug: 'animation',      name: 'Animation & springProgress', group: 'elements', href: '/elements/animation/', lede: 'The pop / collapse spring, the animated flag, and the springProgress easing curve.', badge: 'UTIL' },

  // Reference
  { slug: 'types', name: 'Types index', group: 'reference', href: '/reference/types/', lede: 'PopUpBookOptions, PopUpSceneOptions, PopUpElementOptions, PopUpInteractionOptions at a glance.', badge: 'TYPE' },
]

export function groupOf(id: GroupId) {
  return GROUPS.find(g => g.id === id)!
}

export function exportsByGroup(id: GroupId) {
  return EXPORTS.filter(e => e.group === id)
}

export function findExport(href: string): ExportEntry | undefined {
  return EXPORTS.find(e => e.href === href)
}

export const TOTAL_EXPORTS = EXPORTS.length
