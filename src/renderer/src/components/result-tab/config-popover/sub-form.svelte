<script lang="ts">
  import { Button } from '@/components/ui/button'
  import { cn } from '@lib/utils'
  import { Plus } from '@lucide/svelte'
  import { type Snippet } from 'svelte'

  let {
    class: className,
    containerclass,
    items,
    selected = $bindable(),
    children
  }: {
    class?: string
    containerclass?: string
    selected: string
    items: string[]
    children: Snippet
  } = $props()
</script>

<div class={cn('flex w-full flex-1 border-t-1', containerclass)}>
  <div class="min-h-full border-r-1">
    <div class="sticky top-0 flex min-h-min flex-col">
      {#each items as item (item)}
        <Button
          variant="ghost"
          class={cn('rounded-none', selected == item ? 'bg-primary/10' : '')}
          onclick={() => {
            selected = item
          }}
        >
          {item}
        </Button>
      {/each}
      <Button variant="outline" size="sm" class="!mx-2 !mt-2">
        <Plus />
        Adicionar
      </Button>
    </div>
  </div>

  <div class={cn('flex flex-1 flex-col gap-2 p-5', className)}>
    {#if !items.includes(selected)}
      <div class="flex w-full flex-1 items-center justify-center">Nada selecionado</div>
    {:else}
      {@render children?.()}
    {/if}
  </div>
</div>
