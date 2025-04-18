import { Player } from '@lib/types/bracket-lib'

export type PlayerTableMeta = {
  removePlayer: (player: Player) => void
  addPlayer: (player: Omit<Player, 'contestantId'>) => void
}
