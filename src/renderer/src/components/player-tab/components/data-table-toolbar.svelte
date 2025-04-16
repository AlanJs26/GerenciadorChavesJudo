<script lang="ts" module>
  type TData = unknown
</script>

<script lang="ts" generics="TData">
  import { X } from '@lucide/svelte'
  import type { Table } from '@tanstack/table-core'
  import { priorities, statuses } from '../(data)/data'
  import { DataTableFacetedFilter, DataTableViewOptions } from './index'
  import Button from '@components/ui/button/button.svelte'
  import { Input } from '@components/ui/input'
  import type { Player, PlayerColumn } from '@lib/types/bracket-lib'

  let { table }: { table: Table<TData> } = $props()

  const isFiltered = $derived(table.getState().columnFilters.length > 0)

  function colFn(key: string, mapFn?: (value: unknown) => string) {
    return Array.from(
      new Set(table.getPreFilteredRowModel().flatRows.map((row) => row.original[key]))
    ).map((value) => ({
      value,
      label: mapFn ? mapFn(value) : value,
      icon: undefined
    }))
  }

  const organizationCol = $derived(table.getColumn('organization'))
  const organizations = $derived(colFn('organization'))

  const isMaleCol = $derived(table.getColumn('isMale'))
  const isMales = $derived(colFn('isMale', (v) => (v ? 'Masc.' : 'Fem.')))

  const categoryCol = $derived(table.getColumn('category'))
  const categories = $derived(colFn('category'))

  const presentCol = $derived(table.getColumn('present'))
  const presencies = $derived(colFn('present', (v) => (v ? 'Sim' : 'Não')))
</script>

<div class="flex items-center justify-between">
  <div class="flex flex-1 items-center space-x-2">
    <Input
      placeholder="Filtrar Nomes..."
      value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
      oninput={(e) => {
        table.getColumn('name')?.setFilterValue(e.currentTarget.value)
      }}
      onchange={(e) => {
        table.getColumn('name')?.setFilterValue(e.currentTarget.value)
      }}
      class="h-8 w-[150px] lg:w-[250px]"
    />

    {#if organizationCol}
      <DataTableFacetedFilter column={organizationCol} title="Escola" options={organizations} />
    {/if}
    {#if isMaleCol}
      <DataTableFacetedFilter column={isMaleCol} title="Sexo" options={isMales} />
    {/if}
    {#if categoryCol}
      <DataTableFacetedFilter column={categoryCol} title="Categoria" options={categories} />
    {/if}
    {#if presentCol}
      <DataTableFacetedFilter column={presentCol} title="Presença" options={presencies} />
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
      const tablePlayers: PlayerColumn[] = table
        .getFilteredRowModel()
        .rows.map<PlayerColumn>((row) => row.original as PlayerColumn)
        .map((original) => ({
          name: original.name,
          isMale: original.isMale,
          category: original.category,
          organization: original.organization,
          present: original.present
        }))
      await window.api.exportPlayers(tablePlayers)
    }}>Exportar</Button
  >
</div>
