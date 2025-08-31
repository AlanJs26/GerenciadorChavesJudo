<script lang="ts" module>
  type T = unknown
</script>

<script lang="ts">
  import type { SelectItem } from '@components/command-select'
  import { Button } from '@components/ui/button'
  import { cn } from '@lib/utils'
  import { Plus, X } from '@lucide/svelte'
  import { type Snippet } from 'svelte'

  let {
    class: className,
    containerclass,
    items = $bindable<SelectItem<T>[]>([]),
    selected = $bindable<T>(),
    onAdd,
    onRemove,
    children
  }: {
    class?: string
    containerclass?: string
    selected?: T
    items?: SelectItem<T>[]
    onAdd?: (name: string) => void
    onRemove?: (item: SelectItem<T>) => void
    children: Snippet
  } = $props()

  function uniqueName() {
    // gera nome único básico
    let base = 'Coluna'
    let n = items.length + 1
    let newName = `${base} ${n}`
    while (items.find((it) => it.label == newName)) {
      n++
      newName = `${base} ${n}`
    }
    return newName
  }
</script>

<div class={cn('flex w-full flex-1 border-t-1', containerclass)}>
  <div class="min-h-full border-r-1">
    <div class="sticky top-0 flex min-h-min flex-col">
      {#each items as item (item.value)}
        <Button
          variant="ghost"
          class={cn(
            'group w-full justify-start rounded-none pr-7',
            selected == item.value ? 'bg-primary/10' : ''
          )}
          onclick={() => {
            selected = item.value
          }}
        >
          {item.label}
          {#if items.length > 0}
            <Button
              variant="ghost"
              class="group-hover:text-muted-foreground hover:text-foreground absolute right-1 z-10 size-5 rounded-full p-0 text-transparent"
              onclick={() => {
                onRemove?.(item)
              }}
            >
              <X class="size-3" />
            </Button>
          {/if}
        </Button>
      {/each}
      <Button
        variant="outline"
        size="sm"
        class="!mx-2 !mt-2"
        onclick={() => {
          const newName = uniqueName()
          onAdd?.(newName)
        }}
      >
        <Plus class="size-3" />
        Novo
      </Button>
    </div>
  </div>

  <div class={cn('flex flex-1 flex-col gap-2 p-5', className)}>
    {#if !items.some((it) => it.value == selected)}
      <div class="flex w-full flex-1 items-center justify-center">Nada selecionado</div>
    {:else}
      {@render children?.()}
    {/if}
  </div>
</div>
