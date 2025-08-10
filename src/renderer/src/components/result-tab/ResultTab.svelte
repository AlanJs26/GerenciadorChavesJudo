<script lang="ts">
  import ConfigPopover from '@components/result-tab/config-popover/ConfigPopover.svelte'
  import { resultTablesStore } from '@components/result-tab/result-tables.svelte'
  import { Button, buttonVariants } from '@components/ui/button'
  import { cn } from '@lib/utils'
  import { Plus } from '@lucide/svelte'

  let resultTables = $derived(resultTablesStore.resultTables.map((t) => t.name))
</script>

<div class="h-full flex-1 flex-col space-y-8 p-8 md:flex">
  <div class="flex w-full items-center">
    <div class="flex flex-wrap items-center gap-1">
      {#each resultTables as resultTable (resultTable)}
        <button
          class={cn(buttonVariants({ variant: 'outline' }), 'rounded-md p-2')}
          onclick={() => {
            console.log(resultTablesStore.resultTables.find((t) => t.name == resultTable))
          }}
        >
          {resultTable}
        </button>
      {/each}
      <div class={cn(buttonVariants({ variant: 'outline' }), 'size-5 rounded-full p-3')}>
        <Plus class="size-4" />
      </div>
    </div>

    <div class="flex-1"></div>

    <ConfigPopover>
      <Button variant="default">Exportar</Button>
    </ConfigPopover>
  </div>
</div>
