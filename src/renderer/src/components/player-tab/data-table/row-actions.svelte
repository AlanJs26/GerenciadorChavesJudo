<script lang="ts" module>
  type TData = unknown
</script>

<script lang="ts" generics="TData">
  import { Ellipsis, Plus } from '@lucide/svelte'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import * as Popover from '@components/ui/popover'
  import { Button } from '@/components/ui/button'
  import { Label } from '@components/ui/label'
  import { Input } from '@components/ui/input'
  import { buttonVariants } from '@/components/ui/button'
  import { cn, compareObject } from '@lib/utils'
  import type { Player, Tag } from '@lib/types/bracket-lib'
  import type { PlayerTableMeta } from '@lib/types/player-table'
  import { playersStore } from '@/states.svelte'
  import * as Select from '@components/ui/select'
  import type { Table } from '@tanstack/table-core'
  import type { Row } from '@tanstack/table-core'
  import CommandSelect from '@/components/command-select/CommandSelect.svelte'
  import type { SelectItem } from '@/components/command-select'
  import { Badge, BadgeButton } from '@/components/ui/badge'
  import { SvelteSet as Set } from 'svelte/reactivity'
  import NewTagPopover from '@/components/player-tab/data-table/new-tag-popover.svelte'

  let { row, table }: { row: Row<TData>; table: Table<TData> } = $props()
  let selectedValues: Record<string, string> = $state({})

  const player = $derived(playersStore.byContestantId[(row.original as Player).contestantId])

  let organizations = $derived(
    [
      ...new Set(
        playersStore.players[player.isMale ? 'male' : 'female'].map((player) => player.organization)
      )
    ]
      .sort((a, b) => a.localeCompare(b))
      .map((organization) => ({
        label: organization,
        value: organization
      }))
  )

  const tagitemById: Record<string, SelectItem[]> = $derived(
    playersStore.categories[player.isMale ? 'male' : 'female'].reduce(
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

  const playerInputTypes = $derived({
    name: 'string',
    isMale: ['Masc.', 'Fem.'],
    present: ['Sim', 'Não']
    // organization: organizations,
    // category: playersStore.categories[genderStore.gender]
  })
  const playerInputLabels = {
    name: 'Nome',
    isMale: 'Sexo',
    organization: 'Escola',
    present: 'Presença',
    category: 'categoria'
  }
  type Keys = keyof typeof playerInputTypes
  type InputTypeValue = (typeof playerInputTypes)[Keys]

  $effect(() => {
    Object.entries(player).forEach(([key, value]) => {
      if (!(key in playerInputTypes)) {
        return
      }

      const inputType: InputTypeValue = playerInputTypes[key]
      if (typeof value == 'boolean') {
        selectedValues[key] = value ? inputType[0] : inputType[1]
      } else {
        selectedValues[key] = value
      }
    })
  })
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        class="data-[state=open]:bg-muted flex h-8 w-8 justify-self-center p-0"
      >
        <Ellipsis />
        <span class="sr-only">Open Menu</span>
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-[160px]" align="end">
    {@render popover()}
    <DropdownMenu.Separator />
    <DropdownMenu.Item
      class={cn(buttonVariants({ variant: 'destructive' }), 'w-full cursor-pointer')}
      onclick={() => {
        ;(table.options.meta as PlayerTableMeta).removePlayer(row.original as Player)
      }}
    >
      Deletar
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

{#snippet popover()}
  <Popover.Root>
    <Popover.Trigger class={cn(buttonVariants({ variant: 'ghost' }), 'w-full')}>
      Editar
    </Popover.Trigger>
    <Popover.Content class="min-w-80">
      <div class="grid grid-cols-[auto_1fr] place-items-baseline gap-2">
        {#each Object.entries(player) as [key, value] (key)}
          {#if key in playerInputTypes}
            {@const inputType: InputTypeValue = playerInputTypes[key]}

            {#if typeof inputType == 'string'}
              <Label for={playerInputLabels[key]}>{playerInputLabels[key]}</Label>
              <Input
                id={playerInputLabels[key]}
                bind:value={selectedValues[key]}
                class="h-8"
                onfocusout={() => {
                  playersStore.setPlayer({ ...player, [key]: selectedValues[key] })
                }}
                onkeypress={(e) => {
                  if (e.key != 'Enter') {
                    return
                  }
                  ;(e.target as HTMLInputElement).blur()
                }}
              />
            {:else}
              <Label>{playerInputLabels[key]}</Label>
              <Select.Root
                type="single"
                bind:value={
                  () => selectedValues[key] ?? '',
                  (v) => {
                    if (typeof value == 'boolean') {
                      const playerValue = inputType.indexOf(v) == 0 ? true : false
                      playersStore.setPlayer({ ...player, [key]: playerValue })
                    } else {
                      playersStore.setPlayer({ ...player, [key]: v })
                    }
                    return selectedValues[key]
                  }
                }
              >
                <Select.Trigger>{selectedValues[key]}</Select.Trigger>
                <Select.Content>
                  <Select.Group>
                    {#each inputType as item (item)}
                      {#if typeof item == 'string'}
                        <Select.Item value={item} label={item}>{item}</Select.Item>
                      {/if}
                    {/each}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            {/if}
          {/if}
        {/each}

        <!-- Organizations -->
        <Label>Escola</Label>
        <CommandSelect
          class="w-full"
          bind:items={organizations}
          defaultLabel={player.organization}
          onNewItem={(value) => {
            playersStore.setPlayer({ ...player, organization: value })
          }}
          onSelect={(item) => {
            playersStore.setPlayer({ ...player, organization: item.value })
          }}
        />

        <!-- Categories -->
        <Label>Categoria</Label>
        <div class="flex flex-wrap gap-1">
          {#each Object.keys(tagitemById) as tagId (tagId)}
            {@const playerTag = player.category.find((t) => t.id == tagId)}
            <CommandSelect
              popoverClass="w-auto"
              items={tagitemById[tagId]}
              defaultLabel={playerTag?.value}
              onSelect={(item) => {
                const newTag = item.value

                playersStore.setPlayer({
                  ...player,
                  category: [...player.category, newTag]
                })
              }}
            >
              {#if playerTag}
                <BadgeButton
                  category={playerTag}
                  onClose={(e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    playersStore.setPlayer({
                      ...player,
                      category: player.category.filter((t) => t.id != playerTag.id)
                    })
                  }}
                ></BadgeButton>
              {:else}
                <BadgeButton
                  variant="outline"
                  onClose={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}>{tagId}</BadgeButton
                >
              {/if}
            </CommandSelect>
          {/each}

          <!-- TODO: Loop sobre as tags que existem, porém não fazem parte do player; mostrar como outline e ter o mesmo popup para alterar o seu valor -->

          <NewTagPopover
            invalidTags={playersStore.tagIds[player.isMale ? 'male' : 'female']}
            class={cn(buttonVariants({ variant: 'outline' }), 'size-5 rounded-full p-3')}
            onSubmit={(tagId, tagValue) => {
              playersStore.setPlayer({
                ...player,
                category: [
                  ...player.category,
                  {
                    id: tagId.trim(),
                    value: tagValue.trim()
                  }
                ]
              })
            }}
          >
            <Plus class="size-4" />
          </NewTagPopover>
        </div>
      </div>
    </Popover.Content>
  </Popover.Root>
{/snippet}

{#snippet tag_select_item(item: SelectItem)}
  <div class="flex flex-1 justify-center">
    <Badge>{item.label}</Badge>
  </div>
{/snippet}
