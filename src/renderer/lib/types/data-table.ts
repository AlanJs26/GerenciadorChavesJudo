import type { PlayerColumn } from './bracket-lib'

export interface TableExport {
  name: string
  headers: { id: string; label: string; colSpan: number }[][]
  rows: PlayerColumn[]
}
