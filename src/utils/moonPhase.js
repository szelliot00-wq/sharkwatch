/**
 * Client-side lunar phase calculator.
 * No API required. Uses a known new moon reference date and the synodic month length.
 */

const KNOWN_NEW_MOON = new Date('2024-01-11T11:57:00Z')
const LUNAR_CYCLE = 29.53058770576 // days

const PHASES = [
  {
    name: 'New Moon',
    emoji: '🌑',
    min: 0,
    max: 1.85,
    sharkNote: 'Sharks may hunt in deeper water as surface is darkest',
  },
  {
    name: 'Waxing Crescent',
    emoji: '🌒',
    min: 1.85,
    max: 7.38,
    sharkNote: 'Increasing light may draw prey to the surface',
  },
  {
    name: 'First Quarter',
    emoji: '🌓',
    min: 7.38,
    max: 9.22,
    sharkNote: 'Tidal changes can trigger feeding activity in coastal sharks',
  },
  {
    name: 'Waxing Gibbous',
    emoji: '🌔',
    min: 9.22,
    max: 14.77,
    sharkNote: 'Growing moonlight supports nocturnal hunting',
  },
  {
    name: 'Full Moon',
    emoji: '🌕',
    min: 14.77,
    max: 16.61,
    sharkNote: 'Sharks may feed more actively in shallow water tonight',
  },
  {
    name: 'Waning Gibbous',
    emoji: '🌖',
    min: 16.61,
    max: 22.15,
    sharkNote: 'Post-full moon — prey still active near surface',
  },
  {
    name: 'Last Quarter',
    emoji: '🌗',
    min: 22.15,
    max: 24.0,
    sharkNote: 'Tidal shifts influence shark movement in estuaries',
  },
  {
    name: 'Waning Crescent',
    emoji: '🌘',
    min: 24.0,
    max: 29.53,
    sharkNote: 'Sharks return to deeper hunting grounds',
  },
]

/**
 * Returns the current lunar phase information.
 * @returns {{ phase: number, phaseName: string, emoji: string, sharkNote: string }}
 */
export function getMoonPhase() {
  const now = new Date()
  const elapsed = (now - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24) // days since known new moon
  const phase = ((elapsed % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE // 0-29.53

  const phaseInfo = PHASES.find(p => phase >= p.min && phase < p.max) || PHASES[PHASES.length - 1]

  return {
    phase,
    phaseName: phaseInfo.name,
    emoji: phaseInfo.emoji,
    sharkNote: phaseInfo.sharkNote,
  }
}
