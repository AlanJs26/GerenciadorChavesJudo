<script lang="ts">
  import Badge from '@components/ui/badge/badge.svelte'
  import type { ResultTable } from '@lib/types/result-table'

  import { resultTableStore } from '@/states.svelte.ts'

  let {
    checked = $bindable(),
    table
  }: {
    checked: boolean
    table: ResultTable
  } = $props()

  const isSelected = $derived(resultTableStore.selectedName == table.name)
</script>

<button
  class="participante hover:bg-primary/5 flex w-full cursor-pointer gap-0 !pr-5"
  onclick={function (): void {
    if (isSelected) {
      ;(this as HTMLDivElement).querySelector('input').click()
    } else {
      resultTableStore.selectedName = table.name
    }
  }}
>
  <div class="flex w-full flex-1 flex-col items-start p-3">
    <div class="flex">
      <Badge
        variant={isSelected ? 'default' : 'outline'}
        group={true}
        category={[{ id: '', value: table.name }]}
        onclick={(e) => {
          e.stopPropagation()
          resultTableStore.selectedName = table.name
        }}
      ></Badge>
    </div>
    <div class="text-muted-foreground !mt-1 !ml-2 flex flex-col text-start text-xs">
      <span>
        {table.filters.map((t) => t.field).join(' | ')}
      </span>
      <span>
        {table.columns.map((t) => t.name).join(' | ')}
      </span>
    </div>
  </div>
  <input
    type="checkbox"
    bind:checked
    onclick={(e: Event): void => {
      e.stopPropagation()
    }}
  />
</button>
