import type { ColumnDef, TableState } from '@tanstack/table-core'

import type { PlayerColumn } from './bracket-lib'

export interface TableExport {
  name: string
  headers: { id: string; label: string; colSpan: number }[][]
  rows: PlayerColumn[]
}

export interface DataTableState<TData> extends TableState {
  update: (newData: TData[], newColumns: ColumnDef<TData, unknown>[]) => void
}
