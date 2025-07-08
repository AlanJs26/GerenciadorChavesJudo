<script lang="ts">
  import type { Bracket, Classification, Contestant, Match, Winners } from '@lib/types/bracket-lib'

  import { Button } from '@/components/ui/button'
  import * as Command from '@components/ui/command'
  import { cn } from '@lib/utils'
  import { computeCommandScore } from 'bits-ui'
  import { toast } from 'svelte-sonner'

  import { BracketContainer, Categories, MatchContextMenu } from '.'
  import { bracketsStore, playersStore, winnerStore } from '@/states.svelte'
  import { retrieveWinners } from '@lib/bracket-lib'
  import { get_match_data_for_element, installBracketUI } from '@lib/bracket-lib/rendering'
  import { createBracket } from 'bracketry'

  let {
    isMale
  }: {
    isMale: boolean
  } = $props()

  let bracketsEl: HTMLDivElement = $state()
  let bracketry: ReturnType<typeof createBracket> = null

  // ==================== State Variables ====================
  let currentCategory = $state('')
  let matchContextVisible = $state(false)
  let openCommand = $state(false)
  let bracketFullscreen = $state(false)
  let commandValue = $state('')
  let newPlayerSide = $state(0)

  let selectedMatch = $state<Bracket['matches'][2]>()

  // ==================== Derived States ====================
  let winners: Winners = $derived(winnerStore.winnersByCategory[currentCategory])
  let gender: 'male' | 'female' = $derived(isMale ? 'male' : 'female')
  let selectedBrackets: Record<string, Bracket> = $derived(bracketsStore.brackets[gender])

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

    if (bracketry) {
      bracketry.replaceData(currentBracket)
      return
    }

    const htmlByClassification = (classification: Classification) => {
      switch (classification) {
        case 1:
          return `<span class='match-winner first'>🏆 1º Lugar</span>`
        case 2:
          return `<span class='match-winner'>🥈 2º Lugar</span>`
        case 3:
          return `<span class='match-winner'>🥉 3º Lugar</span>`
      }
    }

    bracketry = installBracketUI(
      bracketsEl,
      currentBracket,
      (e: MouseEvent) => {
        const match_data = get_match_data_for_element(e.target as Element, currentBracket)
        if (
          (e.target as HTMLDivElement).closest('.match-body') ||
          ((e.target as HTMLDivElement).closest('.match-wrapper') && match_data.roundIndex == 0)
        ) {
          selectedMatch = match_data
          matchContextVisible = true
          return
        }
        matchContextVisible = false
      },
      {
        getMatchTopHTML: (match: Match) => {
          const { roundIndex, order } = match
          const winnerInfo = winners?.matches?.[`${roundIndex}:${order}`]
          if (!winnerInfo?.top) return ''

          return htmlByClassification(winnerInfo.top)
        },
        getMatchBottomHTML: (match: Match) => {
          const { roundIndex, order } = match
          const winnerInfo = winners?.matches?.[`${roundIndex}:${order}`]
          if (!winnerInfo?.bottom) return ''

          return htmlByClassification(winnerInfo.bottom)
        }
      }
    )
  }

  // ==================== Helper Functions ====================
  function customCommandFilter(
    commandValue: string,
    search: string,
    commandKeywords?: string[]
  ): number {
    const score = computeCommandScore(
      playersStore.byContestantId?.[commandValue]?.name ?? '',
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
    const match = currentBracket.matches.find(
      (match) => match.roundIndex === roundIndex && match.order === order
    )
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

      const player = playersStore.byContestantId?.[contestantId]
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

    if (
      bracket.rounds.length == roundIndex ||
      bracket.matches.some(
        (m) => m.roundIndex == bracket.rounds.length - 1 && m.sides.every((s) => s.contestantId)
      )
    ) {
      if ((!left && right) || (left && !right)) {
        const winnerContestantId = left ?? right
        winnerStore.winnersByCategory[currentCategory] = retrieveWinners(
          bracket,
          playersStore.byContestantId[winnerContestantId]
        )
        winnerStore.winnersByCategory = { ...winnerStore.winnersByCategory }
      }
    }
  }
</script>

<Button
  variant="default"
  class="fixed bottom-2 right-2 z-10"
  onclick={() => {
    bracketFullscreen = true
    window.api.printPDF().then((result) => {
      if (result.status == false) {
        console.warn(result.error)
      }
      bracketFullscreen = false
    })
  }}>Print</Button
>

<div class={cn('brackets-container', 'flex h-full w-full flex-col items-center')}>
  <Categories {isMale} bind:currentCategory />

  <MatchContextMenu
    {selectedMatch}
    bind:visible={matchContextVisible}
    onSubmitWinner={(contestantId, selectedMatch) => {
      const { roundIndex, order } = selectedMatch
      const nextOrder = (order - (order % 2)) / 2
      updateMatchSides(roundIndex + 1, nextOrder, {
        left: order % 2 == 0 ? contestantId : undefined,
        right: order % 2 == 0 ? undefined : contestantId
      })
    }}
    onSubmitAdd={(side) => {
      openCommand = true
      newPlayerSide = side
    }}
    onSubmitDelete={(contestantId, selectedMatch) => {
      const { roundIndex, order, sides } = selectedMatch
      updateMatchSides(roundIndex, order, {
        left: sides?.[0]?.contestantId == contestantId ? null : undefined,
        right: sides?.[1]?.contestantId == contestantId ? null : undefined
      })
    }}
  >
    <BracketContainer {bracketFullscreen} {currentCategory} bind:bracketsEl />
  </MatchContextMenu>
</div>

<!-- 
MARK: New Player Dialog
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
  .brackets-container {
    grid-area: brackets;
    background-color: #ffffff;
    min-height: 0;
    min-width: 0;
  }
</style>
