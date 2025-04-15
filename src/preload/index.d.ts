import { ElectronAPI } from '@electron-toolkit/preload'
import type { Organization, Player } from '@lib/types/bracket-lib'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      organizationFromFile: (file: File) => Promise<Organization>
      exportPlayers: (players: Omit<Player, 'contestantId'>[]) => Promise<void>
    }
  }
}
