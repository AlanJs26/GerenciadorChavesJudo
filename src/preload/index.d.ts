import { ElectronAPI } from '@electron-toolkit/preload'
import type { Organization, PlayerColumn, State } from '@lib/types/bracket-lib'
import type { Result } from '@shared/errors'

export interface API {
  organizationFromFile: (file: File) => Promise<Result<Organization>>
  exportPlayers: (players: PlayerColumn[]) => Promise<Result<void>>
  exportState: (state: string, defaultPath?: string) => Promise<Result<void>>
  importState: (defaultPath?: string) => Promise<Result<State>>
  printPDF: () => Promise<Result<string>>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
