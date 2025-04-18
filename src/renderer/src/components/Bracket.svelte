<script lang="ts">
  import type { Bracket, Contestant, Match } from '@lib/types/bracket-lib'
  import * as ContextMenu from '@components/ui/context-menu'
  import * as Command from '@components/ui/command'
  import { computeCommandScore } from 'bits-ui'
  import { createBracket } from 'bracketry'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Badge } from '@components/ui/badge'
  import { Plus, Trash2 } from '@lucide/svelte'
  import { installBracketUI, get_match_data_for_element } from '../bracket-lib/rendering'
  import { Button, buttonVariants } from '@components/ui/button'
  import { cn } from '@lib/utils'
  import { playersStore, bracketsStore } from '@/states.svelte'
  import { Label } from '@components/ui/label'
  import { Input } from '@components/ui/input'
  import * as Popover from '@components/ui/popover'
  import type { Snippet } from 'svelte'
  import { toast } from 'svelte-sonner'
  import * as Select from '@components/ui/select'
  import { roundsBySize } from '@/bracket-lib'

  let {
    isMale,
    category: currentCategory
  }: {
    category: string
    isMale: boolean
  } = $props()

  let bracketsEl: HTMLDivElement
  let bracketry: ReturnType<typeof createBracket> = null

  const validBracketSizes = [2, 4, 8, 16, 32].map((size) => size.toString())

  // ==================== State Variables ====================
  let openContext = $state(false)
  let openCommand = $state(false)
  let openPopover = $state(false)
  let bracketFullscreen = $state(false)
  let openDeletePopover: Record<string, boolean> = $state({})

  let popoverInput = $state('')
  let commandValue = $state('')
  let newPlayerSide = $state(0)
  let popoverSelectedValue = $state(validBracketSizes[0])
  let selectedMatch = $state<Bracket['matches'][2]>()
  let isBracketVisible = $state(false)

  // ==================== Derived States ====================
  let gender: 'male' | 'female' = $derived(isMale ? 'male' : 'female')
  let selectedBrackets: Record<string, Bracket> = $derived(bracketsStore.brackets[gender])

  const allPopoverFilled = $derived(popoverInput != '')

  let currentBracket: Bracket = $derived(
    bracketsStore.brackets[gender][currentCategory] ?? {
      matches: [],
      rounds: [],
      contestants: {}
    }
  )

  let filteredPlayers = $derived(
    playersStore.players.filter((player) => player.isMale == isMale && player.present)
  )
  let playerNameByContestantId: Record<string, { name: string; organization: string }> = $derived(
    playersStore.players.reduce((acc, player) => {
      if (player.contestantId) {
        acc[player.contestantId] = {
          name: player.name,
          organization: player.organization
        }
      }
      return acc
    }, {})
  )

  // ==================== Lifecycle Hooks ====================
  $effect(() => {
    currentCategory = currentCategory
    update()
  })
  export function update(): void {
    // Make sure we have a valid category selected
    if (!currentCategory || !(currentCategory in selectedBrackets)) {
      const availableCategories = Object.keys(selectedBrackets)
      currentCategory = availableCategories.length > 0 ? availableCategories[0] : ''
      if (!currentCategory) {
        return
      }
    }

    isBracketVisible = true

    if (bracketry) {
      bracketry.replaceData(currentBracket)
      return
    }

    bracketry = installBracketUI(bracketsEl, currentBracket, (e: MouseEvent) => {
      const match_data = get_match_data_for_element(e.target as Element, currentBracket)
      if (
        (e.target as HTMLDivElement).closest('.match-body') ||
        ((e.target as HTMLDivElement).closest('.match-wrapper') && match_data.roundIndex == 0)
      ) {
        selectedMatch = match_data
        openContext = true
        return
      }
      openContext = false
    })
  }

  // ==================== Helper Functions ====================

  function findMatch(roundIndex: number, order: number): Match | undefined {
    return currentBracket.matches.find(
      (match) => match.roundIndex === roundIndex && match.order === order
    )
  }

  function customCommandFilter(
    commandValue: string,
    search: string,
    commandKeywords?: string[]
  ): number {
    const score = computeCommandScore(
      playerNameByContestantId?.[commandValue]?.name ?? '',
      search,
      commandKeywords
    )
    return score
  }

  function updateMatchSides(
    roundIndex: number,
    order: number,
    { left, right }: { left?: string | null; right?: string | null }
  ): void {
    const match = findMatch(roundIndex, order)
    type Side = {
      contestantId?: string
    }

    const updatedSides: Side[] = match?.sides ?? [{}, {}]
    const newContestants: Record<string, Contestant> = {}

    const updateSide = (side: number, contestantId: string | null | undefined) => {
      switch (contestantId) {
        case undefined:
          return
        case null:
          updatedSides[side] = {}
          return
        default:
          updatedSides[side] = { contestantId }
      }

      const player = playerNameByContestantId?.[contestantId]
      if (!player) {
        toast.error(`Player not found`)
        return
      }

      newContestants[contestantId] = {
        players: [
          {
            title: player.name,
            nationality: player.organization
          }
        ]
      }
    }

    updateSide(0, left)
    updateSide(1, right)

    const bracket = bracketsStore.brackets[gender][currentCategory]

    bracket.contestants = {
      ...bracket.contestants,
      ...newContestants
    }
    bracketry.replaceData(bracket)
    bracketry.applyMatchesUpdates([
      {
        roundIndex,
        order,
        sides: updatedSides
      }
    ])

    bracketsStore.brackets[gender][currentCategory] = bracketry.getAllData()
  }
</script>

<!-- 
MARK: Categories
-->

<Button
  variant="default"
  class="fixed bottom-2 right-2 z-10"
  onclick={() => {
    bracketFullscreen = true
    window.api.printPDF().then((res) => {
      console.log(res)
      bracketFullscreen = false
    })
  }}>Print</Button
>

<div class={cn('brackets-container', 'flex h-full w-full flex-col items-center')}>
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

    {@render new_category_button()}
  </div>

  <!-- 
MARK: Bracketry
 -->
  {#snippet bracketsSnippet()}
    <div
      class={cn(
        'brackets flex h-full w-full',
        !isBracketVisible ? 'hidden' : '',
        bracketFullscreen ? 'fullscreen' : ''
      )}
      bind:this={bracketsEl}
    ></div>
    {#if !isBracketVisible}
      <div class="flex h-full w-full items-center justify-center text-center">
        <span>
          Nenhuma chave foi gerada!
          <br />
          <br />
          Clique no botão "Gerar Chaves" parar criar chaves automaticamente
          <br />
          ou adicione uma Chave manualmente através do botão "+"
        </span>
      </div>
    {/if}
  {/snippet}
  {@render contextmenu(bracketsSnippet)}
</div>

<!-- 
MARK: Delete Category
 -->
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

<!-- 
MARK: New Category
 -->
{#snippet new_category_button()}
  <Popover.Root
    bind:open={openPopover}
    onOpenChange={() => {
      popoverInput = ''
      popoverSelectedValue = validBracketSizes[2]
    }}
  >
    <Popover.Trigger class={buttonVariants({ variant: 'ghost' })}>
      <Plus />
    </Popover.Trigger>
    <Popover.Content class="w-[400px]">
      <div class="grid gap-4">
        <div class="space-y-2">
          <h4 class="font-medium leading-none">Nova Categoria</h4>
          <p class="text-sm text-muted-foreground">
            Insira o nome da nova categoria e clique em "Criar" para adicionar uma nova chave.
          </p>
        </div>
        <div class="grid grid-cols-3 items-center">
          <Label for="width">Categoria</Label>
          <Input id="width" bind:value={popoverInput} class="col-span-2 h-8" />
        </div>
        <div class="grid grid-cols-3 items-center">
          <Label for="width">Nº Competidores</Label>
          <Select.Root type="single" bind:value={popoverSelectedValue}>
            <Select.Trigger class="col-span-2 h-8">{popoverSelectedValue}</Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each validBracketSizes as size}
                  <Select.Item value={size} label={size}>{size}</Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        <div class="grid grid-cols-4">
          <Button
            class="col-start-4"
            variant="default"
            disabled={!allPopoverFilled}
            onclick={() => {
              if (popoverInput in bracketsStore.brackets[gender]) {
                toast.error('Essa categoria já existe!')
                return
              }

              bracketsStore.brackets[gender][popoverInput] = {
                matches: [],
                rounds: roundsBySize(+popoverSelectedValue).map((size) => ({
                  name: size.toString()
                })),
                contestants: {}
              }

              openPopover = false
              currentCategory = popoverInput
            }}>Criar</Button
          >
        </div>
      </div>
    </Popover.Content>
  </Popover.Root>
{/snippet}

<!-- 
MARK: Context Menu
 -->
{#snippet contextmenu(trigger: Snippet)}
  <ContextMenu.Root bind:open={() => openContext, (open) => (!open ? (openContext = open) : null)}>
    <ContextMenu.Trigger class="h-full w-full">
      {@render trigger()}
    </ContextMenu.Trigger>

    <ContextMenu.Content class="flex w-64 flex-col items-center" updatePositionStrategy="always">
      {@const sides = selectedMatch.sides}
      {@const filteredSides = selectedMatch.sides.filter((s) => s?.contestantId)}
      {#if filteredSides.length > 0}
        <span class="font-bold">Escolha um Vencedor</span>
      {/if}
      <ContextMenu.Group class="flex w-full flex-row">
        {#each filteredSides as { contestantId }}
          <ContextMenu.Item
            class="flex-1 justify-center"
            onclick={() => {
              const { roundIndex, order } = selectedMatch
              const nextOrder = (order - (order % 2)) / 2
              updateMatchSides(roundIndex + 1, nextOrder, {
                left: order % 2 == 0 ? contestantId : undefined,
                right: order % 2 == 0 ? undefined : contestantId
              })
            }}
          >
            {playerNameByContestantId?.[contestantId].name ?? ''}</ContextMenu.Item
          >
        {/each}
      </ContextMenu.Group>
      <ContextMenu.Separator class="mb-3 w-full" />

      {#if filteredSides.length < 2}
        <span class="font-bold">Adicionar Jogador</span>
        <div class="grid w-full grid-cols-2">
          {#each [0, 1] as side}
            {#if !sides?.[side]?.contestantId}
              <ContextMenu.Item
                class={`col-start-${side + 1} flex w-full justify-center`}
                onclick={() => {
                  openCommand = true
                  newPlayerSide = side
                }}
              >
                <Plus class="ml-2 pr-2" />
              </ContextMenu.Item>
            {/if}
          {/each}
        </div>
        <ContextMenu.Separator class="mb-3 w-full" />
      {/if}

      <ContextMenu.Sub>
        <ContextMenu.SubTrigger
          class={buttonVariants({ variant: 'destructive' }) +
            ' w-full data-[highlighted]:bg-red-500 data-[open]:bg-red-500  data-[state=open]:bg-red-500'}
        >
          <Trash2 class="pr-2" />
          Apagar</ContextMenu.SubTrigger
        >
        <ContextMenu.SubContent class="w-48">
          {#each selectedMatch.sides.filter((s) => s?.contestantId) as { contestantId }}
            <ContextMenu.Item
              onclick={() => {
                const { roundIndex, order, sides } = selectedMatch
                updateMatchSides(roundIndex, order, {
                  left: sides?.[0]?.contestantId == contestantId ? null : undefined,
                  right: sides?.[1]?.contestantId == contestantId ? null : undefined
                })
              }}>{playerNameByContestantId?.[contestantId].name ?? ''}</ContextMenu.Item
            >
          {/each}
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/snippet}

<!-- 
MARK: New Player
 -->
<Command.Dialog bind:open={openCommand} filter={customCommandFilter} bind:value={commandValue}>
  <Command.Input
    placeholder="Digite aqui..."
    onkeydown={(e: KeyboardEvent) => {
      if (e.code != 'Enter') {
        return
      }
      openCommand = false
    }}
  />
  <Command.List>
    <Command.Empty>Não encontrado.</Command.Empty>
    <Command.Group heading="Participantes">
      {#each filteredPlayers as player}
        <Command.Item
          value={player.contestantId}
          onclick={() => {
            openCommand = false
            const { roundIndex, order } = selectedMatch
            updateMatchSides(roundIndex, order, {
              left: newPlayerSide == 0 ? player.contestantId : undefined,
              right: newPlayerSide == 0 ? undefined : player.contestantId
            })
          }}
        >
          {player.name}
          <Command.CommandShortcut>
            {player.organization}
          </Command.CommandShortcut>
        </Command.Item>
      {/each}
    </Command.Group>
  </Command.List>
</Command.Dialog>

<style>
  .categories {
    display: flex;
    align-self: center;
    gap: 10px;
  }
  .brackets-container {
    grid-area: brackets;
    background-color: #ffffff;
    min-height: 0;
    min-width: 0;

    & .brackets {
      min-width: 0;
      min-height: 0;
    }
  }
  .fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    background: white;
  }
</style>
