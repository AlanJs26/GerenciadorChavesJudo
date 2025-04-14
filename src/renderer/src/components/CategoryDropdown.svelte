<script lang="ts">
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import { buttonVariants } from '@components/ui/button'
  import type { Snippet } from 'svelte'

  let {
    categories = $bindable(),
    children
  }: {
    categories: { category: string; state: boolean; isMale: boolean }[]
    children: Snippet
  } = $props()
</script>

<DropdownMenu.Root closeOnItemClick={false}>
  <DropdownMenu.Trigger
    class={buttonVariants({ variant: 'default' }) + ' rounded-e-none border-e border-gray-700'}
  >
    {@render children?.()}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content class="w-30">
    <DropdownMenu.Group>
      {#each categories as selected}
        <DropdownMenu.CheckboxItem bind:checked={selected.state}>
          {selected.category}
        </DropdownMenu.CheckboxItem>
      {/each}
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>
