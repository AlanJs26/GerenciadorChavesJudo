<script lang="ts">
  import ColumnForm from '@components/result-tab/config-popover/column-form.svelte'
  import FormInput from '@components/result-tab/config-popover/form-input.svelte'
  import SubForm from '@components/result-tab/config-popover/sub-form.svelte'
  import { Button } from '@components/ui/button'
  import * as Dialog from '@components/ui/dialog'
  import { ScrollArea } from '@components/ui/scroll-area'
  import type { Column } from '@lib/types/result-table'
  import type { ResultTable } from '@renderer/lib/types/result-table'
  import { type Snippet } from 'svelte'

  interface ColumnFormState extends Column {
    id: string
  }

  let {
    class: className,
    children
  }: {
    class?: string
    children: Snippet
  } = $props()

  let open = $state(false)

  let nameInput = $state('')
  let filterInput = $state('')

  let columns: ColumnFormState[] = $state([])
  let columnItems: string[] = $derived(columns.map((c) => c.name))
  let selectedColumnName = $state('')

  function newColumn(name = ''): ColumnFormState {
    return {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      name,
      formula: {
        rank: false,
        operation: 'sum',
        value: null
      },
      filters: []
    }
  }

  function buildResultTable(): ResultTable {
    const filters = [{ field: 'Organização', selection: null }]

    return {
      name: nameInput || 'Nova Tabela',
      filters,
      columns
    }
  }

  // TODO: Fazer o ColumnForm retornar um objeto Column
  // TODO: Criar um componente para selecionar Filtros
  // TODO: Criar um objeto ResultTable completo ao clicar salvar
  // TODO: Utilizar esses dados para montar uma tabela
  function save() {
    const table = buildResultTable()
    console.log($state.snapshot(table))
    open = false
    // reset básico
    nameInput = ''
    filterInput = ''
    columns = []
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

        <FormInput withDifficulty={false} textarea={true} label="Filtro" bind:value={filterInput} />
      </div>

      <h1 class="!ml-5 text-3xl">Colunas</h1>
      <SubForm
        bind:items={columnItems}
        bind:selected={selectedColumnName}
        onAdd={(item) => {
          columns = [...columns, newColumn(item)]
        }}
        onRemove={(item) => {
          columns = columns.filter((c) => c.name != item)
        }}
      >
        {#each columns as c (c.id)}
          {#if c.name === selectedColumnName}
            <ColumnForm bind:name={c.name} />
          {/if}
        {/each}
      </SubForm>
    </ScrollArea>
  </Dialog.Content>
</Dialog.Root>
