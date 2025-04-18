<script lang="ts">
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import { buttonVariants } from '@components/ui/button'
  import { ScrollArea } from '@components/ui/scroll-area'
  import type { Snippet } from 'svelte'

  let {
    categories = $bindable(),
    children
  }: {
    categories: { category: string; state: boolean; isMale: boolean }[]
    children: Snippet
  } = $props()

  let states: boolean[] = $state(categories.map((c) => c.state))

  $effect(() => {
    states = categories.map((c) => c.state)
  })
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={buttonVariants({ variant: 'default' }) + ' rounded-e-none border-e border-gray-700'}
  >
    {@render children?.()}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content class="w-30">
    <DropdownMenu.Group>
      <ScrollArea class="flex max-h-[60vh] flex-col" type="auto">
        {#each categories as _selected, i}
          <DropdownMenu.CheckboxItem
            closeOnSelect={false}
            bind:checked={
              () => states?.[i] ?? categories[i].state,
              () => {
                categories[i].state = !categories[i].state
                states[i] = categories[i].state
              }
            }
          >
            {categories[i].category}
          </DropdownMenu.CheckboxItem>
        {/each}
      </ScrollArea>
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>
