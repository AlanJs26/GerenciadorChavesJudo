<script lang="ts" module>
  type TData = unknown
</script>

<script lang="ts" generics="TData">
  import { Ellipsis } from '@lucide/svelte'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import * as Popover from '@components/ui/popover'
  import { Button } from '@/components/ui/button'
  import { Label } from '@components/ui/label'
  import { Input } from '@components/ui/input'
  import { buttonVariants } from '@/components/ui/button'
  import { cn } from '@lib/utils'
  import type { Player } from '@lib/types/bracket-lib'
  import type { PlayerTableMeta } from '@lib/types/player-table'
  import { playersStore } from '@/states.svelte'
  import * as Select from '@components/ui/select'
  import type { Table } from '@tanstack/table-core'
  import type { Row } from '@tanstack/table-core'

  let { row, table }: { row: Row<TData>; table: Table<TData> } = $props()
  const player = $derived(row.original as Player)
  let selectedValues: Record<string, string> = $state({})

  // TODO: Make a new category selection for each Tag
  const categories = $derived(
    Array.from(new Set(playersStore.players.map((player) => player.category))).sort((a, b) =>
      a.localeCompare(b)
    )
  )
  const organizations = $derived(
    Array.from(new Set(playersStore.players.map((player) => player.organization))).sort((a, b) =>
      a.localeCompare(b)
    )
  )

  const playerInputTypes = $derived({
    name: 'string',
    isMale: ['Masc.', 'Fem.'],
    category: categories,
    organization: organizations,
    present: ['Sim', 'Não']
  })
  const playerInputLabels = {
    name: 'Nome',
    isMale: 'Sexo',
    category: 'categoria',
    organization: 'Escola',
    present: 'Presença'
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
    <Popover.Content class="w-80">
      <div class="grid gap-4">
        <div class="grid gap-2">
          {#each Object.entries(player) as [key, value]}
            {#if key in playerInputTypes}
              {@const inputType: InputTypeValue = playerInputTypes[key]}

              {#if typeof inputType == 'string'}
                <div class="grid grid-cols-3 items-center gap-4">
                  <Label for="width">{playerInputLabels[key]}</Label>
                  <Input
                    id="width"
                    bind:value={selectedValues[key]}
                    class="col-span-2 h-8"
                    onfocusout={() => {
                      player[key] = selectedValues[key]
                    }}
                    onkeypress={(e) => {
                      if (e.key != 'Enter') {
                        return
                      }
                      ;(e.target as HTMLInputElement).blur()
                    }}
                  />
                </div>
              {:else}
                <div class="grid grid-cols-3 items-center gap-4">
                  <Label for="width">{playerInputLabels[key]}</Label>
                  <Select.Root
                    type="single"
                    bind:value={
                      () => selectedValues[key] ?? '',
                      (v) => {
                        if (typeof value == 'boolean') {
                          const playerValue = inputType.indexOf(v) == 0 ? true : false
                          player[key] = playerValue
                        } else {
                          player[key] = v
                        }
                        return selectedValues[key]
                      }
                    }
                  >
                    <Select.Trigger class="w-[180px]">{selectedValues[key]}</Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        {#each inputType as item}
                          {#if typeof item == 'string'}
                            <Select.Item value={item} label={item}>{item}</Select.Item>
                          {/if}
                        {/each}
                      </Select.Group>
                    </Select.Content>
                  </Select.Root>
                </div>
              {/if}
            {/if}
          {/each}
        </div>
      </div>
    </Popover.Content>
  </Popover.Root>
{/snippet}
