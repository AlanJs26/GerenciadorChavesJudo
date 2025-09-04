<script lang="ts">
  import DataTable from '@components/data-table/DataTable.svelte'
  import ConfigPopover from '@components/result-tab/config-popover/ConfigPopover.svelte'
  import { Button } from '@components/ui/button'
  import type { Player } from '@lib/types/bracket-lib'
  import type { ResultTable } from '@lib/types/result-table'
  import type { Table } from '@tanstack/table-core'
  import { untrack } from 'svelte'

  import ExportHandler from '@/components/result-tab/export-handler.svelte'
  import FilterSelect from '@/components/result-tab/filter-select.svelte'
  import { buildTableData, exportTableData } from '@/components/result-tab/result-lib.svelte'
  import { sidebarState } from '@/components/sidebar/sidebar-state.svelte'
  import { playersStore, resultTableStore } from '@/states.svelte'

  let data = $state([])
  let columns = $state([])
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
              const tables = [resultTableStore.selectedTable]
              const tableData =
                await resultTableStore.exportHandler.extractExportableTableData(tables)
              await exportTableData(tableData, resultTableStore.selectedName)
            }}>Exportar</Button
          >
        </div>
      {/snippet}
    </DataTable>
  </ExportHandler>
</div>
