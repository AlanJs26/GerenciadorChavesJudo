<script lang="ts">
  import * as Command from '@components/ui/command'
  import { generateTournamentOrder, retrieveWinners } from '@lib/bracket-lib'
  import { get_match_data_for_element, installBracketUI } from '@lib/bracket-lib/rendering'
  import type { Bracket, Classification, Contestant, Match, Winners } from '@lib/types/bracket-lib'
  import type { Category } from '@lib/types/bracket-lib'
  import { cn } from '@lib/utils'
  import { computeCommandScore } from 'bits-ui'
  import { createBracket } from 'bracketry'
  import { type Mode, mode, setMode } from 'mode-watcher'
  import { toast } from 'svelte-sonner'

  import { bracketsStore, genderStore, playersStore, winnerStore } from '@/states.svelte'

  import { BracketContainer, Categories, MatchContextMenu } from '.'

  let bracketsEl: HTMLDivElement = $state()
  let bracketry: ReturnType<typeof createBracket> = null

  // ==================== State Variables ====================
  let matchContextVisible = $state(false)
  let openCommand = $state(false)
  let bracketFullscreen = $state(false)
  let commandValue = $state('')
  let newPlayerSide = $state(0)
  let previousMode: Mode = $state('system')

  let selectedMatch = $state<Bracket['matches'][2]>()

  // ==================== Derived States ====================
  let winners: Winners = $derived(
    winnerStore.get(genderStore.gender, bracketsStore.selectedCategory)
  )

  let currentBracket: Bracket = $derived(
    bracketsStore.getRaw(genderStore.gender, bracketsStore.selectedCategory) ?? {
      matches: [],
      rounds: [],
      contestants: {}
    }
  )
  let filteredPlayers = $derived(
    playersStore.players[genderStore.gender].filter((player) => player.present)
  )

  // ==================== Lifecycle Hooks ====================
  $effect(() => {
    update(bracketsStore.selectedCategory)
  })

  export function update(_s: Category): void {
    // Make sure we have a valid category selected
    if (!bracketsStore.has(genderStore.gender, bracketsStore.selectedCategory)) {
      if (bracketsStore.categories[genderStore.gender].length == 0) return

      const categories = bracketsStore.categories[genderStore.gender]
      bracketsStore.selectedCategory = categories.at(0) ?? []
      if (bracketsStore.selectedCategory.length == 0) {
        return
      }
      // console.log($state.snapshot(bracketsStore.selectedCategory))
      // console.log(bracketsStore.getRaw(genderStore.gender, bracketsStore.selectedCategory))
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
          if (match_data === undefined) {
            throw Error('Invalid match_data for Bracket', currentBracket)
          }
          selectedMatch = match_data
          matchContextVisible = true
          return
        }
        matchContextVisible = false
      },
      {
        getEntryStatusHTML: (_entryStatus, context) => {
          if (context.roundIndex != 0) return ''

          const contextMatch = currentBracket.matches.find(
            (match) => match.roundIndex === context.roundIndex && match.order === context.matchOrder
          )
          const sideIndex = contextMatch.sides
            .map((s) => s.contestantId)
            .indexOf(context.contestantId)
          const tournamentOrder = generateTournamentOrder(Math.pow(2, currentBracket.rounds.length))
          const index = tournamentOrder.at(2 * contextMatch.order + sideIndex)
          return `<p>${index}</p>`
        },
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

    const bracket = bracketsStore.getRaw(genderStore.gender, bracketsStore.selectedCategory)

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

    bracketsStore.setRaw(genderStore.gender, bracketsStore.selectedCategory, bracketry.getAllData())

    if (
      bracket.rounds.length == roundIndex ||
      bracket.matches.some(
        (m) => m.roundIndex == bracket.rounds.length - 1 && m.sides.every((s) => s.contestantId)
      )
    ) {
      if ((!left && right) || (left && !right)) {
        const winnerContestantId = left ?? right
        winnerStore.set(
          genderStore.gender,
          bracketsStore.selectedCategory,
          retrieveWinners(bracket, playersStore.byContestantId[winnerContestantId])
        )
        winnerStore.winnersByCategory = { ...winnerStore.winnersByCategory }
      }
    }
  }
</script>

<div class={cn('brackets-container', 'flex h-full w-full flex-col items-center')}>
  <Categories
    onPrint={() => {
      bracketFullscreen = true
      previousMode = mode.current
      setMode('light')
      window.api.printPDF().then((result) => {
        setMode(previousMode)
        if (result.status == false) {
          console.warn(result.error)
        }
        bracketFullscreen = false
      })
    }}
  />

  <MatchContextMenu
    {selectedMatch}
    class="min-h-0 w-full flex-1"
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
    <BracketContainer {bracketFullscreen} bind:bracketsEl />
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
      {#each filteredPlayers as player (player.contestantId)}
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
  @reference '../../assets/main.css';
  .brackets-container {
    @apply bg-background;
    grid-area: brackets;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
</style>
