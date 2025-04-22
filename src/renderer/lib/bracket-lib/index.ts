import type { Bracket, Player, Organization, Winners } from '@lib/types/bracket-lib'

// ==================== Tournament Order Generation ====================
function generateTournamentOrder(size: number): number[] {
  if (size === 1) return [1]

  const halfSize = Math.max(Math.floor(size / 2), 1)
  const halfOrder = generateTournamentOrder(halfSize)
  const result: number[] = []

  for (let i = 0; i < halfOrder.length; i++) {
    result.push(halfOrder[i])
    result.push(halfOrder[i] + halfSize)
  }

  return result
}

export const ROUNDS = ['1', '2', '3', '4', 'FIM']

export function roundsBySize(size: number): string[] {
  const numRounds = Math.ceil(Math.log2(size))
  return ROUNDS.slice(0, Math.max(numRounds, 1))
}

export function retrieveWinners(bracket: Bracket, player: Player): Winners {
  const matches: Winners['matches'] = {}
  const winners: Winners['winners'] = [
    {
      contestantId: player.contestantId,
      classification: 1
    }
  ]

  for (const match of bracket.matches.toSorted((a, b) => b.roundIndex - a.roundIndex)) {
    if (match.roundIndex < bracket.rounds.length - 2) continue

    if (match.roundIndex == bracket.rounds.length - 1) {
      for (const [i, side] of match.sides.entries()) {
        if (!side?.contestantId || side.contestantId == player.contestantId) continue
        winners.push({
          contestantId: side.contestantId,
          classification: 2
        })
        matches[`${match.roundIndex}:${match.order}`] = {
          top: i == 0 ? 2 : 1,
          bottom: i == 0 ? 1 : 2
        }
      }
      continue
    }

    for (const [i, side] of match.sides.entries()) {
      if (!side?.contestantId || winners.some((w) => w.contestantId == side.contestantId)) continue
      winners.push({
        contestantId: side.contestantId,
        classification: 3
      })
      matches[`${match.roundIndex}:${match.order}`] = {
        ...matches[`${match.roundIndex}:${match.order}`],
        [i == 0 ? 'top' : 'bottom']: 3
      }
      break
    }
  }
  return { matches, winners }
}

// ==================== Bracket Generation ====================
export function buildBracket(players: Player[]): Bracket {
  const numPlayers = players.length
  const rounds = roundsBySize(numPlayers)
  const order = generateTournamentOrder(2 ** Math.ceil(Math.log2(numPlayers)))

  // Create contestant objects
  const contestants = players.reduce((prev, player) => {
    return {
      ...prev,
      [player.contestantId]: {
        players: [{ title: player.name, nationality: player.organization }]
      }
    }
  }, {})

  // Generate match pairs
  const matchPairs: { [key: string]: string[] } = {}
  for (let i = 0; i < numPlayers; i += 1) {
    const currOrdem = order[i] - 1
    const orderDiv2 = ((currOrdem - (currOrdem % 2)) / 2).toString()

    if (!(orderDiv2 in matchPairs)) {
      matchPairs[orderDiv2] = []
    }
    matchPairs[orderDiv2].push(players[i].contestantId)
  }

  // Create the complete bracket
  return {
    rounds: rounds.map((name) => ({ name })),
    contestants,
    matches: Object.entries(matchPairs).map(([k, pair]) => ({
      roundIndex: 0,
      order: parseInt(k),
      sides: pair.map((p) => ({ contestantId: p }))
    }))
  }
}

// ==================== Data Generation ====================

function cyrb128(str: string) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  h1 ^= h2 ^ h3 ^ h4
  h2 ^= h1
  h3 ^= h1
  h4 ^= h1
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0]
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a |= 0
    b |= 0
    c |= 0
    d |= 0
    const t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}

function buildRandomGen(seedStr: string) {
  // Create cyrb128 state:
  const seed = cyrb128(seedStr)
  // Four 32-bit component hashes provide the seed for sfc32.
  const rand = sfc32(seed[0], seed[1], seed[2], seed[3])

  return rand
}

export function generateRandomOrganizations(
  numOrgs: number,
  playersPerOrg: number
): Organization[] {
  const rand = buildRandomGen('seed')
  const maleNames = [
    'Alan',
    'Lucas',
    'Marcelo',
    'Carlos',
    'Ricardo',
    'João',
    'Pedro',
    'Miguel',
    'Gabriel',
    'Rafael'
  ]
  const femaleNames = [
    'Ana',
    'Maria',
    'Joana',
    'Fernanda',
    'Paula',
    'Luisa',
    'Sofia',
    'Julia',
    'Beatriz',
    'Laura'
  ]
  const orgNames = [
    'Escola Politécnica',
    'Escola de Engenharia',
    'Escola de Artes',
    'Academia Judo',
    'Centro Esportivo',
    'Clube Atlético',
    'Instituto Nacional',
    'Associação Desportiva',
    'Federação Estadual',
    'União Esportiva'
  ]
  const categories = ['KIDS', 'KIDS 2', 'JUNIOR', 'TEEN', 'ADULT']

  return Array.from({ length: numOrgs }, (_, i) => {
    const orgName = i < orgNames.length ? orgNames[i] : `Organização ${i + 1}`

    const players = Array.from({ length: playersPerOrg }, () => {
      const isMale = rand() > 0.5
      const names = isMale ? maleNames : femaleNames
      return {
        name: names[Math.floor(rand() * names.length)],
        isMale,
        category: categories[Math.floor(rand() * categories.length)]
      }
    })

    return {
      organization: orgName,
      players
    }
  })
}
