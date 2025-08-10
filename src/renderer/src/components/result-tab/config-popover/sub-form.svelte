<script lang="ts">
  import { Button } from '@components/ui/button'
  import { cn } from '@lib/utils'
  import { Plus, X } from '@lucide/svelte'
  import { createEventDispatcher, type Snippet } from 'svelte'

  const dispatch = createEventDispatcher<{
    add: { item: string }
    remove: { index: number; item: string }
  }>()

  let {
    class: className,
    containerclass,
    items = $bindable<string[]>([]),
    selected = $bindable<string>(''),
    children
  }: {
    class?: string
    containerclass?: string
    selected?: string
    items?: string[]
    children: Snippet
  } = $props()

  function addItem() {
    // gera nome único básico
    let base = 'Item'
    let n = items.length + 1
    let newName = `${base} ${n}`
    while (items.includes(newName)) {
      n++
      newName = `${base} ${n}`
    }
    items = [...items, newName]
    selected = newName
    dispatch('add', { item: newName })
  }

  function removeItem(index: number) {
    const item = items[index]
    const newItems = items.filter((_, i) => i !== index)
    items = newItems
    if (!newItems.includes(selected)) {
      selected = newItems[0] ?? ''
    }
    dispatch('remove', { index, item })
  }
</script>

<div class={cn('flex w-full flex-1 border-t-1', containerclass)}>
  <div class="min-h-full border-r-1">
    <div class="sticky top-0 flex min-h-min flex-col">
      {#each items as item, i (item)}
        <div class="group relative">
          <Button
            variant="ghost"
            class={cn(
              'w-full justify-start rounded-none pr-7',
              selected == item ? 'bg-primary/10' : ''
            )}
            onclick={() => {
              selected = item
            }}
          >
            {item}
          </Button>
          {#if items.length > 1}
            <button
              class="text-muted-foreground hover:text-foreground absolute top-1 right-1 hidden rounded p-1 text-xs group-hover:block"
              title="Remover"
              onclick={() => removeItem(i)}
            >
              <X class="size-3" />
            </button>
          {/if}
        </div>
      {/each}
      <Button variant="outline" size="sm" class="!mx-2 !mt-2" on:click={addItem}>
        <Plus class="size-3" />
        Novo
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
