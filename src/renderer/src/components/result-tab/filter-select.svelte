<script lang="ts">
  import type { SelectItem } from '@components/command-select'
  import CommandSelect from '@components/command-select/CommandSelect.svelte'
  import { buttonVariants } from '@components/ui/button'
  import type { Filter, ResultTable } from '@lib/types/result-table'
  import { cn } from '@lib/utils'
  import { Plus } from '@lucide/svelte'

  import FilterItem from '@/components/result-tab/filter-item.svelte'
  import { resultObjects } from '@/components/result-tab/objects.svelte'

  let {
    filters: tableFilters = $bindable([]),
    class: className
  }: {
    filters: ResultTable['filters']
    class?: string
  } = $props()

  const filterItems = $derived(
    (resultObjects.filterObjects ?? []).map((filter) => ({
      label: filter.label,
      value: filter.label,
      snippet: tag_select_item
    }))
  )
  const selectableFilters: Filter[] = $derived(
    (resultObjects.filterObjects ?? []).map(({ label }) => ({
      field: label,
      selection: null
    }))
  )
</script>

<div class={cn('flex flex-wrap items-center gap-1', className)}>
  <span class="font-bold">Linhas</span>

  {#if tableFilters.length}
    <FilterItem
      bind:filter={tableFilters[0]}
      filters={selectableFilters.filter((f) => tableFilters?.every((it) => it.field != f.field))}
      allowNull={true}
      allowDelete={false}
    />
  {/if}

  <span class="!ml-2 font-bold">Filtros</span>

  {#each (tableFilters ?? []).slice(1) as _, i (i)}
    <FilterItem
      bind:filter={tableFilters[i + 1]}
      filters={selectableFilters.filter(
        (f) => f.field != 'Participantes' && tableFilters?.every((it) => it.field != f.field)
      )}
      allowNull={false}
      allowDelete={true}
      onDelete={(filter) => {
        tableFilters = tableFilters.filter((f) => f.field != filter.field)
      }}
    />
  {/each}

  {#if !tableFilters || tableFilters.length < filterItems.length}
    <CommandSelect
      popoverClass="w-auto"
      items={filterItems.filter(
        (item) =>
          item.label != 'Participantes' && !tableFilters?.some((it) => it.field == item.label)
      )}
      onSelect={(item) => {
        tableFilters = [
          ...tableFilters,
          {
            field: item.value,
            selection: resultObjects.filters[item.label].values.find(Boolean)
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

{#snippet tag_select_item(item: SelectItem)}
  <div class="flex flex-1 justify-center">
    {#if item.value == null}
      <span class="text-blue-700 dark:text-blue-700">Tudo</span>
    {:else}
      {item.label}
    {/if}
  </div>
{/snippet}
