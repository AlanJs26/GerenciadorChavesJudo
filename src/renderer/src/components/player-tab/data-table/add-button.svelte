<script lang="ts" module>
  type TData = unknown
</script>

<script lang="ts" generics="TData">
  import type { SelectItem } from '@components/command-select'
  import CommandSelect from '@components/command-select/CommandSelect.svelte'
  import NewTagPopover from '@components/player-tab/data-table/new-tag-popover.svelte'
  import { Badge, BadgeButton } from '@components/ui/badge'
  import { Button, buttonVariants } from '@components/ui/button'
  import * as Dialog from '@components/ui/dialog'
  import { Input } from '@components/ui/input'
  import { Label } from '@components/ui/label'
  import { ScrollArea } from '@components/ui/scroll-area'
  import * as Select from '@components/ui/select'
  import { isGendered } from '@lib/bracket-lib'
  import type { Gendered, Tag } from '@lib/types/bracket-lib'
  import type { PlayerTableMeta } from '@lib/types/player-table'
  import { cn, compareObject } from '@lib/utils'
  import { Plus } from '@lucide/svelte'
  import type { Table } from '@tanstack/table-core'
  import type { WithoutChildren } from 'bits-ui'
  import type { HTMLAttributes } from 'svelte/elements'
  import { SvelteSet as Set } from 'svelte/reactivity'

  import { playersStore } from '@/states.svelte'

  type Props = HTMLAttributes<HTMLDivElement> & {
    table: Table<TData>
  }
  let { table, class: className, ...restProps }: WithoutChildren<Props> = $props()

  let selectedValues: Record<string, string> = $state({})
  let dialogOpen = $state(false)
  let selectedTags: Tag[] = $state([])
  let selectedOrganization = $state('')

  // TODO: Make a new category selection for each Tag
  const tagitemById: Record<string, SelectItem[]> = $derived(
    playersStore.categories[selectedValues['isMale'] == 'Masc.' ? 'male' : 'female'].reduce(
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

  let organizations = $derived(
    [
      ...new Set(
        playersStore.players[selectedValues['isMale'] == 'Masc.' ? 'male' : 'female'].map(
          (player) => player.organization
        )
      )
    ]
      .sort((a, b) => a.localeCompare(b))
      .map((organization) => ({
        label: organization,
        value: organization
      }))
  )

  const playerInputLabels = {
    name: 'Nome',
    isMale: 'Sexo',
    category: 'categoria',
    organization: 'Escola',
    present: 'Presença'
  }

  const playerInputTypes = $derived({
    name: 'string',
    isMale: ['Masc.', 'Fem.'],
    present: ['Sim', 'Não']
  })

  const allFilled = $derived(
    Object.entries(playerInputTypes).every(([key, value]) => {
      if (typeof value == 'string') {
        return selectedValues[key] !== undefined && selectedValues[key] !== ''
      } else {
        return selectedValues[key] !== undefined
      }
    })
  )

  function reset() {
    selectedValues = {}
  }
</script>

<div class={cn('flex items-center', className)} {...restProps}>
  <Dialog.Root onOpenChange={(open) => (open ? null : reset())} bind:open={dialogOpen}>
    <Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
      <Plus class="mr-2" />
      Adicionar
    </Dialog.Trigger>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Novo Participante</Dialog.Title>
        <Dialog.Description>
          Preencha os campos abaixo com as informações do participante. Quando terminar, clique em
          "Salvar.
        </Dialog.Description>
      </Dialog.Header>

      {@render form()}

      <Dialog.Footer>
        <Button
          type="submit"
          disabled={!allFilled}
          onclick={() => {
            ;(table.options.meta as PlayerTableMeta).addPlayer({
              name: selectedValues.name,
              isMale: selectedValues.isMale === 'Masc.',
              category: selectedTags,
              organization: selectedOrganization,
              present: selectedValues.present === 'Sim'
            })
            reset()
            dialogOpen = false
          }}>Salvar</Button
        >
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</div>

{#snippet form()}
  <div class="grid grid-cols-[auto_1fr] place-items-baseline items-center gap-2">
    {#each Object.entries(playerInputTypes) as [key, inputType] (key)}
      <!-- {@const inputType: InputTypeValue = playerInputTypes[key]} -->

      {#if typeof inputType == 'string'}
        <Label for="width">{playerInputLabels[key]}</Label>
        <Input id="width" bind:value={selectedValues[key]} class="h-8" />
      {:else if isGendered(inputType)}
        {@const genderText = selectedValues['isMale']}
        {@const gender = ['male', 'female'].includes(genderText) ? genderText : ''}
        <Label for="width">{playerInputLabels[key]}</Label>
        {@render select((inputType as Gendered<unknown>)[gender], key)}
      {:else}
        <Label for="width">{playerInputLabels[key]}</Label>
        {@render select(inputType, key)}
      {/if}
    {/each}

    <!-- Organizations -->
    <Label>Escola</Label>
    <CommandSelect
      class="w-full"
      bind:items={organizations}
      bind:value={selectedOrganization}
      itemFactory={(inputValue) => ({
        label: inputValue,
        value: inputValue
      })}
    />

    <!-- Categories -->
    <Label>Categoria</Label>
    <div class="flex flex-wrap gap-1">
      {#each availableTagIds as tagId (tagId)}
        {@const playerTag = selectedTags.find((t) => t.id == tagId)}
        <CommandSelect
          popoverClass="w-auto"
          items={tagitemById[tagId]}
          defaultLabel={playerTag?.value}
          onSelect={(item) => {
            const newTag = item.value

            selectedTags = [...selectedTags.filter((t) => t.id != item.id), newTag]
          }}
        >
          {#if playerTag}
            <BadgeButton
              category={playerTag}
              onClose={(e) => {
                e.preventDefault()
                e.stopPropagation()

                selectedTags = [...selectedTags.filter((t) => t.id != playerTag.id)]
              }}
            ></BadgeButton>
          {:else}
            <BadgeButton variant="outline" }>{tagId}</BadgeButton>
          {/if}
        </CommandSelect>
      {/each}

      <!-- TODO: Loop sobre as tags que existem, porém não fazem parte do player; mostrar como outline e ter o mesmo popup para alterar o seu valor -->

      <NewTagPopover
        invalidTags={selectedTagIds}
        class={cn(buttonVariants({ variant: 'outline' }), 'size-5 rounded-full p-3')}
        onSubmit={(tagId, tagValue) => {
          const newTag = {
            id: tagId.trim(),
            value: tagValue.trim()
          }
          selectedTags = [...selectedTags, newTag]
        }}
      >
        <Plus class="size-4" />
      </NewTagPopover>
    </div>
  </div>
{/snippet}

{#snippet select(inputType: string[], key: string)}
  <Select.Root
    type="single"
    bind:value={
      () => selectedValues[key] ?? '',
      (v) => {
        selectedValues[key] = v
        return v
      }
    }
  >
    <Select.Trigger>{selectedValues[key]}</Select.Trigger>
    <Select.Content>
      <Select.Group>
        <ScrollArea class="flex max-h-[30vh] flex-col" type="auto">
          {#each inputType as item (item)}
            {#if typeof item == 'string'}
              <Select.Item value={item} label={item}>{item}</Select.Item>
            {/if}
          {/each}
        </ScrollArea>
      </Select.Group>
    </Select.Content>
  </Select.Root>
{/snippet}

{#snippet tag_select_item(item: SelectItem)}
  <div class="flex flex-1 justify-center">
    <Badge>{item.label}</Badge>
  </div>
{/snippet}
