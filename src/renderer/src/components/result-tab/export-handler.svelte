<script lang="ts">
  import type { PlayerColumn } from '@lib/types/bracket-lib'
  import type { Player } from '@lib/types/bracket-lib'
  import type { DataTableState, TableExport } from '@lib/types/data-table'
  import type { ResultTable } from '@lib/types/result-table'
  import type { Table } from '@tanstack/table-core'
  import { type Snippet, untrack } from 'svelte'

  import { buildTableData } from '@/components/result-tab/result-lib.svelte'
  import { playersStore, resultTableStore } from '@/states.svelte'

  let {
    children
  }: {
    children: Snippet
  } = $props()

  let exportStackResolve: ((headers: TableExport[]) => void) | undefined = $state()
  let exportStackExports: TableExport[] = $state([])
  let exportStack: ResultTable[] = $state([])
  let exportStackRunning = $state(false)
  let exportStackPrevName = $state('')

  $effect(() => {
    untrack(() => {
      if (exportStackRunning) {
        const table: Table<Player[]> = resultTableStore.dataTable!
        const groups = table.getHeaderGroups().map(({ headers }) =>
          headers.map(({ column, colSpan }) => ({
            colSpan,
            label: column.id.split(',').at(-1)!,
            id: column.id
          }))
        )

        exportStackExports.push({
          name: exportStackPrevName,
          headers: groups,
          rows: table.getSortedRowModel().rows.map((row) =>
            row.getVisibleCells().reduce((acc, cell) => {
              const id = cell.id.replace(/^[0-9]+_/, '')
              return {
                ...acc,
                [id]: cell.getValue()
              }
            }, {} as PlayerColumn)
          )
        })

        if (!exportStack.length) {
          exportStackResolve?.(exportStackExports)
          exportStackExports = []
          exportStackRunning = false
          exportStackPrevName = ''
        }
      }
    })

    if (!exportStack.length) return

    const table: Table<Player[]> = resultTableStore.dataTable!

    exportStackRunning = true

    const resultTable = exportStack.pop()!

    exportStackPrevName = resultTable.name

    const players = [...playersStore.players.female, ...playersStore.players.male]
    const { rows, columns } = buildTableData(players, resultTable)
    const state = table.getState() as DataTableState<Player[]>
    state.update(rows, columns)

    exportStack = [...exportStack]
  })

  export async function extractExportableTableData(
    resultTables: ResultTable[]
  ): Promise<TableExport[]> {
    const promise = new Promise((res, rej) => {
      exportStackResolve = res
      setTimeout(() => rej('Timeout'), 2000)
    })
    exportStackExports = []
    exportStackRunning = false
    exportStackPrevName = ''

    const prevResultTable = resultTableStore.selectedTable

    exportStack = [...resultTables.toReversed()]

    const headers = await promise

    if (prevResultTable) {
      const table: Table<Player[]> = resultTableStore.dataTable!

      const players = [...playersStore.players.female, ...playersStore.players.male]
      const { rows, columns } = buildTableData(players, prevResultTable)
      const state = table.getState() as DataTableState<Player[]>
      state.update(rows, columns)
    }

    return $state.snapshot(headers)
  }
</script>

{@render children?.()}
