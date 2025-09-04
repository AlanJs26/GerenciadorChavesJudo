import { DataTableCell, DataTableColumnHeader } from '@components/data-table'
import { renderComponent } from '@components/ui/data-table'
import type { PlayerColumn } from '@lib/types/bracket-lib'
import type { Player } from '@lib/types/bracket-lib'
import type { TableExport } from '@lib/types/data-table'
import type { FilterObj, ResultTable } from '@lib/types/result-table'
import type { ColumnDef, Table } from '@tanstack/table-core'

import { resultObjects } from './objects.svelte'

type Aggregator = { filter: FilterObj<null>; selection: null }
type FieldFilter = { filter: FilterObj<string | null>; selection: unknown }

export function buildTableData<TData = Player[]>(players: Player[], resultTable: ResultTable) {
  const { columns, filters, name } = resultTable

  for (const filter of filters) {
    if (!(filter.field in resultObjects.filters))
      throw Error(`Invalid Filter "${filter.field}" for table "${name}"`)
  }

  const { aggregators, fieldFilters } = filters.reduce(
    (acc, filter) => {
      if (filter.selection == null) {
        acc['aggregators'].push({
          filter: resultObjects.filters[filter.field],
          selection: filter.selection
        })
      } else {
        acc['fieldFilters'].push({
          filter: resultObjects.filters[filter.field],
          selection: filter.selection
        })
      }
      return acc
    },
    { aggregators: [] as Aggregator[], fieldFilters: [] as FieldFilter[] }
  )

  if (aggregators.length > 1) {
    throw Error('only one row aggregator is allowed')
  }

  for (const { filter, selection } of fieldFilters) {
    players = filter.apply(players as Player[], selection as null) as Player[]
  }

  const rows = aggregators.length
    ? Object.values(aggregators[0].filter.apply(players, null))
    : [players]

  const tableColumns: ColumnDef<TData>[] = []
  const columnValues: Record<string, string[]> = {}
  for (const { filters, formula, name } of columns) {
    if (!((formula.value ?? 'null') in resultObjects.sources))
      throw Error(`Invalid Source "${formula.value}" for column "${name}"`)
    if (!(formula.operation in resultObjects.operations))
      throw Error(`Invalid Operation "${formula.operation}" for column "${name}"`)

    const aggregators: FilterObj[] = []
    const fieldFilters: FieldFilter[] = []
    for (const filter of filters) {
      if (!(filter.field in resultObjects.filters))
        throw Error(`Invalid Filter "${filter.field}" for column "${name}"`)
      if (filter.selection == null) {
        aggregators.push(resultObjects.filters[filter.field])
      } else {
        fieldFilters.push({
          filter: resultObjects.filters[filter.field],
          selection: filter.selection
        })
      }
    }

    const getColumnValue = (players: Player[], fieldFilters: FieldFilter[]) => {
      for (const { filter, selection } of fieldFilters) {
        players = filter.apply(players, selection as string) as Player[]
      }
      const items = resultObjects.sources[formula.value ?? 'null'].fetch(players)
      return resultObjects.operations[formula.operation].apply(items)
    }

    const buildColumn = (header: string, reverse_stack: FieldFilter[] = []): ColumnDef<TData> => {
      const fields = reverse_stack.map((s) => s.selection)
      const id = [name, ...fields].join() || header

      columnValues[id] = rows.map((players) =>
        getColumnValue(players, [...fieldFilters, ...reverse_stack])
      )
      return {
        id,
        accessorFn: (_, index: number) => {
          const rows = columnValues[id]

          if (formula.rank) {
            return (
              rows
                .map(Number)
                .toSorted((a, b) => b - a)
                .indexOf(parseInt(rows[index]) || 0) + 1
            )
          }
          return rows[index]
        },
        header: ({ column }) => {
          return renderComponent(DataTableColumnHeader, {
            column,
            title: header,
            fit: true,
            center: true
          })
        },
        cell: ({ getValue }) => {
          return renderComponent(DataTableCell, {
            value: getValue(),
            center: true
          })
        }
      }
    }

    type RecursiveColumn =
      | Record<string, Player[]>
      | Player[]
      | ColumnDef<TData>
      | ColumnDef<TData>[]

    function applyAggregation(
      players: Player[] | Record<string, Player[]>,
      filter_stack: FilterObj[],
      reverse_stack: FieldFilter[] = []
    ): RecursiveColumn | { header: string; columns: RecursiveColumn } {
      if (filter_stack.length == 0) {
        if (Array.isArray(players)) {
          return buildColumn(name)
        } else {
          for (let i = 0; i < reverse_stack.length - 1; i++) {
            reverse_stack[i].selection = reverse_stack[i + 1].selection
          }
          return Object.entries(players).map(([header, _players]) =>
            buildColumn(header, [
              ...reverse_stack.slice(0, -1),
              { filter: reverse_stack.at(-1)!.filter, selection: header }
            ])
          )
        }
      }

      const filter = filter_stack.shift()!

      const columns = Array.isArray(players)
        ? applyAggregation(filter.apply(players, null), filter_stack, [
          ...reverse_stack,
          { filter, selection: null }
        ])
        : Object.entries(players).map(([header, players]) => ({
          header,
          columns: applyAggregation(filter.apply(players, null), filter_stack, [
            ...reverse_stack,
            { filter, selection: header }
          ])
        }))

      return reverse_stack.length
        ? columns
        : {
          header: name,
          columns
        }
    }

    tableColumns.push(applyAggregation(players, aggregators) as ColumnDef<TData>)
  }

  return { rows, columns: tableColumns as ColumnDef<TData>[] }
}

export async function exportTableData(tableData: TableExport | TableExport[], filename: string) {
  await window.api.exportTable(tableData, `${filename}.xlsx`)
}
