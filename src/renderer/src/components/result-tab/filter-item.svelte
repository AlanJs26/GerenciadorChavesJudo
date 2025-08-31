<script lang="ts">
  import type { SelectItem } from '@components/command-select'
  import CommandSelect from '@components/command-select/CommandSelect.svelte'
  import type { Filter, ResultTable } from '@lib/types/result-table'
  import { cn } from '@lib/utils'
  import { X } from '@lucide/svelte'

  import { resultObjects } from '@/components/result-tab/objects.svelte'

  let {
    filter = $bindable(),
    filters: tableFilters = [],
    allowNull = true,
    allowDelete = true,
    onChange,
    onDelete,
    class: className
  }: {
    filter: Filter
    filters: ResultTable['filters']
    allowNull: boolean
    allowDelete: boolean
    onChange?: (filter: Filter) => void
    onDelete?: (filter: Filter) => void
    class?: string
  } = $props()

  const valueItemsByField: Record<string, SelectItem[]> = $derived(
    (resultObjects.filterObjects ?? []).reduce((acc, filter) => {
      acc[filter.label] = filter.values.map((value) => ({
        label: value,
        value: value,
        snippet: tag_select_item
      }))
      return acc
    }, {})
  )

  const filterItems = $derived(
    (tableFilters ?? []).map(({ field }) => ({
      label: field,
      value: field,
      snippet: tag_select_item
    }))
  )
</script>

<CommandSelect
  popoverClass="w-auto"
  items={filterItems}
  onSelect={(item) => {
    filter = {
      field: item.value,
      selection: allowNull ? null : resultObjects.filters[item.label].values.find(Boolean)
    }
    onChange?.(filter)
  }}
  class={className}
>
  <div
    class="border-border hover:bg-accent group has-hover:bg-background relative flex cursor-pointer items-center gap-1 rounded-full border-2 py-1 pr-1 pl-2 text-base font-bold"
  >
    {#if allowDelete}
      <button
        class={cn(
          'border-border bg-background absolute -top-1 -right-1 rounded-full border-1 p-0.5 opacity-0 transition-opacity',
          'hover:text-foreground group-hover:opacity-100 hover:bg-red-500'
        )}
        onclick={(e) => {
          e.stopPropagation()
          onDelete?.(filter)
        }}
      >
        <X class="size-3" />
      </button>
    {/if}
    {filter.field}
    <CommandSelect
      items={allowNull
        ? valueItemsByField[filter.field]
        : (valueItemsByField[filter.field]?.filter((item) => item.label !== null) ?? [])}
      onSelect={(item) => {
        filter.selection = item.value
        onChange?.(filter)
      }}
    >
      <div
        class={cn(
          'border-border bg-background hover:bg-accent rounded-full border-2 px-2 py-1 text-xs font-normal',
          filter.selection === null ? 'border-1 font-bold text-blue-700 dark:border-blue-700' : ''
        )}
      >
        {filter.selection ?? 'Tudo'}
      </div>
    </CommandSelect>
  </div>
</CommandSelect>

{#snippet tag_select_item(item: SelectItem)}
  <div class="flex flex-1 justify-center">
    {#if item.value == null}
      <span class="text-blue-700 dark:text-blue-700">Tudo</span>
    {:else}
      {item.label}
    {/if}
  </div>
{/snippet}
