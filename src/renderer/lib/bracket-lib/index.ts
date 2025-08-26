import type {
  Bracket,
  Category,
  Gendered,
  Organization,
  Player,
  Tag,
  TaggedBracket,
  Winners
} from '@lib/types/bracket-lib'
import { buildRandomGen, pickRandom, shuffleArray, splitEvenly } from '@lib/utils'

const rand = buildRandomGen('seed')

import { bracketsStore, playersStore, winnerStore } from '@/states.svelte'

export const ROUNDS = ['1', '2', '3', '4', 'FIM']

export function getPoints(player: Player): number {
  const gender = player.isMale ? 'male' : 'female'
  let points = 0

  for (const [hashedCategory, winners] of Object.entries(winnerStore.winnersByCategory[gender])) {
    const category = unhashCategory(hashedCategory)
    if (!compareCategory(category, player.category)) continue

    const winner = winners.winners?.find((w) => w.contestantId == player.contestantId)
    if (!winner) {
      points += 0
      continue
    }
    switch (winner.classification) {
      case 1:
        points += 7
        break
      case 2:
        points += 5
        break
      case 3:
      case 4:
        points += 3
        break
    }
  }

  return points
}

// ==================== Tournament Order Generation ====================
export function generateTournamentOrder(size: number): number[] {
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
    if (
      match.roundIndex < bracket.rounds.length - 2 ||
      match.roundIndex > bracket.rounds.length - 1
    )
      continue

    if (match.roundIndex == bracket.rounds.length - 1) {
      for (const [i, side] of match.sides.entries()) {
        if (!side?.contestantId || player.contestantId == side.contestantId) continue
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
      const classification = winners.find((w) => w.classification == 3) ? 4 : 3
      winners.push({
        contestantId: side.contestantId,
        classification
      })
      matches[`${match.roundIndex}:${match.order}`] = {
        ...matches[`${match.roundIndex}:${match.order}`],
        [i == 0 ? 'top' : 'bottom']: classification
      }
      break
    }
  }
  return { matches, winners, dirty: false }
}

// ==================== Bracket Generation ====================
export function buildBracket(players: Player[], bracketSize = 0, useStore = true): TaggedBracket {
  if (useStore) {
    players = players.map((p) => playersStore.byContestantId[p.contestantId])
  }
  if (
    players.some((player) => hashCategory(player.category) != hashCategory(players[0].category))
  ) {
    console.warn('Attempt to create Bracket with players of mixed categories')
  }

  if (bracketSize != 0 && bracketSize < players.length) {
    throw Error(
      `Trying to create bracket smaller than number of players. players: ${players.length}; brackerSize: ${bracketSize}`
    )
  }

  const numPlayers = players.length
  const rounds = roundsBySize(bracketSize || numPlayers)
  const order = generateTournamentOrder(2 ** Math.ceil(Math.log2(bracketSize || numPlayers)))

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
    status: [],
    matches: Object.entries(matchPairs).map(([k, pair]) => ({
      roundIndex: 0,
      order: parseInt(k),
      sides: pair.map((p) => ({ contestantId: p }))
    }))
  }
}

export function randomizedSort<T extends object>(items: T[], key: string): T[] {
  const grouped = Object.groupBy(items, (obj) => obj[key] as string) as Record<string, T[]>
  const groups = shuffleArray(Object.keys(grouped), rand)
  return groups.flatMap((group) => shuffleArray(grouped[group], rand))
}

// Helper function to split players and create brackets
export function createGroupedBrackets(
  players: Player[],
  maxChunk = 8,
  useStore = true
): TaggedBracket[] {
  const nChunks = Math.ceil(players.length / maxChunk)
  const chunks = splitEvenly(randomizedSort(players, 'organization'), nChunks)

  const letterGen = (n: number) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return letters[n % letters.length]
  }

  // Is expected that all players gender and category are equal
  const gender = players[0].isMale ? 'male' : 'female'
  const category = players[0].category

  const newTags: Tag[] = []

  if (nChunks > 1) {
    for (let i = 0; i < 25; i++) {
      if (newTags.length >= nChunks) break
      const newTag: Tag = { id: 'Grupo', value: letterGen(i) }
      if (!bracketsStore.has(gender, [...category.filter((t) => t.id != 'Grupo'), newTag])) {
        newTags.push(newTag)
      }
    }
    playersStore.bulkAttachTags(
      chunks.flat(),
      chunks.map((players, i) => Array(players.length).fill([newTags[i]])).flat()
    )
  }

  return chunks.map((chunk) => buildBracket(chunk, 0, useStore))
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

export function compareCategory(a: Category, b: Category, excludeIds: string[] = []) {
  const excludeFn = (category: Category) => category.filter((tag) => !excludeIds.includes(tag.id))

  return hashCategory(excludeFn(a)) == hashCategory(excludeFn(b))
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
        name: pickRandom(names, rand),
        isMale,
        category: categories.map(({ id, values }) => ({ id, value: pickRandom(values, rand) }))
      }
    })

    return {
      organization: orgName,
      players
    }
  })
}
