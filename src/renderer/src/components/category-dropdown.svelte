<script lang="ts">
  import { buttonVariants } from '@components/ui/button'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Separator } from '@components/ui/separator'
  import type { StatefullCategory } from '@lib/types/bracket-lib'
  import { cn } from '@lib/utils'
  import type { Snippet } from 'svelte'

  let {
    statefullCategories = $bindable(),
    children
  }: {
    statefullCategories: StatefullCategory[]
    children: Snippet
  } = $props()

  let states: boolean[] = $derived(statefullCategories.map((c) => c.state))

  let allChecked = $derived(states.every((s) => s))
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={cn(
      buttonVariants({ variant: 'defaultDark' }),
      ' rounded-e-none border-e border-gray-700'
    )}
  >
    {@render children?.()}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content class="w-30">
    <DropdownMenu.Group>
      <ScrollArea class="flex max-h-[calc(32px*10)] flex-col" type="auto">
        {#each statefullCategories as category, i (category)}
          <DropdownMenu.CheckboxItem
            closeOnSelect={false}
            bind:checked={
              () => states?.[i] ?? category.state,
              () => {
                category.state = !category.state
                states[i] = category.state
              }
            }
          >
            {category.category.map((c) => c.value).join(' | ')}
          </DropdownMenu.CheckboxItem>
        {/each}
      </ScrollArea>
      <Separator />
      <DropdownMenu.CheckboxItem
        closeOnSelect={false}
        bind:checked={
          () => allChecked,
          () => {
            const prevAllChecked = allChecked
            statefullCategories.forEach((_, i) => {
              statefullCategories[i].state = !prevAllChecked
              states[i] = statefullCategories[i].state
            })
          }
        }>Alternar Todos</DropdownMenu.CheckboxItem
      >
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>
