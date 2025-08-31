<script lang="ts">
  import { DataTableCell, DataTableColumnHeader } from '@components/data-table'
  import DataTable from '@components/data-table/DataTable.svelte'
  import ConfigPopover from '@components/result-tab/config-popover/ConfigPopover.svelte'
  import { Button } from '@components/ui/button'
  import { renderComponent } from '@components/ui/data-table'
  import type { Player, PlayerColumn } from '@lib/types/bracket-lib'
  import type { FilterObj, ResultTable } from '@lib/types/result-table'

  import FilterSelect from '@/components/result-tab/filter-select.svelte'
  import { playersStore, resultTableStore } from '@/states.svelte'

  import { resultObjects } from './objects.svelte'

  type Aggregator = { filter: FilterObj<null>; selection: null }
  type FieldFilter = { filter: FilterObj<unknown>; selection: unknown }

  function buildTable(players: Player[], resultTable: ResultTable) {
    const { columns, filters, name } = resultTable

    for (const filter of filters) {
      if (!(filter.field in resultObjects.filters))
        throw Error(`Invalid Filter "${filter.field}" for table "${name}"`)
    }

    const { aggregators, fieldFilters } = filters.reduce(
      (acc, filter) => {
        acc[filter.selection == null ? 'aggregators' : 'fieldFilters'].push({
          filter: resultObjects.filters[filter.field],
          selection: filter.selection
        })
        return acc
      },
      { aggregators: [] as Aggregator[], fieldFilters: [] as FieldFilter[] }
    )

    if (aggregators.length > 1) {
      throw Error('only one row aggregator is allowed')
    }

    for (const { filter, selection } of fieldFilters) {
      players = filter.apply(players, selection)
    }

    const rows = aggregators.length
      ? Object.values(aggregators[0].filter.apply(players))
      : [players]

    const tableColumns = []
    const columnValues: Record<string, string[]> = {}
    for (const { filters, formula, name } of columns) {
      if (!(formula.value in resultObjects.sources))
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
      // console.log(aggregators)

      const getColumnValue = (players, fieldFilters) => {
        for (const { filter, selection } of fieldFilters) {
          players = filter.apply(players, selection)
        }
        const items = resultObjects.sources[formula.value].fetch(players)
        return resultObjects.operations[formula.operation].apply(items)
      }

      const buildColumn = (header: string, reverse_stack: FieldFilter[] = []) => {
        const fields = reverse_stack.map((s) => s.selection)
        const id = [name, ...fields].join() || header

        columnValues[id] = rows.map((players) =>
          getColumnValue(players, [...fieldFilters, ...reverse_stack])
        )
        return {
          id,
          accessorFn: (_players: Player[], index: number) => {
            const rows = columnValues[id]

            if (formula.rank) {
              return (
                rows
                  .map(Number)
                  .toSorted((a, b) => b - a)
                  .indexOf(rows[index]) + 1
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

      function applyAggregation(
        players: Player[],
        filter_stack: FilterObj[],
        reverse_stack: FieldFilter[] = []
      ): Record<string, Player[]> | Player[] {
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
                { filter: reverse_stack.at(-1).filter, selection: header }
              ])
            )
          }
        }

        const filter = filter_stack.shift()

        const columns = Array.isArray(players)
          ? applyAggregation(filter.apply(players), filter_stack, [
              ...reverse_stack,
              { filter, selection: null }
            ])
          : Object.entries(players).map(([header, players]) => ({
              header,
              columns: applyAggregation(filter.apply(players), filter_stack, [
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

      tableColumns.push(applyAggregation(players, aggregators))
    }
    // console.log(columnValues)

    // console.log(resultTable)
    // console.log($state.snapshot(rows.map((r) => r.map((rr) => rr.category.map((t) => t.value)))))
    return { rows, columns: tableColumns }
  }
  let data = $state([])
  let columns = $state([])

  $effect(() => {
    if (!resultTableStore.selectedTable) return

    const players = [...playersStore.players.female, ...playersStore.players.male]
    try {
      const tableData = buildTable(players, resultTableStore.selectedTable)
      data = tableData.rows
      columns = tableData.columns
    } catch (_e) {
      data = []
      columns = []
      // console.error(e)
    }
  })
</script>

<div class="flex h-full flex-1 flex-col p-8">
  <DataTable {data} {columns}>
    {#snippet headerSnippet(table)}
      <div class="flex w-full items-center">
        {#if resultTableStore.selectedTable}
          <div class="flex flex-wrap items-center gap-1">
            <FilterSelect bind:filters={resultTableStore.selectedTable.filters} />
          </div>
        {/if}

        <div class="flex-1"></div>

        <ConfigPopover
          table={resultTableStore.selectedTable}
          onSave={(table) => {
            const i = resultTableStore.tables.findIndex(
              (t) => t.name == resultTableStore.selectedTable.name
            )
            resultTableStore.tables[i] = table
            resultTableStore.selectedName = table.name
          }}
        >
          <Button variant="outline" class="!mr-1">Editar</Button>
        </ConfigPopover>
        <Button
          variant="default"
          onclick={async () => {
            const headers = table.getHeaderGroups().map(({ headers }) =>
              headers.map(({ column, colSpan }) => ({
                id: column.id,
                label: column.id.split(',').at(-1),
                colSpan
              }))
            )
            const rows: PlayerColumn[] = table.getSortedRowModel().rows.map((row) =>
              row.getVisibleCells().reduce((acc, cell) => {
                const id = cell.id.replace(/^[0-9]+_/, '')
                return {
                  ...acc,
                  [id]: cell.getValue()
                }
              }, {})
            )
            const tableData = { name: resultTableStore.selectedName, headers, rows }
            await window.api.exportTable(tableData, `${resultTableStore.selectedName}.xlsx`)
          }}>Exportar</Button
        >
      </div>
    {/snippet}
  </DataTable>
</div>
