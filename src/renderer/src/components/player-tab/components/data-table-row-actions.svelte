<script lang="ts" module>
  type TData = unknown
</script>

<script lang="ts" generics="TData">
  import Ellipsis from '@lucide/svelte/icons/ellipsis'
  import type { Row } from '@tanstack/table-core'
  import { labels } from '../(data)/data'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import Button from '@components/ui/button/button.svelte'

  let { row }: { row: Row<TData> } = $props()

  const task = row.original
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" class="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
        <Ellipsis />
        <span class="sr-only">Open Menu</span>
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-[160px]" align="end">
    <DropdownMenu.Item>Edit</DropdownMenu.Item>
    <DropdownMenu.Item>Make a copy</DropdownMenu.Item>
    <DropdownMenu.Item>Favorite</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>Labels</DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        <DropdownMenu.RadioGroup value={task.label}>
          {#each labels as label (label.value)}
            <DropdownMenu.RadioItem value={label.value}>
              {label.label}
            </DropdownMenu.RadioItem>
          {/each}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
    <DropdownMenu.Separator />
    <DropdownMenu.Item>
      Delete
      <DropdownMenu.Shortcut>⌘⌫</DropdownMenu.Shortcut>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
