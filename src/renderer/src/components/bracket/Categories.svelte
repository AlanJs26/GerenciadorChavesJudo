<script lang="ts">
  import { NewCategoryPopover } from '.'
  import { Button } from '@/components/ui/button'
  import { bracketsStore } from '@/states.svelte'
  import { Badge } from '@components/ui/badge'
  import * as Popover from '@components/ui/popover'
  import { ScrollArea } from '@components/ui/scroll-area'
  import type { Bracket } from '@lib/types/bracket-lib'
  import type { Snippet } from 'svelte'

  let {
    isMale,
    currentCategory = $bindable()
  }: {
    isMale: boolean
    currentCategory: string
  } = $props()

  let gender: 'male' | 'female' = $derived(isMale ? 'male' : 'female')
  let selectedBrackets: Record<string, Bracket> = $derived(bracketsStore.brackets[gender])

  let openDeletePopover: Record<string, boolean> = $state({})
</script>

<div class="categories p-2">
  <ScrollArea contentclass="!flex flex-wrap justify-center gap-1">
    {#each Object.keys(selectedBrackets) as category}
      {#snippet badgeSnippet()}
        <Badge
          variant={category == currentCategory ? 'default' : 'outline'}
          onclick={(): void => {
            currentCategory = category
          }}
          class="h-7 cursor-pointer border-zinc-500"
        >
          {category}
        </Badge>
      {/snippet}
      {@render deleteCategoryPopover(badgeSnippet, category)}
    {/each}
  </ScrollArea>

  <NewCategoryPopover
    {isMale}
    onSubmit={(category) => {
      currentCategory = category
    }}
  />
</div>

{#snippet deleteCategoryPopover(trigger: Snippet, category: string)}
  <Popover.Root
    bind:open={
      () => openDeletePopover[category] ?? false,
      (open) => {
        if (open) return
        openDeletePopover[category] = open
      }
    }
  >
    <Popover.Trigger
      oncontextmenu={(e: MouseEvent) => {
        e.preventDefault()
        if (e.buttons == 2) {
          for (const key in openDeletePopover) {
            if (key != category) {
              openDeletePopover[key] = false
            }
          }
          openDeletePopover[category] = !openDeletePopover[category]
        }
      }}
    >
      {@render trigger()}
    </Popover.Trigger>
    <Popover.Content class="w-[200px]">
      <Button
        variant="destructive"
        class="w-full"
        onclick={() => {
          delete bracketsStore.brackets[gender][category]
        }}>Deletar</Button
      >
    </Popover.Content>
  </Popover.Root>
{/snippet}

<style>
  .categories {
    display: flex;
    align-self: center;
    gap: 10px;
  }
</style>
