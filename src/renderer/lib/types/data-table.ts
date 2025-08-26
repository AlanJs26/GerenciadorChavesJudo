export interface TableExport {
  name: string
  headers: { id: string; label: string; colSpan: number }[][]
  rows: Record<string, string | boolean | number>[]
}
