<script lang="ts">
  import { DataTableCell, DataTableColumnHeader } from '@components/data-table'
  import DataTable from '@components/data-table/DataTable.svelte'
  import ConfigPopover from '@components/result-tab/config-popover/ConfigPopover.svelte'
  import { resultTablesStore } from '@components/result-tab/result-tables.svelte'
  import { Button, buttonVariants } from '@components/ui/button'
  import { renderComponent } from '@components/ui/data-table'
  import { getPoints } from '@lib/bracket-lib'
  import type { Player, PlayerColumn } from '@lib/types/bracket-lib'
  import type { FilterObj, OperationObj, ResultTable, SourceObj } from '@lib/types/result-table'
  import { cn } from '@lib/utils'
  import { Plus } from '@lucide/svelte'

  import { playersStore } from '@/states.svelte'

  const filterObjects: FilterObj<unknown>[] = $derived([
    ...[
      {
        key: 'isMale',
        label: 'Sexo',
        map: (s) => (s ? 'Masculino' : 'Feminino'),
        values: ['Masculino', 'Feminino']
      },
      {
        key: 'organization',
        label: 'Organização',
        values: Object.values(playersStore.organizations).flat()
      },
      {
        key: 'present',
        label: 'Presença',
        map: (s) => (s ? 'Sim' : 'Não'),
        values: ['Sim', 'Não']
      }
    ].map(({ key, label, values, map = null }) => ({
      label,
      get values() {
        return [null, ...values]
      },
      apply(players, value: string | null) {
        if (value == null) {
          return players.reduce((acc, player) => {
            const value = map?.(player[key]) ?? player[key]
            if (value in acc) {
              acc[value].push(player)
            } else {
              acc[value] = [player]
            }
            return acc
          }, {})
        }

        return players.filter((player) => map(player[key]) == value)
      }
    })),
    ...[...new Set(Object.values(playersStore.tagIds).flat())].map((tagId: string) => ({
      label: tagId,
      get values() {
        return [
          null,
          ...new Set(
            Object.values(playersStore.categories)
              .flat()
              .flat()
              .filter((t) => t.id == tagId)
              .map((t) => t.value)
          )
        ]
      },
      apply(players: Player[], value: string | null) {
        players = players.filter((player) => player.category.find((t) => t.id == tagId))

        if (value == null) {
          return players.reduce((acc, player) => {
            const tagValue = player.category.find((c) => c.id == tagId)!.value

            if (tagValue in acc) {
              acc[tagValue].push(player)
            } else {
              acc[tagValue] = [player]
            }
            return acc
          }, {})
        }

        return players.filter(
          (player) => player.category.find((c) => c.id == tagId)!.value == value
        )
      }
    }))
  ])

  const operationObjects = $state([
    {
      label: 'sum',
      allowRank: true,
      apply(rows: string[]) {
        return rows.reduce((acc, row) => +acc + +row, 0)
      }
    },
    {
      label: 'count',
      allowRank: true,
      apply(rows: string[]) {
        return rows.length
      }
    },
    {
      label: 'min',
      allowRank: true,
      apply(rows: string[]) {
        return rows.reduce((acc, row) => Math.min(+acc, +row), 0)
      }
    },
    {
      label: 'max',
      allowRank: true,
      apply(rows: string[]) {
        return rows.reduce((acc, row) => Math.max(+acc, +row), 0)
      }
    },
    {
      label: 'maxcount',
      allowRank: true,
      apply(rows: string[]) {
        if (rows.length == 0) return ''
        const countEntries = Object.entries<number>(
          rows.reduce((acc, row) => {
            acc[row] = (acc?.[row] ?? 0) + 1
            return acc
          }, {})
        )

        const max = countEntries.reduce(
          (acc, entry) => (acc.count > entry.count ? acc : entry),
          countEntries[0]
        )
        return max[0]
      }
    }
  ])

  const sourceObjects: SourceObj[] = [
    {
      label: null,
      allowedOperations: ['count'],
      fetch(players: Player[]) {
        return players
      }
    },
    {
      label: 'Organização',
      allowedOperations: ['maxcount'],
      fetch(players: Player[]) {
        return players.map((p) => p.organization)
      }
    },
    {
      label: 'Sexo',
      allowedOperations: ['maxcount'],
      fetch(players: Player[]) {
        return players.map((p) => (p.isMale ? 'Masculino' : 'Feminino'))
      }
    },
    {
      label: 'Nome',
      allowedOperations: ['maxcount'],
      fetch(players: Player[]) {
        return players.map((p) => p.name)
      }
    },
    {
      label: 'Pontos',
      allowedOperations: ['sum', 'min', 'max'],
      fetch(players: Player[]) {
        return players.map((p) => getPoints(p).toString())
      }
    }
  ]

  const filterDict: Record<string, FilterObj<unknown>> = $derived(
    filterObjects.reduce((acc, fobj) => {
      acc[fobj.label] = fobj
      return acc
    }, {})
  )
  const operationDict: Record<string, OperationObj> = $derived(
    operationObjects.reduce((acc, fobj) => {
      acc[fobj.label] = fobj
      return acc
    }, {})
  )
  const sourceDict: Record<string, SourceObj> = $derived(
    sourceObjects.reduce((acc, fobj) => {
      acc[fobj.label] = fobj
      return acc
    }, {})
  )

  type Aggregator = { filter: FilterObj<null>; selection: null }
  type FieldFilter = { filter: FilterObj<unknown>; selection: unknown }

  function buildTable(players: Player[], resultTable: ResultTable) {
    const { columns, filters, name } = resultTable

    for (const filter of filters) {
      if (!(filter.field in filterDict))
        throw Error(`Invalid Filter "${filter.field}" for table "${name}"`)
    }

    const { aggregators, fieldFilters } = filters.reduce(
      (acc, filter) => {
        acc[filter.selection == null ? 'aggregators' : 'fieldFilters'].push({
          filter: filterDict[filter.field],
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
      : players.map((p) => [p])

    const tableColumns = []
    const columnValues: Record<string, string[]> = {}
    for (const { filters, formula, name } of columns) {
      if (!(formula.value in sourceDict))
        throw Error(`Invalid Source "${formula.value}" for column "${name}"`)
      if (!(formula.operation in operationDict))
        throw Error(`Invalid Operation "${formula.operation}" for column "${name}"`)

      const aggregators: FilterObj[] = []
      const fieldFilters: FieldFilter[] = []
      for (const filter of filters) {
        if (!(filter.field in filterDict))
          throw Error(`Invalid Filter "${filter.field}" for column "${name}"`)
        if (filter.selection == null) {
          aggregators.push(filterDict[filter.field])
        } else {
          fieldFilters.push({
            filter: filterDict[filter.field],
            selection: filter.selection
          })
        }
      }
      // console.log(aggregators)

      const getColumnValue = (players, fieldFilters) => {
        for (const { filter, selection } of fieldFilters) {
          players = filter.apply(players, selection)
        }
        const items = sourceDict[formula.value].fetch(players)
        return operationDict[formula.operation].apply(items)
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

      // TODO: Adicionar forma de exportar tabelas

      const newColumn = applyAggregation(players, aggregators)
      tableColumns.push(newColumn)
    }
    // console.log(columnValues)

    // console.log(resultTable)
    // console.log($state.snapshot(rows.map((r) => r.map((rr) => rr.category.map((t) => t.value)))))
    return { rows, columns: tableColumns }
  }
  let data = $state([])
  let columns = $state([])

  let selectedTableName = $state('Pontos SUB10')
  const selectedTable = $derived(resultTablesStore.tables.find((t) => t.name == selectedTableName))

  $effect(() => {
    if (!selectedTable) return

    const players = [...playersStore.players.female, ...playersStore.players.male]
    try {
      const tableData = buildTable(players, selectedTable)
      data = tableData.rows
      columns = tableData.columns
    } catch (e) {
      console.error(e)
    }
  })
</script>

<div class="flex h-full flex-1 flex-col p-8">
  <DataTable {data} {columns}>
    {#snippet headerSnippet(table)}
      <div class="flex w-full items-center">
        <div class="flex flex-wrap items-center gap-1">
          {#each resultTablesStore.tables as resultTable (resultTable.name)}
            <Button
              class={cn(
                buttonVariants({ variant: 'outline' }),
                'text-foreground rounded-md p-2',
                selectedTableName == resultTable.name ? 'border-foreground font-bold' : ''
              )}
              onclick={() => {
                selectedTableName = resultTable.name
              }}
            >
              {resultTable.name}
            </Button>
          {/each}
          <ConfigPopover>
            <div class={cn(buttonVariants({ variant: 'outline' }), 'size-5 rounded-full p-3')}>
              <Plus class="size-4" />
            </div>
          </ConfigPopover>
        </div>

        <div class="flex-1"></div>

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
            const rows: PlayerColumn[] = table.getFilteredRowModel().rows.map((row) =>
              row.getVisibleCells().reduce((acc, cell) => {
                const id = cell.id.replace(/^[0-9]+_/, '')
                return {
                  ...acc,
                  [id]: cell.getValue()
                }
              }, {})
            )
            const tableData = { name: selectedTableName, headers, rows }
            await window.api.exportTable(tableData, `${selectedTableName}.xlsx`)
          }}>Exportar</Button
        >
      </div>
    {/snippet}
  </DataTable>
</div>
