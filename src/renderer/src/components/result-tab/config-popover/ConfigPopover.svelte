<script lang="ts">
  import ColumnForm from '@components/result-tab/config-popover/column-form.svelte'
  import FormInput from '@components/result-tab/config-popover/form-input.svelte'
  import SubForm from '@components/result-tab/config-popover/sub-form.svelte'
  import { Button } from '@components/ui/button'
  import * as Dialog from '@components/ui/dialog'
  import { ScrollArea } from '@components/ui/scroll-area'
  import type { ColumnFormState, ResultTable } from '@lib/types/result-table'
  import { filterObject } from '@lib/utils'
  import { type Snippet } from 'svelte'
  import { toast } from 'svelte-sonner'

  import type { SelectItem } from '@/components/command-select'
  import FormItem from '@/components/result-tab/config-popover/form-item.svelte'
  import FilterSelect from '@/components/result-tab/filter-select.svelte'
  import Checkbox from '@/components/ui/checkbox/checkbox.svelte'
  import { resultTableStore } from '@/states.svelte'

  let {
    class: className,
    table: inputTable = {},
    open: initialOpen,
    onSave,
    children
  }: {
    class?: string
    open: boolean
    table: ResultTable
    onSave?: (table: ResultTable) => void
    children: Snippet
  } = $props()

  $effect(() => {
    const _ = open
    nameInput = table?.name ?? ''
    tableFilters = table?.filters ?? [{ field: 'Participantes', selection: null }]
    useSyncColumn = table?.useSyncColumn ?? true
    columns =
      table?.columns?.map((c) => ({
        ...c,
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2)
      })) ?? []
  })

  let table = $derived(JSON.parse(JSON.stringify(inputTable)))

  let open = $state(initialOpen ?? false)
  let useSyncColumn = $state(true)

  let nameInput = $state('')
  let tableFilters: ResultTable['filters'] = $state([{ field: 'Participantes', selection: null }])

  let columns: ColumnFormState[] = $state([])
  let columnItems: SelectItem[] = $derived(
    columns.map((c) => ({
      label: c.name,
      value: c.id
    }))
  )
  let selectedColumnId = $state('')

  function newColumn(name = ''): ColumnFormState {
    return {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      name,
      formula: {
        rank: false,
        operation: 'Contar',
        value: 'Participantes'
      },
      filters: []
    }
  }

  function buildResultTable(): ResultTable {
    const tableColumns = columns.map((c) => filterObject(c, (key, _) => key != 'id'))

    if (useSyncColumn) {
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

      return {
        name: nameInput || 'Nova Tabela',
        filters: tableFilters,
        columns: hasSyncColumn ? tableColumns : [syncColumn, ...tableColumns],
        useSyncColumn
      }
    } else {
      return {
        name: nameInput || 'Nova Tabela',
        filters: tableFilters,
        columns: tableColumns,
        useSyncColumn
      }
    }
  }

  function save() {
    const newTable = buildResultTable()

    if (
      newTable.name != table.name &&
      resultTableStore.tables.some((t) => t.name == newTable.name)
    ) {
      toast.warning(`Já existe outra tabela com o nome "${newTable.name}"`)
      return
    }
    if (!newTable.name) {
      toast.warning('Nome inválido')
      return
    }

    open = false
    // reset
    nameInput = ''
    useSyncColumn = true
    tableFilters = []
    columns = []
    selectedColumnId = ''
    onSave?.(newTable)
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class={className}>
    {@render children?.()}
  </Dialog.Trigger>
  <Dialog.Content class="flex min-w-[90vw] flex-col p-0">
    <Dialog.Header class="bg-secondary/50 px-5 py-3">
      <div class="flex gap-3 pr-7">
        <h1 class="text-3xl">Nova Visualização</h1>
        <div class="flex-1"></div>
        <Button variant="default" onclick={save}>Salvar</Button>
      </div>
    </Dialog.Header>

    <ScrollArea type="auto" contentclass="flex max-h-[80vh] min-h-[79vh] flex-col gap-3">
      <div class="flex flex-col gap-2 px-5 pt-0 pb-3">
        <FormInput withDifficulty={false} textarea={false} label="Nome" bind:value={nameInput} />

        <FilterSelect bind:filters={tableFilters} class="text-sm" />

        <FormItem labelFor="syncColumn" label="Coluna Sincronizada" class="h-7">
          <div class="flex h-full items-center">
            <Checkbox id="syncColumn" bind:checked={useSyncColumn} />
          </div>
        </FormItem>
      </div>

      <h1 class="!ml-5 text-3xl">Colunas</h1>
      <SubForm
        bind:items={columnItems}
        bind:selected={selectedColumnId}
        onAdd={(name) => {
          const column = newColumn(name)
          columns = [...columns, column]
          selectedColumnId = column.id
        }}
        onRemove={(item) => {
          columns = columns.filter((c) => c.id != item.value)
        }}
      >
        <ColumnForm
          bind:column={
            () => columns.find((c) => c.id == selectedColumnId),
            (v) => (columns[columns.findIndex((c) => c.id == selectedColumnId)] = v)
          }
          invalidNames={columns.map((c) => c.name)}
          onChange={(column) => {
            selectedColumnId = column.id
          }}
        />
      </SubForm>
    </ScrollArea>
  </Dialog.Content>
</Dialog.Root>
