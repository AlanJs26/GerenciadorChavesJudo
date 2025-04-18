import type { Bracket, Player, Organization } from '@lib/types/bracket-lib'

// ==================== Tournament Order Generation ====================
function generateTournamentOrder(size: number): number[] {
  if (size === 1) return [1]

  const halfSize = Math.max(Math.floor(size / 2), 1)
  const halfOrder = generateTournamentOrder(halfSize)
  const result = []

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
  const categories = ['KIDS', 'KIDS 2', 'JUNIOR', 'TEEN', 'ADULT']

  return Array.from({ length: numOrgs }, (_, i) => {
    const orgName = i < orgNames.length ? orgNames[i] : `Organização ${i + 1}`

    const players = Array.from({ length: playersPerOrg }, () => {
      const isMale = Math.random() > 0.5
      const names = isMale ? maleNames : femaleNames
      return {
        name: names[Math.floor(Math.random() * names.length)],
        isMale,
        category: categories[Math.floor(Math.random() * categories.length)]
      }
    })

    return {
      organization: orgName,
      players
    }
  })
}
