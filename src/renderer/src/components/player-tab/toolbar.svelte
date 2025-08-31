<script lang="ts" module>
  type TData = unknown
</script>

<script lang="ts" generics="TData">
  import Button from '@components/ui/button/button.svelte'
  import { Input } from '@components/ui/input'
  import { unhashCategory } from '@lib/bracket-lib'
  import type { PlayerColumn } from '@lib/types/bracket-lib'
  import { buildColFn } from '@lib/utils'
  import { X } from '@lucide/svelte'
  import type { Table } from '@tanstack/table-core'

  import { DataTableFacetedFilter, DataTableViewOptions } from './index'

  let { table }: { table: Table<TData> } = $props()

  const colFn = buildColFn<TData>(table)

  const isFiltered = $derived(table.getState().columnFilters.length > 0)

  const organizationCol = $derived(table.getColumn('organization'))
  const organizations = $derived(colFn('organization'))

  const isMaleCol = $derived(table.getColumn('isMale'))
  const isMales = $derived(colFn('isMale', (v) => (v ? 'Masc.' : 'Fem.')))

  const categoryCol = $derived(table.getColumn('category'))
  const categories = $derived(colFn('category', (v) => unhashCategory(v)))

  const presentCol = $derived(table.getColumn('present'))
  const presencies = $derived(colFn('present', (v) => (v ? 'Sim' : 'Não')))
</script>

<div class="flex items-center justify-between overflow-x-auto">
  <div class="flex flex-1 items-center gap-1 space-x-2">
    <!-- value={(table.getColumn('name')?.getFilterValue() as string) ?? ''} -->
    <Input
      placeholder="Filtrar Nomes..."
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
    class="!ml-1 h-8"
    onclick={async () => {
      const headerNames = {
        name: 'Nome',
        isMale: 'Sexo',
        organization: 'Organização',
        category: 'Categoria',
        points: 'Pontos',
        present: 'Presença'
      }
      const headers = table.getHeaderGroups().map(({ headers }) =>
        headers
          .map(({ column, colSpan }) => ({
            id: column.id,
            label: headerNames[column.id.split(',').at(-1)] ?? column.id.split(',').at(-1),
            colSpan
          }))
          .filter(({ label }) => label != 'actions')
      )
      const rows: PlayerColumn[] = table.getSortedRowModel().rows.map((row) =>
        row.getVisibleCells().reduce((acc, cell) => {
          const id = cell.id.replace(/^[0-9]+_/, '')
          if (id == 'actions') return acc
          let value = cell.getValue()
          switch (id) {
            case 'isMale':
              value = value ? 'Masculino' : 'Feminino'
              break
            case 'present':
              value = value ? 'Sim' : 'Não'
              break
            case 'category':
              value = unhashCategory(value)
                .map((t) => t.value)
                .join(' ')
              break
          }
          return {
            ...acc,
            [id]: value
          }
        }, {})
      )
      const tableData = { name: 'Participantes', headers, rows }
      await window.api.exportTable(tableData, 'participantes.xlsx')
    }}>Exportar</Button
  >
</div>
