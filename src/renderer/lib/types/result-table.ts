export type Difficulty<S extends object, A extends object> =
  | ({
      [K in keyof S]: S[keyof S]
    } & { difficulty: 'simple' })
  | ({
      [K in keyof A]: A[keyof A]
    } & { difficulty: 'advanced' })

export interface AdvancedField {
  code: string
}

export interface OperationSimple {
  type: 'sum' | 'max' | 'min'
}

export interface FormulaSimple {
  field: string
  operation: Operation
}

export type Operation = Difficulty<OperationSimple, AdvancedField>
export type Formula = Difficulty<FormulaSimple, AdvancedField>

export interface Column {
  name: string
  type: 'data' | 'order'
  formula: Formula
}

type AggregationColumn = Column

export interface Aggregation {
  name: string
  groups: string[]
  column: AggregationColumn | null
}

export interface ResultColumn extends Column {
  aggregations: Aggregation[]
}

export interface FilterItem {
  field: string
  selection: string | null
}

export interface FilterSimple {
  items: FilterItem[]
}

export type Filter = Difficulty<FilterSimple, AdvancedField>

export interface ResultTable {
  name: string
  filter: Filter
  columns: ResultColumn[]
  extraColumns: Column[]
  extraRows: Omit<Column, 'type'>
}
