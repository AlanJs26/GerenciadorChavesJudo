<script lang="ts">
  import type { SelectItem } from '@components/command-select'
  import CommandSelect from '@components/command-select/CommandSelect.svelte'
  import NewTagPopover from '@components/player-tab/data-table/new-tag-popover.svelte'
  import { Badge, BadgeButton } from '@components/ui/badge'
  import { buttonVariants } from '@components/ui/button'
  import type { Gender, Tag } from '@lib/types/bracket-lib'
  import { cn, compareObject } from '@lib/utils'
  import { Plus } from '@lucide/svelte'
  import { SvelteSet as Set } from 'svelte/reactivity'

  import { bracketsStore, playersStore } from '@/states.svelte'

  let {
    gender,
    selectedTags = $bindable([]),
    useStatus = false,
    colors = {},
    onChange,
    class: className
  }: {
    onChange?: (tags: Tag[]) => void
    selectedTags: Tag[]
    colors: Record<string, string>
    useStatus: boolean
    gender: Gender
    class?: string
  } = $props()

  const tagitemById: Record<string, SelectItem[]> = $derived(
    (useStatus ? bracketsStore.statuses : playersStore.categories)[gender].reduce(
      (acc, category) => {
        for (const tag of category) {
          if (acc[tag.id]?.find((item) => compareObject(item.value, tag))) continue
          const newItem = {
            label: tag.value,
            value: tag,
            snippet: tag_select_item
          }
          if (tag.id in acc) {
            acc[tag.id].push(newItem)
          } else {
            acc[tag.id] = [newItem]
          }
        }
        return acc
      },
      {} as Record<string, SelectItem<Tag>[]>
    )
  )

  const selectedTagIds = $derived(selectedTags.map((t) => t.id))
  const availableTagIds = $derived([...new Set([Object.keys(tagitemById), selectedTagIds].flat())])
</script>

<div class={cn('flex flex-wrap gap-1', className)}>
  {#each availableTagIds as tagId (tagId)}
    {@const playerTag = selectedTags.find((t) => t.id == tagId)}
    <CommandSelect
      popoverClass="w-auto"
      items={tagitemById[tagId]}
      defaultLabel={playerTag?.value}
      onNewItem={(value) => {
        const newTag = { id: tagId, value }
        selectedTags = [...selectedTags.filter((t) => t.id != newTag.id), newTag]
        onChange?.(selectedTags)
      }}
      onSelect={(item) => {
        const newTag = item.value

        selectedTags = [...selectedTags.filter((t) => t.id != newTag.id), newTag]
        onChange?.(selectedTags)
      }}
    >
      {#if playerTag}
        <BadgeButton
          category={playerTag}
          {colors}
          onClose={(e) => {
            e.preventDefault()
            e.stopPropagation()

            selectedTags = [...selectedTags.filter((t) => t.id != playerTag.id)]
            onChange?.(selectedTags)
          }}
        ></BadgeButton>
      {:else}
        <BadgeButton {colors} variant="outline" class="border-dashed">{tagId}</BadgeButton>
      {/if}
    </CommandSelect>
  {/each}

  <NewTagPopover
    invalidTags={selectedTagIds}
    class={cn(buttonVariants({ variant: 'outline' }), 'size-5 rounded-full p-3')}
    onSubmit={(tagId, tagValue) => {
      const newTag = {
        id: tagId.trim(),
        value: tagValue.trim()
      }
      selectedTags = [...selectedTags, newTag]
      onChange?.(selectedTags)
    }}
  >
    <Plus class="size-4" />
  </NewTagPopover>
</div>

{#snippet tag_select_item(item: SelectItem)}
  <div class="flex flex-1 justify-center">
    <Badge {colors} category={[item.value]}></Badge>
  </div>
{/snippet}
