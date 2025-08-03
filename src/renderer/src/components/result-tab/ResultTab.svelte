<script lang="ts">
  import ConfigPopover from '@/components/result-tab/config-popover/ConfigPopover.svelte'
  import { Button, buttonVariants } from '@/components/ui/button'
  import { cn } from '@lib/utils'
  import { Plus } from '@lucide/svelte'

  const resultTables = [
    'Pontos por categoria1',
    'Pontos por categoria2',
    'Pontos por categoria3',
    'Pontos por categoria4'
  ]
</script>

<div class="h-full flex-1 flex-col space-y-8 p-8 md:flex">
  <div class="flex w-full items-center">
    <div class="flex flex-wrap items-center gap-1">
      {#each resultTables as resultTable (resultTable)}
        <div class={cn(buttonVariants({ variant: 'outline' }), 'rounded-md p-2')}>
          {resultTable}
        </div>
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
