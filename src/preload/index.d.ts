import { ElectronAPI } from '@electron-toolkit/preload'
import type { Organization, State } from '@lib/types/bracket-lib'
import type { TableExport } from '@lib/types/data-table'
import type { Result } from '@shared/errors'

export interface API {
  organizationFromFile: (type: string, file: File) => Promise<Result<Organization[]>>
  exportTable: (tableData: TableExport, defaultPath: string) => Promise<Result<void>>
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
