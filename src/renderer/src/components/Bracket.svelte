<script lang="ts">
  import type { BracketCollection, Bracket, Player, Match } from '@lib/types/bracket-lib'
  import * as ContextMenu from '@components/ui/context-menu'
  import * as Command from '@components/ui/command'
  import { computeCommandScore } from 'bits-ui'
  import { createBracket } from 'bracketry'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Badge } from '@components/ui/badge'
  import { Plus, Trash2 } from '@lucide/svelte'
  import { installBracketUI, get_match_data_for_element } from '../bracket-lib/rendering'
  import { buttonVariants } from './ui/button'
  import { cn } from '@lib/utils'
  import { playersStore } from '@/states/players.svelte'

  let {
    brackets,
    isMale,
    category: currentCategory
  }: {
    brackets: BracketCollection
    category: string
    isMale: boolean
  } = $props()

  let bracketsEl: HTMLDivElement
  let bracketry: ReturnType<typeof createBracket> = null

  let filteredPlayers = $derived(
    playersStore.players.filter((player) => player.isMale == isMale && player.present)
  )
  let playerNameByContestantId = $derived(
    playersStore.players.reduce((acc, player) => {
      if (player.contestantId) {
        acc[player.contestantId] = player.name
      }
      return acc
    }, {})
  )

  let openContext = $state(false)
  let openCommand = $state(false)
  let commandValue = $state('')
  let selectedMatch = $state<Bracket['matches'][0]>()
  let isBracketVisible = $state(false)

  let gender: 'male' | 'female' = $derived(isMale ? 'male' : 'female')
  let selectedBrackets = $derived(
    filterObject<Record<string, Bracket>>(brackets[gender], (_key, v) => v.matches.length > 0)
  )

  let currentBracket = $derived(
    brackets[gender][currentCategory] ?? {
      matches: [],
      rounds: [],
      contestants: {}
    }
  )

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
      if ((e.target as HTMLDivElement).closest('.match-body')) {
        const match_data = get_match_data_for_element(e.target as Element, currentBracket)
        selectedMatch = match_data
        openContext = true
        return
      }
      openContext = false
    })
  }

  // ==================== Helper Functions ====================
  function filterObject<T>(obj: T, predicate: (key: string, value: T[keyof T]) => boolean): T {
    return Object.keys(obj)
      .filter((key) => predicate(key, obj[key]))
      .reduce((res, key) => ((res[key] = obj[key]), res), {} as T)
  }
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
      playerNameByContestantId?.[commandValue] ?? '',
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

    const updatedSides: Partial<(typeof match.sides)[0]>[] = [...(match?.sides ?? [{}, {}])]

    if (left !== undefined) {
      updatedSides[0] = left === null ? {} : { contestantId: left }
    }
    if (right !== undefined) {
      updatedSides[1] = right === null ? {} : { contestantId: right }
    }

    bracketry.applyMatchesUpdates([
      {
        roundIndex,
        order,
        sides: updatedSides
      }
    ])

    brackets[gender][currentCategory] = bracketry.getAllData()
  }
</script>

<div class={cn('brackets-container', 'h-full w-full')}>
  <div class="categories p-2">
    <ScrollArea contentclass="!flex flex-wrap justify-center gap-1">
      {#each Object.entries(selectedBrackets) as [category]}
        <Badge
          variant={category == currentCategory ? 'default' : 'outline'}
          onclick={(): void => {
            currentCategory = category
          }}
          class="cursor-pointer border-zinc-500"
          oncontextmenu={(e: MouseEvent): void => {
            e.preventDefault()
            if (e.buttons == 2) {
              delete brackets[gender][category]
            }
          }}
        >
          {category}
        </Badge>
      {/each}
    </ScrollArea>
    <button class="ml-3"><Plus /></button>
  </div>

  {#snippet bracketsSnippet()}
    <div class={'brackets ' + (!isBracketVisible ? 'hidden' : '')} bind:this={bracketsEl}></div>
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

{#snippet contextmenu(trigger)}
  <ContextMenu.Root bind:open={() => openContext, (open) => (!open ? (openContext = open) : null)}>
    <ContextMenu.Trigger class="h-full w-full">
      {@render trigger()}
    </ContextMenu.Trigger>

    <ContextMenu.Content class="flex w-64 flex-col items-center" updatePositionStrategy="always">
      <span class="font-bold">Escolha um Vencedor</span>
      <ContextMenu.Separator />
      <ContextMenu.Group class="flex w-full flex-row">
        {#each selectedMatch.sides.filter((s) => s?.contestantId) as { contestantId }}
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
            {playerNameByContestantId?.[contestantId] ?? ''}</ContextMenu.Item
          >
        {/each}
      </ContextMenu.Group>

      <ContextMenu.Separator class="w-full" />

      {#if selectedMatch?.sides?.filter((s) => s?.contestantId).length < 2}
        <ContextMenu.Item class="w-full" onclick={() => (openCommand = true)}>
          <Plus class="ml-2 pr-2" />
          Adicionar Jogador
        </ContextMenu.Item>
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
              }}>{playerNameByContestantId?.[contestantId] ?? ''}</ContextMenu.Item
            >
          {/each}
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/snippet}

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
    display: flex;
    flex-direction: column;
    align-items: center;

    & .brackets {
      min-width: 0;
      min-height: 0;
      height: 100%;
      width: 100%;
    }
  }
</style>
