import type {
  Bracket,
  Player,
  Organization,
  Winners,
  Category,
  TaggedBracket,
  Gendered
} from '@lib/types/bracket-lib'
import { splitEvenly, buildRandomGen, pickRandom } from '@lib/utils'

export const ROUNDS = ['1', '2', '3', '4', 'FIM']

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
export function buildBracket(players: Player[]): TaggedBracket {
  if (
    players.some((player) => hashCategory(player.category) != hashCategory(players[0].category))
  ) {
    throw Error('Attempt to create Bracket with players of mixed categories')
  }

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
    category: players[0].category,
    matches: Object.entries(matchPairs).map(([k, pair]) => ({
      roundIndex: 0,
      order: parseInt(k),
      sides: pair.map((p) => ({ contestantId: p }))
    }))
  }
}

// Helper function to split players and create brackets
export function createGroupedBrackets(players: Player[]): TaggedBracket[] {
  const maxChunk = 8
  const nChunks = Math.ceil(players.length / maxChunk)
  const chunks = splitEvenly(players, nChunks)

  const result: TaggedBracket[] = []
  const letterGen = (n) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return letters[n % letters.length]
  }

  for (const [i, chunk] of chunks.entries()) {
    if (chunks.length > 1) {
      for (const player of chunk) {
        player.category.push({ id: 'Grupo', value: letterGen(i) })
      }
    }

    result.push(buildBracket(chunk))
  }

  return result
}

export function hashCategory(category: Category) {
  return category
    .map((t) => t.id + '¬' + t.value)
    .toSorted()
    .join('¨')
}

export function unhashCategory(hashed: string): Category {
  return hashed.split('¨').map((hashedTag) => {
    const [id, value] = hashedTag.split('¬')
    return { id, value }
  })
}

export function compareCategory(a: Category, b: Category) {
  return hashCategory(a) == hashCategory(b)
}

export function gendered<T>(fn: (gender: 'female' | 'male') => T): Gendered<T> {
  return {
    male: fn('male'),
    female: fn('female')
  }
}

export function isGendered<T>(obj: T) {
  if (!obj || typeof obj != 'object') return false
  if (Object.keys(obj).length != 2) return false
  if (!('male' in obj) || !('female' in obj)) return false

  return true
}
// ==================== Data Generation ====================

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
  const categories = [
    {
      id: 'Peso',
      values: ['10kg', '20kg', '30kg', '40kg', '50kg']
    },
    {
      id: 'SUB',
      values: ['SUB10', 'SUB11', 'SUB12', 'SUB13', 'SUB14', 'SUB15', 'SUB16']
    }
  ]

  return Array.from({ length: numOrgs }, (_, i) => {
    const orgName = i < orgNames.length ? orgNames[i] : `Organização ${i + 1}`

    const players = Array.from({ length: playersPerOrg }, () => {
      const isMale = rand() > 0.5
      const names = isMale ? maleNames : femaleNames
      return {
        name: pickRandom(names, rand()),
        isMale,
        category: categories.map(({ id, values }) => ({ id, value: pickRandom(values, rand()) }))
      }
    })

    return {
      organization: orgName,
      players
    }
  })
}
