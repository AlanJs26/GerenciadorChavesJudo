<script lang="ts">
  import type { SelectItem } from '@components/command-select'
  import { buttonVariants } from '@components/ui/button'
  import * as Command from '@components/ui/command'
  import * as Popover from '@components/ui/popover'
  import { cn } from '@lib/utils'
  import { Check, ChevronDown, Plus } from '@lucide/svelte'
  import { onMount, type Snippet } from 'svelte'

  let {
    placeholder = 'Type to search...',
    items = $bindable(),
    value = $bindable(''),
    itemFactory,
    defaultLabel: defaultValue = $bindable(''),
    onNewItem,
    onSelect,
    newItemSnippet,
    class: className,
    popoverClass,
    children
  }: {
    placeholder: string
    items: SelectItem[]
    value: string
    defaultLabel: string
    class: string
    popoverClass: string
    itemFactory?: (inputValue: string) => SelectItem
    onNewItem?: (inputValue: string) => void
    onSelect?: (value: SelectItem) => void
    newItemSnippet?: Snippet
    children: Snippet
  } = $props()

  let selectedIndex = $state(-1)
  let inputValue = $state('')
  let popoverOpen = $state(false)
  let tempItem: SelectItem | null = $state(null)

  const commandItems = $derived(tempItem ? [...items, tempItem] : items)

  onMount(() => {
    const index = commandItems?.findIndex((item) => item.label == defaultValue)
    selectedIndex = index
  })
  $effect(() => {
    if (defaultValue) {
      const index = commandItems?.findIndex((item) => item.label == defaultValue)
      selectedIndex = index
    }
  })
</script>

<Popover.Root bind:open={popoverOpen}>
  {#if children}
    <Popover.Trigger class={className} onclick={(e) => e.stopPropagation()}>
      {@render children()}
    </Popover.Trigger>
  {:else}
    <Popover.Trigger
      onclick={(e) => e.stopPropagation()}
      class={cn(buttonVariants({ variant: 'outlineNoHover' }), 'justify-start', className)}
    >
      {#if selectedIndex >= 0}
        {@render select_item(commandItems?.at(selectedIndex))}
      {/if}
      <ChevronDown class="!ml-auto size-4 opacity-50" />
    </Popover.Trigger>
  {/if}

  <Popover.Content class={cn('p-0', popoverClass)}>
    <Command.Root>
      <Command.Input {placeholder} bind:value={inputValue} />
      <Command.List>
        <Command.Empty>Não encontrado</Command.Empty>
        {#each commandItems as item, i (item.label)}
          <Command.Item
            value={item.label}
            class="flex"
            onclick={() => {
              selectedIndex = i
              onSelect?.(commandItems.at(selectedIndex))
              if (item.label != tempItem?.label) {
                tempItem = null
              }
              value = item.label
              inputValue = ''
              popoverOpen = false
            }}
          >
            <span class="flex size-3.5 items-center justify-center">
              {#if i == selectedIndex}
                <Check class="size-4" />
              {/if}
            </span>
            {@render select_item(item)}
          </Command.Item>
        {/each}
        {#if (onNewItem || itemFactory) && inputValue.length && commandItems?.findIndex((item) => item.label == inputValue) == -1}
          <Command.Item
            value="add-item"
            class="flex justify-center"
            forceMount={true}
            onclick={() => {
              onNewItem?.(inputValue)
              popoverOpen = false
              if (itemFactory) {
                tempItem = itemFactory(inputValue)
                value = tempItem.label
                selectedIndex = items.length
              }
              inputValue = ''
            }}
          >
            {#if newItemSnippet}
              {@render newItemSnippet()}
            {:else}
              <span class="flex size-3.5 items-center justify-center">
                <Plus class="size-4" />
              </span>
              Adicionar
            {/if}
          </Command.Item>
        {/if}
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>

{#snippet select_item(item: SelectItem | undefined)}
  {#if item?.snippet}
    {@render item.snippet(item)}
  {:else if item?.label}
    {item.label}
  {/if}
{/snippet}
