<script lang="ts" module>
  type TData = unknown
</script>

<script lang="ts" generics="TData">
  import { Plus } from '@lucide/svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import type { Table } from '@tanstack/table-core'
  import type { WithoutChildren } from 'bits-ui'
  import { cn } from '@lib/utils'
  import type { Gendered } from '@lib/types/bracket-lib'
  import { isGendered } from '@lib/bracket-lib'
  import { Button, buttonVariants } from '@/components/ui/button'
  import * as Dialog from '@components/ui/dialog'
  import { Label } from '@components/ui/label'
  import { Input } from '@components/ui/input'
  import { playersStore } from '@/states.svelte'
  import type { PlayerTableMeta } from '@lib/types/player-table'
  import * as Select from '@components/ui/select'
  import { ScrollArea } from '@components/ui/scroll-area'

  type Props = HTMLAttributes<HTMLDivElement> & {
    table: Table<TData>
  }
  let { table, class: className, ...restProps }: WithoutChildren<Props> = $props()

  let selectedValues: Record<string, string> = $state({})
  let dialogOpen = $state(false)

  // TODO: Make a new category selection for each Tag
  const categories = $derived(playersStore.categories)
  const organizations = $derived(
    Array.from(new Set(playersStore.players.map((player) => player.organization))).sort((a, b) =>
      a.localeCompare(b)
    )
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
    category: categories,
    organization: organizations,
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
              category: selectedValues.category,
              organization: selectedValues.organization,
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
  {#each Object.entries(playerInputTypes) as [key, inputType] (key)}
    <!-- {@const inputType: InputTypeValue = playerInputTypes[key]} -->

    {#if typeof inputType == 'string'}
      <div class="grid grid-cols-3 items-center gap-4">
        <Label for="width">{playerInputLabels[key]}</Label>
        <Input id="width" bind:value={selectedValues[key]} class="col-span-2 h-8" />
      </div>
    {:else if isGendered(inputType)}
      {@const genderText = selectedValues['isMale']}
      {@const gender = ['male', 'female'].includes(genderText) ? genderText : ''}
      <div class="grid grid-cols-3 items-center gap-4">
        <Label for="width">{playerInputLabels[key]}</Label>
        {@render select((inputType as Gendered<unknown>)[gender], key)}
      </div>
    {:else}
      <div class="grid grid-cols-3 items-center gap-4">
        <Label for="width">{playerInputLabels[key]}</Label>
        {@render select(inputType, key)}
      </div>
    {/if}
  {/each}
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
    <Select.Trigger class="w-[180px]">{selectedValues[key]}</Select.Trigger>
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
