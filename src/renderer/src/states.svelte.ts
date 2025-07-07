import type {
  Player,
  BracketCollection,
  WinnersByCategory,
  Winners,
  Bracket
} from '@lib/types/bracket-lib'

/**
 * Create a generic store factory for consistent state management
 */
function createStore<T>(initialValue: T) {
  let state: T = $state(initialValue)

  return {
    get state(): T {
      return state
    },
    set state(value: T) {
      state = value
    },
    update(updater: (value: T) => T): void {
      state = updater(state)
    }
  }
}

// Players store
const playersStoreInternal = createStore<Player[]>([])

export const playersStore = {
  get players(): Player[] {
    return playersStoreInternal.state
  },
  set players(value: Player[]) {
    playersStoreInternal.state = value
  },
  addPlayer(player: Player): void {
    playersStoreInternal.update((players) => [...players, player])
  },
  updatePlayer(index: number, player: Player): void {
    playersStoreInternal.update((players) => {
      const newPlayers = [...players]
      newPlayers[index] = player
      return newPlayers
    })
  }
}

// Brackets store
const bracketsStoreInternal = createStore<BracketCollection>({ male: {}, female: {} })

export const bracketsStore = {
  get brackets(): BracketCollection {
    return bracketsStoreInternal.state
  },
  set brackets(value: BracketCollection) {
    bracketsStoreInternal.state = value
  },
  addBracket(gender: 'male' | 'female', category: string, bracket: Bracket): void {
    bracketsStoreInternal.update((brackets) => ({
      ...brackets,
      [gender]: {
        ...brackets[gender],
        [category]: bracket
      }
    }))
  }
}

// Winners store
const winnerStoreInternal = createStore<WinnersByCategory>({})

export const winnerStore = {
  get winnersByCategory(): WinnersByCategory {
    return winnerStoreInternal.state
  },
  set winnersByCategory(value: WinnersByCategory) {
    winnerStoreInternal.state = value
  },
  updateCategoryWinner(category: string, winners: Winners): void {
    winnerStoreInternal.update((state) => ({
      ...state,
      [category]: winners
    }))
  }
}
