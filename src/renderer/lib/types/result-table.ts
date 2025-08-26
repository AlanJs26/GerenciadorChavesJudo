import type { Player } from '@lib/types/bracket-lib'
export type Operation = 'sum' | 'max' | 'min' | 'count' | 'maxcount'

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
}

export type SourceObj = {
  label: string
  allowedOperations: string[]
  fetch: (players: Player[]) => string[]
}

export type OperationObj = {
  label: string
  allowRank: boolean
  apply: (items: string[]) => string
}

export type FilterObj<T = null> = {
  label: string
  values: T[]
  apply: (
    players: Player[],
    value: T | null
  ) => T extends null ? Record<string, Player[]> : Player[]
}
