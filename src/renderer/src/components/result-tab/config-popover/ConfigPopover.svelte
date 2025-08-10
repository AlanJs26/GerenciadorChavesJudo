<script lang="ts">
  import ColumnForm from '@components/result-tab/config-popover/column-form.svelte'
  import FormInput from '@components/result-tab/config-popover/form-input.svelte'
  import SubForm from '@components/result-tab/config-popover/sub-form.svelte'
  import { addResultTable } from '@components/result-tab/result-tables.svelte'
  import { Button } from '@components/ui/button'
  import * as Dialog from '@components/ui/dialog'
  import { ScrollArea } from '@components/ui/scroll-area'
  import type { ResultTable } from '@renderer/lib/types/result-table'
  import { type Snippet } from 'svelte'

  let {
    class: className,
    children
  }: {
    class?: string
    children: Snippet
  } = $props()

  let open = $state(false)

  // Estados locais dos campos principais
  let nameSimple = $state('')
  let filterAdvanced = $state('')
  let difficultyFilter = $state<'simple' | 'advanced'>('simple')
  // Colunas dinâmicas
  interface ColumnFormState {
    id: string
    name: string
    type: 'data' | 'order'
    formulaValue: string
    formulaDifficulty: 'simple' | 'advanced'
    groups: string[]
    totalEnabled: boolean
    totalName: string
    totalType: 'data' | 'order'
    totalFormulaValue: string
    totalFormulaDifficulty: 'simple' | 'advanced'
  }

  function newColumn(idx: number): ColumnFormState {
    return {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      name: '',
      type: 'data',
      formulaValue: '',
      formulaDifficulty: 'simple',
      groups: ['Peso'],
      totalEnabled: true,
      totalName: 'Total',
      totalType: 'data',
      totalFormulaValue: '',
      totalFormulaDifficulty: 'simple'
    }
  }

  let columns = $state<ColumnFormState[]>([newColumn(0)])
  let columnItems = $state<string[]>(['Coluna 1'])
  let selectedColumn = $state(columnItems[0])

  function refreshColumnItems() {
    columnItems = columns.map((c, i) => c.name || `Coluna ${i + 1}`)
    if (!columnItems.includes(selectedColumn)) selectedColumn = columnItems[0] ?? ''
  }

  function handleAddColumn() {
    columns = [...columns, newColumn(columns.length)]
    refreshColumnItems()
    selectedColumn = columnItems[columnItems.length - 1]
  }
  function handleRemoveColumn(e: CustomEvent<{ index: number }>) {
    const { index } = e.detail
    columns = columns.filter((_, i) => i !== index)
    refreshColumnItems()
  }
  // Linha extra e ranking
  let extraRankingCode = $state('')
  let extraRowName = $state('TOTAL')
  let extraRowField = $state('pontos')

  function buildResultTable(): ResultTable {
    // Determinar filtro
    const filter = filterAdvanced
      ? { difficulty: 'advanced', code: filterAdvanced }
      : {
          difficulty: 'simple',
          items: [
            { field: 'Categoria', selection: null },
            { field: 'Sexo', selection: null }
          ]
        }

    const rankingFormula = extraRankingCode
      ? { difficulty: 'advanced', code: extraRankingCode }
      : { difficulty: 'advanced', code: '/* ranking */' }
    const resultColumns = columns.map<import('@renderer/lib/types/result-table').ResultColumn>(
      (c) => {
        const formula =
          c.formulaDifficulty === 'advanced'
            ? { difficulty: 'advanced', code: c.formulaValue || '/* fórmula */' }
            : {
                difficulty: 'simple',
                field: c.formulaValue || 'campo',
                operation: { difficulty: 'simple', type: 'sum' }
              }
        const totalFormula =
          c.totalFormulaDifficulty === 'advanced'
            ? { difficulty: 'advanced', code: c.totalFormulaValue || '/* total */' }
            : {
                difficulty: 'simple',
                field: c.totalFormulaValue || 'pontos',
                operation: { difficulty: 'simple', type: 'sum' }
              }
        const aggregations = c.totalEnabled
          ? [
              {
                name: c.totalName || 'Total',
                groups: c.groups,
                column: {
                  name: c.totalName || 'Total',
                  type: c.totalType,
                  formula: totalFormula
                }
              }
            ]
          : []
        return {
          name: c.name || 'Coluna',
          type: c.type,
          formula,
          aggregations
        }
      }
    )

    return {
      name: nameSimple || 'Nova Tabela',
      filter,
      columns: resultColumns,
      extraColumns: [
        {
          name: 'Ranking',
          type: 'order',
          formula: rankingFormula
        }
      ],
      extraRows: {
        name: extraRowName,
        formula: {
          difficulty: 'simple',
          field: extraRowField,
          operation: { difficulty: 'simple', type: 'sum' }
        }
      }
    }
  }

  function save() {
    const table = buildResultTable()
    addResultTable(table)
    open = false
    // reset básico
    nameSimple = ''
    filterAdvanced = ''
    columns = [newColumn(0)]
    refreshColumnItems()
    selectedColumn = columnItems[0]
    extraRankingCode = ''
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
        <FormInput withDifficulty={false} textarea={false} label="Nome" bind:value={nameSimple} />

        <FormInput
          withDifficulty={true}
          textarea={true}
          label="Filtro"
          bind:value={filterAdvanced}
          bind:difficulty={difficultyFilter}
        />
      </div>

      <h1 class="!ml-5 text-3xl">Colunas</h1>
      <SubForm
        bind:items={columnItems}
        bind:selected={selectedColumn}
        on:add={handleAddColumn}
        on:remove={handleRemoveColumn}
      >
        {#each columns as c, i (c.id)}
          {#if columnItems[i] === selectedColumn}
            <ColumnForm
              bind:name={c.name}
              bind:type={c.type}
              bind:formulaValue={c.formulaValue}
              bind:formulaDifficulty={c.formulaDifficulty}
              bind:groups={c.groups}
              bind:totalEnabled={c.totalEnabled}
              bind:totalName={c.totalName}
              bind:totalType={c.totalType}
              bind:totalFormulaValue={c.totalFormulaValue}
              bind:totalFormulaDifficulty={c.totalFormulaDifficulty}
            />
            {@const _update = () => refreshColumnItems()}
          {/if}
        {/each}
      </SubForm>
    </ScrollArea>
  </Dialog.Content>
</Dialog.Root>
