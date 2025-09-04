<script lang="ts">
  import DataTable from '@components/data-table/DataTable.svelte'
  import ConfigPopover from '@components/result-tab/config-popover/ConfigPopover.svelte'
  import { Button, buttonVariants } from '@components/ui/button'
  import * as Popover from '@components/ui/popover'
  import type { Player } from '@lib/types/bracket-lib'
  import type { TableExport } from '@lib/types/data-table'
  import type { Filter, ResultTable } from '@lib/types/result-table'
  import { cn } from '@lib/utils'
  import { ChevronDown } from '@lucide/svelte'
  import type { Table } from '@tanstack/table-core'
  import { untrack } from 'svelte'

  import ExportHandler from '@/components/result-tab/export-handler.svelte'
  import FilterItem from '@/components/result-tab/filter-item.svelte'
  import FilterSelect from '@/components/result-tab/filter-select.svelte'
  import { resultObjects } from '@/components/result-tab/objects.svelte'
  import { buildTableData, exportTableData } from '@/components/result-tab/result-lib.svelte'
  import { sidebarState } from '@/components/sidebar/sidebar-state.svelte'
  import { playersStore, resultTableStore } from '@/states.svelte'

  let data = $state([])
  let columns = $state([])

  let popoverFilter: Filter | undefined = $state()
  // let exportHandler: ExportHandler = $state()

  $effect(() => {
    if (!resultTableStore.selectedTable) return

    const players = [...playersStore.players.female, ...playersStore.players.male]
    try {
      const tableData = buildTableData(players, resultTableStore.selectedTable)
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
  <ExportHandler bind:this={resultTableStore.exportHandler}>
    <DataTable bind:table={resultTableStore.dataTable} bind:data bind:columns>
      {#snippet headerSnippet(table)}
        <div class="flex w-full items-center">
          {#if resultTableStore.selectedTable}
            <div class="flex flex-wrap items-center gap-1">
              <FilterSelect
                bind:filters={resultTableStore.selectedTable.filters}
                onRowFilterChange={(tableFilters) => {
                  if (resultTableStore.selectedTable.useSyncColumn) {
                    const tableColumns = resultTableStore.selectedTable.columns

                    const syncColumn = {
                      name: tableFilters[0].field + ' (S)',
                      formula: {
                        rank: false,
                        operation: 'Mais Comum',
                        value: tableFilters[0].field
                      },
                      filters: []
                    }
                    const hasSyncColumn =
                      tableColumns.length &&
                      tableColumns[0].name.endsWith(' (S)') &&
                      tableColumns[0].filters.length == 0 &&
                      !tableColumns[0].formula.rank &&
                      tableColumns[0].formula.operation == 'Mais Comum'

                    if (hasSyncColumn) {
                      resultTableStore.selectedTable.columns = [
                        syncColumn,
                        ...tableColumns.slice(1)
                      ]
                    }
                  }
                }}
              />
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
            class="rounded-r-none"
            onclick={async () => {
              const tables = [resultTableStore.selectedTable]
              const tableData =
                await resultTableStore.exportHandler.extractExportableTableData(tables)
              await exportTableData(tableData, resultTableStore.selectedName)
            }}>Exportar</Button
          >
          {@render popover()}
          <!-- <Button class="border-border w-fit rounded-l-none border-l-1 px-0.5"> -->
          <!--   <ChevronDown class="size-3" /> -->
          <!-- </Button> -->
        </div>
      {/snippet}
    </DataTable>
  </ExportHandler>
</div>

{#snippet popover()}
  <Popover.Root
    onOpenChange={(open) => {
      if (!open) return

      popoverFilter = {
        field: resultTableStore.selectedTable.filters[1].field,
        selection: null
      }
    }}
  >
    <Popover.Trigger
      disabled={(resultTableStore.selectedTable?.filters.length ?? 0) <= 1}
      class={cn(
        buttonVariants({ variant: 'default' }),
        'border-border w-fit rounded-l-none border-l-1 px-0.5'
      )}
    >
      <ChevronDown class="size-3" />
    </Popover.Trigger>
    <Popover.Content class="flex w-fit flex-col gap-2">
      <h1 class="text-xl font-bold">Variando Filtro</h1>

      <FilterItem
        bind:filter={popoverFilter}
        filters={resultTableStore.selectedTable.filters.slice(1)}
        allowNull={true}
        allowDelete={false}
        selectable={false}
      />

      <Button
        onclick={async () => {
          const values = resultObjects.filters[popoverFilter.field].values.filter(Boolean)
          const tables: ResultTable[] = values.map((selection) => ({
            ...resultTableStore.selectedTable,
            name: selection,
            filters: resultTableStore.selectedTable.filters.map((filter) =>
              filter.field == popoverFilter.field
                ? {
                    field: popoverFilter.field,
                    selection
                  }
                : filter
            )
          }))

          const tableData = await resultTableStore.exportHandler.extractExportableTableData(tables)

          await exportTableData(tableData, resultTableStore.selectedTable.name)
        }}>Exportar</Button
      >
    </Popover.Content>
  </Popover.Root>
{/snippet}
