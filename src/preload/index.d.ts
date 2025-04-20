import { ElectronAPI } from '@electron-toolkit/preload'
import type { Organization, PlayerColumn } from '@lib/types/bracket-lib'
import type { ResultError } from '@lib/types/errors'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      organizationFromFile: (file: File) => Promise<ResultError<Organization>>
      exportPlayers: (players: PlayerColumn[]) => Promise<void>
      printPDF: () => Promise<string>
    }
  }
}
