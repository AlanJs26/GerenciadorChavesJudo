import type { Player, BracketCollection, WinnersByCategory } from '@lib/types/bracket-lib'

let players: Player[] = $state([])

export const playersStore = {
  get players(): Player[] {
    return players
  },
  set players(value: Player[]) {
    players = value
  }
}

let brackets = $state<BracketCollection>({ male: {}, female: {} })

export const bracketsStore = {
  get brackets(): BracketCollection {
    return brackets
  },
  set brackets(value: BracketCollection) {
    brackets = value
  }
}

let winnersByCategory = $state<WinnersByCategory>({})

export const winnerStore = {
  get winnersByCategory(): WinnersByCategory {
    return winnersByCategory
  },
  set winnersByCategory(value: WinnersByCategory) {
    winnersByCategory = value
  }
}
