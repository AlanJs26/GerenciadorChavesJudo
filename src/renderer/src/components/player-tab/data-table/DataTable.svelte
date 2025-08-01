<script lang="ts" module>
  type TData = unknown
  type TValue = unknown
</script>

<script lang="ts" generics="TData, TValue">
  import { playersStore } from '@/states.svelte.ts'
  import { createSvelteTable } from '@components/ui/data-table/data-table.svelte'
  import FlexRender from '@components/ui/data-table/flex-render.svelte'
  import * as Table from '@components/ui/table'
  import type { Player } from '@lib/types/bracket-lib'
  import { randomContestantId } from '@lib/utils'
  import {
    type ColumnDef,
    type ColumnFiltersState,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel
  } from '@tanstack/table-core'
  import DataTablePagination from './pagination.svelte'
  import DataTableToolbar from './toolbar.svelte'

  let { columns, data }: { columns: ColumnDef<TData, TValue>[]; data: TData[] } = $props()

  let rowSelection = $state<RowSelectionState>({})
  let columnVisibility = $state<VisibilityState>({})
  let columnFilters = $state<ColumnFiltersState>([])
  let sorting = $state<SortingState>([])
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 100 })

  function buildChangeCallback<T>(getFn: () => T, setFn: (T) => void) {
    return (updater) => {
      if (typeof updater === 'function') {
        setFn(updater(getFn()))
      } else {
        setFn(updater)
      }
    }
  }

  const table = createSvelteTable({
    get data() {
      return data
    },
    state: {
      get sorting() {
        return sorting
      },
      get columnVisibility() {
        return columnVisibility
      },
      get rowSelection() {
        return rowSelection
      },
      get columnFilters() {
        return columnFilters
      },
      get pagination() {
        return pagination
      }
    },
    columns,
    enableRowSelection: false,
    meta: {
      removePlayer: (player: Player) => {
        const gender = player.isMale ? 'male' : 'female'
        const players = playersStore.get(gender, player.category)

        playersStore.set(
          gender,
          player.category,
          players.filter((p) => p.contestantId != player.contestantId)
        )
      },
      addPlayer: (player: Omit<Player, 'contestantId'>) => {
        const contestantId = randomContestantId()
        playersStore.setPlayer({ ...player, contestantId })
      }
    },
    onRowSelectionChange: buildChangeCallback(
      () => rowSelection,
      (v) => (rowSelection = v)
    ),
    onSortingChange: buildChangeCallback(
      () => sorting,
      (v) => (sorting = v)
    ),
    onColumnFiltersChange: buildChangeCallback(
      () => columnFilters,
      (v) => (columnFilters = v)
    ),
    onColumnVisibilityChange: buildChangeCallback(
      () => columnVisibility,
      (v) => (columnVisibility = v)
    ),
    onPaginationChange: buildChangeCallback(
      () => pagination,
      (v) => (pagination = v)
    ),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  })
</script>

<div class="h-full space-y-4">
  <DataTableToolbar {table} />
  <div class="!mt-1 h-full rounded-md border">
    <Table.Root class="h-full">
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head colspan={header.colSpan}>
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body class="h-full">
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row data-state={row.getIsSelected() && 'selected'}>
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
                <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
              </Table.Cell>
            {/each}
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
  <DataTablePagination {table} />
</div>
