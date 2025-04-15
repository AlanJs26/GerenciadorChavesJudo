import type { Player } from '@lib/types/bracket-lib'

let players: Player[] = $state([])

export const playersStore = {
  get players(): Player[] {
    return players
  },
  set players(value: Player[]) {
    players = value
  }
}
