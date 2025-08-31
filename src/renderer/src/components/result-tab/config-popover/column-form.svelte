<script lang="ts">
  import type { SelectItem } from '@components/command-select'
  import CommandSelect from '@components/command-select/CommandSelect.svelte'
  import FormInput from '@components/result-tab/config-popover/form-input.svelte'
  import FormSwitch from '@components/result-tab/config-popover/form-switch.svelte'
  import { buttonVariants } from '@components/ui/button'
  import type { ColumnFormState, Filter } from '@lib/types/result-table'
  import { cn } from '@lib/utils'
  import { Plus } from '@lucide/svelte'
  import { onMount } from 'svelte'

  import FilterItem from '@/components/result-tab/filter-item.svelte'
  import { resultObjects } from '@/components/result-tab/objects.svelte'
  import BadgeButton from '@/components/ui/badge/badge-button.svelte'

  let {
    class: className,
    onChange,
    invalidNames = [],
    column = $bindable({})
  }: {
    column: ColumnFormState
    invalidNames?: string[]
    class?: string
    onChange: (column: Partial<ColumnFormState>) => void
  } = $props()

  let nameInputEl: HTMLInputElement = $state()

  onMount(() => {
    if (column) {
      nameInputEl?.focus()
    }
  })

  const filterItems = $derived(
    (resultObjects.filterObjects ?? []).map((item) => ({
      label: item.label,
      value: item,
      snippet: tag_select_item
    }))
  )
  const selectableFilters: Filter[] = $derived(
    (resultObjects.filterObjects ?? []).map(({ label }) => ({
      field: label,
      selection: null
    }))
  )

  const operationItems = $derived(
    (resultObjects.operationObjects ?? []).map((item) => ({
      label: item.label,
      value: item,
      snippet: tag_select_item
    }))
  )
  const sourceItems = $derived(
    (resultObjects.sourceObjects ?? [])
      .filter((item) => item.allowedOperations.includes(column.formula.operation))
      .map((item) => ({
        label: item.label,
        value: item,
        snippet: tag_select_item
      }))
  )
</script>

<div class={cn('flex flex-1 flex-col gap-3 text-sm', className)}>
  <FormInput
    bind:el={nameInputEl}
    withDifficulty={false}
    textarea={false}
    label="Nome"
    warning={invalidNames.reduce((acc, name) => acc + (name == column.name), 0) >= 2}
    bind:value={
      () => column.name,
      (v) => {
        column.name = v
        onChange(column)
      }
    }
  />

  <FormSwitch
    label="Tipo"
    bind:selected={
      () => (column.formula.rank ? 'Classificação' : 'Dado'),
      (v) => (column.formula.rank = v == 'Classificação')
    }
    options={['Dado', 'Classificação']}
    class="w-fit"
  />

  <div class="flex items-center gap-1">
    <span class="font-bold">Operação</span>

    <CommandSelect
      popoverClass="w-auto"
      items={operationItems}
      onSelect={(item) => {
        column.formula.operation = item.label
        if (
          sourceItems.length &&
          sourceItems.every((source) => source.label != column.formula.operation)
        ) {
          column.formula.value = sourceItems[0].label
        }
      }}
    >
      <BadgeButton variant="outline" class="hover:bg-accent text-base"
        >{column.formula.operation}</BadgeButton
      >
    </CommandSelect>

    <span class="!ml-5 font-bold">Fonte</span>

    <CommandSelect
      popoverClass="w-auto"
      items={sourceItems}
      onSelect={(item) => {
        column.formula.value = item.label
      }}
    >
      <BadgeButton variant="outline" class="hover:bg-accent text-base"
        >{column.formula.value}</BadgeButton
      >
    </CommandSelect>
  </div>

  <div class="flex flex-wrap items-center gap-1">
    <span class="!mr-3 font-bold">Filtros</span>
    {#each column.filters as _filter, i (i)}
      <FilterItem
        bind:filter={column.filters[i]}
        allowDelete={true}
        allowNull={true}
        filters={selectableFilters}
        onDelete={(filter) => {
          column.filters = column.filters.filter((f) => f.field != filter.field)
        }}
      />
    {/each}

    {#if column.filters.length < filterItems.length}
      <CommandSelect
        popoverClass="w-auto"
        items={filterItems.filter(
          (item) =>
            item.label != 'Participantes' && !column.filters?.some((it) => it.field == item.label)
        )}
        onSelect={(item) => {
          column.filters = [
            ...column.filters,
            {
              field: item.label,
              selection: null
            }
          ]
        }}
      >
        <div class={cn(buttonVariants({ variant: 'outline' }), 'size-5 rounded-full p-3')}>
          <Plus class="size-4" />
        </div>
      </CommandSelect>
    {/if}
  </div>
</div>

{#snippet tag_select_item(item: SelectItem)}
  <div class="flex flex-1 justify-center">
    {item.label}
  </div>
{/snippet}
