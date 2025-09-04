<script lang="ts">
  import ConfigPopover from '@components/result-tab/config-popover/ConfigPopover.svelte'
  import { sidebarState } from '@components/sidebar/sidebar-state.svelte.ts'
  import { Button, buttonVariants } from '@components/ui/button'
  import { Checkbox } from '@components/ui/checkbox'
  import * as ContextMenu from '@components/ui/context-menu'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import { Input } from '@components/ui/input'
  import { Label } from '@components/ui/label'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Separator } from '@components/ui/separator'
  import type { TableExport } from '@lib/types/data-table'
  import type { ResultTable } from '@lib/types/result-table'
  import { Bolt, MoonIcon, Plus, SunIcon } from '@lucide/svelte'
  import createFuzzySearch from '@nozbe/microfuzz'
  import { toggleMode } from 'mode-watcher'
  import { onMount, type Snippet } from 'svelte'

  import { exportTableData } from '@/components/result-tab/result-lib.svelte'
  import TableCard from '@/components/sidebar/table-card.svelte'
  import { resultTableStore } from '@/states.svelte.ts'

  let contextOpen = $state(false)
  let filterText = $state('')

  const fuzzyFn = $derived(
    createFuzzySearch(resultTableStore.tables as ResultTable[], {
      getText: (table) => [table.name]
    })
  )

  let filteredTables = $derived.by(() => {
    const filtered = fuzzyFn(filterText)
      .toSorted((a, b) => a.score - b.score)
      .map((x) => x.item)
    if (filtered.length == 0 && !filterText) return resultTableStore.tables as ResultTable[]
    return filtered
  })

  const selectedNum = $derived(sidebarState.selectedTables.length)

  onMount(() => {
    const key = sidebarState.checkedTables.keys().next().value as string | undefined
    if (!key) return
    resultTableStore.selectedName = key
  })
</script>

<div class="flex h-full w-full flex-col items-center p-1">
  <div class="flex w-full flex-row">
    {@render configDropdown()}

    <ConfigPopover
      class="flex-1"
      onSave={(table) => {
        console.log(table)
        resultTableStore.tables = [...resultTableStore.tables, table]
        resultTableStore.selectedName = table.name
      }}
    >
      <Button variant="outline" class="w-full">
        <Plus />
        Nova Visualização
      </Button>
    </ConfigPopover>
  </div>

  <Input id="busca" class="!my-1 w-full" placeholder="Filtrar..." bind:value={filterText} />

  <Separator />

  {#snippet scrollViewSnippet()}
    <ScrollArea class="flex w-full flex-1 flex-col" type="auto">
      {#each filteredTables as table (table.name)}
        <TableCard
          {table}
          bind:checked={
            () => sidebarState.checkedTables.get(table.name),
            (v) => sidebarState.checkedTables.set(table.name, v)
          }
        />
      {/each}
    </ScrollArea>
  {/snippet}
  {@render contextmenu(scrollViewSnippet)}

  <Separator />

  {#if selectedNum > 0}
    <span class="!my-1">{selectedNum} selecionados</span>
  {/if}

  <span class="!mt-1 !mb-2 font-bold">Ações</span>

  <div class="grid w-full grid-cols-2 gap-1 px-1">
    <Button
      variant="outline"
      disabled={selectedNum == 0}
      onclick={() => {
        const isSelected = (table) => sidebarState.selectedTables.some((t) => t.name == table.name)
        resultTableStore.tables = resultTableStore.tables.filter((table) => !isSelected(table))
        sidebarState.checkedTables.clear()
      }}>Apagar</Button
    >
    <Button
      variant="outline"
      disabled={selectedNum != 1}
      onclick={() => {
        const duplicated = { ...sidebarState.selectedTables[0] }
        duplicated.name = duplicated.name + ' (Cópia)'
        resultTableStore.tables = [...resultTableStore.tables, duplicated]
        sidebarState.checkedTables.clear()
      }}>Duplicar</Button
    >
    <Button
      variant="outline"
      onclick={() => {
        resultTableStore.tables = [...resultTableStore.tables]
      }}>Recarregar</Button
    >

    <Button
      variant="outline"
      disabled={selectedNum == 0}
      onclick={async () => {
        const tableData: TableExport[] =
          await resultTableStore.exportHandler.extractExportableTableData(
            sidebarState.selectedTables
          )

        await exportTableData(tableData, tableData.map((td) => td.name).join('-'))

        sidebarState.checkedTables.clear()
      }}>Exportar</Button
    >
  </div>
</div>

{#snippet configDropdown()}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
      <Bolt class="h-4 w-4" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-56">
      <DropdownMenu.Group>
        <DropdownMenu.DropdownMenuGroupHeading class="!font-bold"
          >Tema</DropdownMenu.DropdownMenuGroupHeading
        >

        <DropdownMenu.Item
          closeOnSelect={false}
          onclick={() => {
            document.startViewTransition(() => {
              toggleMode()
            })
          }}
        >
          <SunIcon
            class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"
          />
          <MoonIcon
            class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
          />
          <span>Mudar Tema</span>
        </DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

{#snippet contextmenu(trigger: Snippet)}
  <ContextMenu.Root bind:open={contextOpen}>
    <ContextMenu.Trigger class="flex min-h-0 w-full flex-1 flex-col">
      {@render trigger()}
    </ContextMenu.Trigger>

    <ContextMenu.Content class="z-10 flex flex-1 flex-col p-3" updatePositionStrategy="always">
      <ContextMenu.Group class="flex w-full cursor-pointer flex-row items-center">
        <Checkbox
          id="checkbox"
          aria-labelledby="checkbox-label"
          class="cursor-pointer"
          bind:checked={
            () => resultTableStore.tables.length == sidebarState.selectedTables.length,
            () => {
              const noneChecked = sidebarState.selectedTables.length == 0
              for (const table of resultTableStore.tables) {
                sidebarState.checkedTables.set(table.name, noneChecked)
              }
              contextOpen = false
            }
          }
        />
        <Label
          id="checkbox-label"
          for="checkbox"
          class="!ml-2 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Alternar Tudo
        </Label>
      </ContextMenu.Group>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/snippet}
