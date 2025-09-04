<script lang="ts">
  import { categoryState, setSelectedCategory } from '@components/bracket-tab/bracket-state.svelte'
  import { sidebarState } from '@components/sidebar/sidebar-state.svelte.ts'
  import { Badge } from '@components/ui/badge'
  import { Button } from '@components/ui/button'
  import { hashCategory } from '@lib/bracket-lib'
  import type { Tag } from '@lib/types/bracket-lib'
  import { clamp, cn, compareObject } from '@lib/utils'
  import { ArrowRightLeft, GripVertical } from '@lucide/svelte'
  import { type DragDropState, draggable, droppable } from '@thisux/sveltednd'
  import { untrack } from 'svelte'
  import { flip } from 'svelte/animate'
  import { fade } from 'svelte/transition'

  import CategorySelect from '@/components/category-select.svelte'
  import { bracketsStore, genderStore } from '@/states.svelte'

  let { onPrint }: { onPrint?: () => void } = $props()

  const hasBrackets = $derived(bracketsStore.brackets[genderStore.gender].length > 0)
  const ITEM_REM_HEIGHT = 3

  function handleDrop(state: DragDropState<string>) {
    const { draggedItem, targetContainer } = state
    const dragIndex = categoryState.tagOrder.findIndex((tag) => tag == draggedItem)
    const dropIndex = parseInt(targetContainer ?? '0')

    if (dragIndex !== -1 && !isNaN(dropIndex)) {
      const [item] = categoryState.tagOrder.splice(dragIndex, 1)
      categoryState.tagOrder.splice(dropIndex, 0, item)
    }
  }

  function isSelected(tag: Tag, constraints?: Tag[]) {
    return (constraints ?? bracketsStore.selectedCategory).some((s) => compareObject(s, tag))
  }

  function sortSelected(order: string[]) {
    const tagIndexOf = (tag) => order.findIndex((tagId) => tagId == tag.id)
    bracketsStore.selectedCategory.sort((a, b) => tagIndexOf(a) - tagIndexOf(b))
  }

  $effect(() => {
    sortSelected(categoryState.tagOrder)
  })

  $effect(() => {
    const tagById = bracketsStore.tagById[genderStore.gender]
    const tagIds = Object.keys(tagById)
    untrack(() => {
      // keep tagIds already included in new tagIds, and remove any tagId not present in new tagIds
      categoryState.tagOrder = [
        ...categoryState.tagOrder.filter((tagId) => tagIds.includes(tagId)),
        ...tagIds.filter((tagId) => !categoryState.tagOrder.includes(tagId))
      ]
    })
    // bracketsStore.selectedCategory = findValidCategory(tagIds) ?? []
  })
</script>

<div class="flex !w-full flex-col">
  <div
    class="flex w-full border-b"
    style={`min-height:${ITEM_REM_HEIGHT * bracketsStore.tagById[genderStore.gender].length}rem`}
  >
    <div class="flex flex-col">
      {#each categoryState.tagOrder as tagId, index (tagId)}
        <div
          use:draggable={{ container: index.toString(), dragData: tagId }}
          use:droppable={{
            container: index.toString(),
            callbacks: { onDrop: handleDrop }
          }}
          animate:flip={{ duration: 200 }}
          in:fade={{ duration: 150 }}
          out:fade={{ duration: 150 }}
          class={cn(
            'svelte-dnd-touch-feedback',
            'relative flex items-center',
            'ring-ring/10 ring-1 transition-all duration-200 hover:z-10 hover:ring-2 hover:ring-blue-200 ',
            'bg-background flex-1 cursor-grab p-3'
          )}
        >
          <h3 class="text-foreground flex-1 font-medium">
            {tagId}
          </h3>
          <GripVertical size={16} class="ml-3 opacity-30" />
        </div>
      {/each}
    </div>

    <div
      class="ml-[1px] grid"
      style={`grid-template-rows: repeat(${categoryState.orderedTagValues.length}, 1fr)`}
    >
      <Button
        variant="outline"
        class="bg-background ring-ring/10 text-md -row-end-1 flex h-full w-auto cursor-pointer items-center gap-2 rounded-none border-none p-3 ring-1"
        onclick={() => {
          genderStore.toggle()
        }}
      >
        <ArrowRightLeft size={16} class="opacity-30" />
        <h3 class="text-foreground font-medium">{genderStore.radio}</h3>
      </Button>
    </div>

    <div
      class={cn('grid flex-1')}
      style={`grid-template-rows: repeat(${categoryState.orderedTagValues.length}, 1fr)`}
    >
      {#each categoryState.orderedTagValues as tagValues, index (tagValues.join() + index)}
        <div class="item-height flex flex-wrap items-center justify-center gap-1">
          {#each tagValues as tagValue (tagValue)}
            {@const isLast = index == bracketsStore.selectedCategory.length - 1}
            {@const checkedBracket = sidebarState.checkedBrackets[genderStore.gender]}
            <Badge
              variant={isSelected({ id: categoryState.tagOrder[index], value: tagValue })
                ? 'default'
                : 'outline'}
              onclick={(e) => {
                const category = [...bracketsStore.selectedCategory]
                category[clamp(index, 0, bracketsStore.selectedCategory.length - 1)] = {
                  id: categoryState.tagOrder[index],
                  value: tagValue
                }

                if (e.shiftKey) {
                  if (isLast && bracketsStore.has(genderStore.gender, category)) {
                    const hash = hashCategory(category)

                    checkedBracket.set(hash, !(checkedBracket.get(hash) ?? false))
                  }
                  return
                }

                setSelectedCategory(category)
              }}
              class={cn(
                'h-7 cursor-pointer border-zinc-500',
                isLast &&
                  checkedBracket.get(
                    hashCategory([
                      ...bracketsStore.selectedCategory.filter(
                        (t) => t.id != categoryState.tagOrder[index]
                      ),
                      {
                        id: categoryState.tagOrder[index],
                        value: tagValue
                      }
                    ])
                  )
                  ? 'border-blue-400'
                  : ''
              )}
            >
              {tagValue}
            </Badge>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  {#if bracketsStore.selectedCategory?.length && hasBrackets}
    <div class="flex !w-full items-center px-5 py-2">
      <!-- <p class="!mr-5 min-w-fit !font-bold"> -->
      <!--   {bracketsStore.selectedCategory.map((c) => c.value).join(' | ')} -->
      <!-- </p> -->

      <div class="!mr-5">
        <Badge
          category={bracketsStore.selectedCategory}
          group={true}
          variant="outline"
          class="p-2 px-4 text-xl !font-bold"
        />
      </div>

      <span class="!mr-3 !font-bold">Status:</span>

      <CategorySelect
        selectedTags={bracketsStore.selectedBracket?.status ?? []}
        gender={genderStore.gender}
        colors={bracketsStore.statusColors}
        useStatus={true}
        onChange={(tags) => {
          bracketsStore.selectedBracket.status = tags
        }}
      />

      <div class="flex-1"></div>
      <Button variant="default" class="!ml-5" onclick={() => onPrint?.()}>Imprimir</Button>
    </div>
  {/if}
</div>

<style>
  @reference '../../assets/main.css'

  :global(.dragging) {
    @apply opacity-50 shadow-lg ring-2 ring-blue-400;
  }

  /* .item-height { */
  /*   height: 3rem; */
  /* } */
</style>
