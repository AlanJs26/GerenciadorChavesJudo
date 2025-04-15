<script lang="ts" module>
  type TData = unknown
</script>

<script lang="ts" generics="TData">
  import X from '@lucide/svelte/icons/x'
  import type { Table } from '@tanstack/table-core'
  import { priorities, statuses } from '../(data)/data'
  import { DataTableFacetedFilter, DataTableViewOptions } from './index'
  import Button from '@components/ui/button/button.svelte'
  import { Input } from '@components/ui/input'
  import type { Player } from '@lib/types/bracket-lib'

  let { table }: { table: Table<TData> } = $props()

  const isFiltered = $derived(table.getState().columnFilters.length > 0)
  const statusCol = $derived(table.getColumn('presence'))
  const priorityCol = $derived(table.getColumn('isMale'))
</script>

<div class="flex items-center justify-between">
  <div class="flex flex-1 items-center space-x-2">
    <Input
      placeholder="Filter tasks..."
      value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
      oninput={(e) => {
        table.getColumn('name')?.setFilterValue(e.currentTarget.value)
      }}
      onchange={(e) => {
        table.getColumn('name')?.setFilterValue(e.currentTarget.value)
      }}
      class="h-8 w-[150px] lg:w-[250px]"
    />

    {#if statusCol}
      <DataTableFacetedFilter column={statusCol} title="Status" options={statuses} />
    {/if}
    {#if priorityCol}
      <DataTableFacetedFilter column={priorityCol} title="Priority" options={priorities} />
    {/if}

    {#if isFiltered}
      <Button variant="ghost" onclick={() => table.resetColumnFilters()} class="h-8 px-2 lg:px-3">
        Reset
        <X />
      </Button>
    {/if}
  </div>
  <DataTableViewOptions {table} />
  <Button
    variant="default"
    class="ml-2 h-8"
    onclick={async () => {
      const tablePlayers: Omit<Player, 'contestantId'>[] = table
        .getFilteredRowModel()
        .rows.map<Omit<Player, 'contestantId'>>((row) => row.original as Player)
        .map((original) => ({
          name: original.name,
          isMale: original.isMale,
          category: original.category,
          organization: original.organization,
          present: original.present
        }))
      console.log(tablePlayers)
      await window.api.exportPlayers(tablePlayers)
    }}>Exportar</Button
  >
</div>
