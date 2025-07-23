<script lang="ts">
  import { Button } from '@/components/ui/button'
  import { bracketsStore, genderStore } from '@/states.svelte'
  import { Badge } from '@components/ui/badge'
  import type { Tag } from '@lib/types/bracket-lib'
  import { clamp, cn, compareObject, isSubsetOf } from '@lib/utils'
  import { ArrowRightLeft, GripVertical } from '@lucide/svelte'
  import { draggable, droppable, type DragDropState } from '@thisux/sveltednd'
  import { untrack } from 'svelte'
  import { flip } from 'svelte/animate'
  import { fade } from 'svelte/transition'

  // let selectedBrackets: Record<string, Bracket> = $derived(
  //   bracketsStore.brackets[genderStore.gender]
  // )
  //
  // let openDeletePopover: Record<string, boolean> = $state({})

  const ITEM_REM_HEIGHT = 3

  function handleDrop(state: DragDropState<string>) {
    const { draggedItem, targetContainer } = state
    const dragIndex = tagOrder.findIndex((tag) => tag == draggedItem)
    const dropIndex = parseInt(targetContainer ?? '0')

    if (dragIndex !== -1 && !isNaN(dropIndex)) {
      const [item] = tagOrder.splice(dragIndex, 1)
      tagOrder.splice(dropIndex, 0, item)
    }
  }

  function isSelected(tag: Tag, constraints?: Tag[]) {
    return (constraints ?? selectedTags).some((s) => compareObject(s, tag))
  }

  function computePossibleTags(tagId: string, selected: Tag[]): Tag[] {
    const relevantBrackets = bracketsStore.brackets[genderStore.gender].filter((bracket) =>
      isSubsetOf(selected, bracket.category, (a, b) => compareObject(a, b))
    )
    return relevantBrackets.flatMap((bracket) => bracket.category.filter((tag) => tag.id == tagId))
  }

  function sortSelected(order: string[]) {
    const tagIndexOf = (tag) => order.findIndex((tagId) => tagId == tag.id)
    selectedTags.sort((a, b) => tagIndexOf(a) - tagIndexOf(b))
  }

  let selectedTags: Tag[] = $state([])
  let tagOrder: string[] = $state([])

  let orderedTagValues = $derived(
    tagOrder.map((tagId, i) => {
      const tag = selectedTags.find((t) => t.id == tagId)
      if (!tag) return ['ignore' + i]
      const index = selectedTags.indexOf(tag)
      if (index == 0) {
        return bracketsStore.tagById[genderStore.gender][tag.id].map((t) => t.value)
      }
      return Array.from(
        new Set(computePossibleTags(tag.id, selectedTags.slice(0, index)).map((tag) => tag.value))
      ).toSorted()
    })
  )

  function findValidCategory(tagOrder: string[], constraints?: Tag[]) {
    if (!tagOrder?.length) return null

    const gender = genderStore.gender
    const availableTags = bracketsStore.tagById[gender]

    const newSelection: Tag[] = [...(constraints ?? []).map((t) => ({ ...t }))]

    for (let i = 0; i < tagOrder.length; i++) {
      const tagId = tagOrder[i]

      // If funtion is called with constraints, prevent duplicated tagIds
      if (constraints != undefined && newSelection.find((t) => t.id == tagId)) {
        continue
      }

      if (!(tagId in availableTags)) {
        throw Error(`tag "${tagId}" id does not exist for gender "${gender}"`)
      }

      if (availableTags[tagId].length == 0) continue

      if (newSelection.length == 0) {
        newSelection.push(availableTags[tagId][0])
        continue
      }

      const possibleTags = computePossibleTags(tagId, newSelection)

      if (possibleTags.length == 0) {
        continue
      }

      newSelection.push(possibleTags[0])
    }
    if (!bracketsStore.get(gender, newSelection)) {
      // console.warn(
      //   'Could not find a valid Bracket given the tag order:',
      //   $state.snapshot(tagOrder),
      //   'and constraints',
      //   $state.snapshot(constraints ?? [])
      // )
      return null
    }
    return newSelection
  }

  $effect(() => {
    sortSelected(tagOrder)
  })

  $effect(() => {
    const tagById = bracketsStore.tagById[genderStore.gender]
    const tagIds = Object.keys(tagById)
    untrack(() => {
      if (tagOrder.length == 0) {
        tagOrder = tagIds ?? []
      } else {
        // keep tagIds already included in new tagIds, and remove any tagId not present in new tagIds
        tagOrder = [
          ...tagOrder.filter((tagId) => tagIds.includes(tagId)),
          ...tagIds.filter((tagId) => !tagOrder.includes(tagId))
        ]
      }
    })
    selectedTags = findValidCategory(tagIds) ?? []
  })
</script>

<div class="flex !w-full flex-col">
  <div
    class="flex w-full border-b"
    style={`min-height:${ITEM_REM_HEIGHT * bracketsStore.tagById[genderStore.gender].length}rem`}
  >
    <div>
      {#each tagOrder as tagId, index (tagId)}
        <div
          use:draggable={{ container: index.toString(), dragData: tagId }}
          use:droppable={{
            container: index.toString(),
            callbacks: { onDrop: handleDrop }
          }}
          animate:flip={{ duration: 200 }}
          in:fade={{ duration: 150 }}
          out:fade={{ duration: 150 }}
          style={`height:${ITEM_REM_HEIGHT}rem`}
          class={cn(
            'svelte-dnd-touch-feedback',
            'relative flex items-center',
            'ring-ring/10 ring-1 transition-all duration-200 hover:z-10 hover:ring-2 hover:ring-blue-200 ',
            'bg-background cursor-grab p-3 '
          )}
        >
          <h3 class="text-foreground flex-1 font-medium">
            {tagId}
          </h3>
          <GripVertical size={16} class="ml-3 opacity-30" />
        </div>
      {/each}
    </div>

    <div class="ml-[1px] flex flex-col">
      <div class="flex-1"></div>
      <Button
        variant="outline"
        class="item-height bg-background ring-ring/10 text-md flex h-[3rem] w-30 cursor-pointer items-center gap-2 rounded-none border-none p-3 ring-1"
        onclick={() => {
          genderStore.toggle()
        }}
      >
        <ArrowRightLeft size={16} class="opacity-30" />
        <h3 class="text-foreground font-medium">{genderStore.radio}</h3>
      </Button>
    </div>

    <div class="flex-1">
      {#each orderedTagValues as tagValues, index (tagValues.join())}
        <div class="item-height flex flex-wrap items-center justify-center gap-1">
          {#if tagValues.length != 1 || !tagValues.at(0).startsWith('ignore')}
            {#each tagValues as tagValue (tagValue)}
              <Badge
                variant={isSelected({ id: tagOrder[index], value: tagValue })
                  ? 'default'
                  : 'outline'}
                onclick={() => {
                  const gender = genderStore.gender
                  selectedTags[clamp(index, 0, selectedTags.length - 1)] = {
                    id: tagOrder[index],
                    value: tagValue
                  }

                  if (bracketsStore.get(gender, selectedTags)) {
                    bracketsStore.selectedCategory = selectedTags
                  } else {
                    let newSelection = findValidCategory(tagOrder, selectedTags)
                    for (let i = -1; i >= -selectedTags.length; i--) {
                      if (bracketsStore.has(gender, newSelection)) break

                      const contraints = selectedTags.slice(0, i)
                      newSelection = findValidCategory(tagOrder, contraints)
                    }

                    if (!bracketsStore.has(gender, newSelection)) {
                      console.error('Invalid selected category', newSelection)
                    } else {
                      selectedTags = newSelection
                      bracketsStore.selectedCategory = newSelection
                    }
                  }
                }}
                class="h-7 cursor-pointer border-zinc-500"
              >
                {tagValue}
              </Badge>
            {/each}
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#if bracketsStore.selectedCategory?.length}
    <div class="flex !w-full items-center px-5 py-2">
      <p class="!font-bold">{bracketsStore.selectedCategory.map((c) => c.value).join(' | ')}</p>

      <div class="flex-1"></div>
      <Button variant="default" class="self-end">Imprimir</Button>
    </div>
  {/if}
</div>

<!-- <div class="categories p-2">
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
</div> -->

<!-- {#snippet deleteCategoryPopover(trigger: Snippet, category: string)}
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
{/snippet} -->

<style>
  @reference '../../assets/main.css';
  /* .categories {
    display: flex;
    align-self: center;
    gap: 10px;
  } */
  :global(.dragging) {
    @apply opacity-50 shadow-lg ring-2 ring-blue-400;
  }

  .item-height {
    height: 3rem;
  }

  /* :global(.drag-over) {
    @apply bg-blue-50;
  } */
</style>
