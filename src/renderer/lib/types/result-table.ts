import type { Player } from '@lib/types/bracket-lib'
export type Operation = string

export interface ColumnFormState extends Column {
  id: string
}

export interface Formula {
  rank: boolean
  operation: Operation
  value: string | null
}

export interface Column {
  name: string
  formula: Formula
  filters: Filter[]
}

export interface Filter {
  field: string
  selection: string | null
}

export interface ResultTable {
  name: string
  filters: Filter[]
  columns: Column[]
  useSyncColumn: boolean
}

export type SourceObj = {
  label: string | null
  allowedOperations: string[]
  fetch: (players: Player[]) => string[]
}

export type OperationObj = {
  label: string
  allowRank: boolean
  apply: (items: string[]) => string
}

export type FilterObj<T extends null | string = string | null> = {
  label: string
  values: (string | null)[]
  apply: (players: Player[], value: T) => T extends null ? Record<string, Player[]> : Player[]
}
