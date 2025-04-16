import { ElectronAPI } from '@electron-toolkit/preload'
import type { Organization, PlayerColumn } from '@lib/types/bracket-lib'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      organizationFromFile: (file: File) => Promise<Organization>
      exportPlayers: (players: PlayerColumn[]) => Promise<void>
    }
  }
}
