<script lang="ts">
  import CommandSelect from '@components/command-select/CommandSelect.svelte'
  import * as Command from '@components/ui/command'
  import type { Contestant } from '@lib/types/bracket-lib'
  import { cn, filterObject, mapObject } from '@lib/utils'
  import { ChevronDown, ChevronUp, Search, X } from '@lucide/svelte'
  import createFuzzySearch from '@nozbe/microfuzz'

  import type { SelectItem } from '@/components/command-select'
  import Button from '@/components/ui/button/button.svelte'
  import { bracketsStore, genderStore, playersStore, winnerStore } from '@/states.svelte.ts'
  const classifications: string[] = [
    [1, '🏆'],
    [2, '🥈'],
    [3, '🥉'],
    [4, '🥉']
  ]

  let commandResolve: undefined | ((contestantId: string) => string)

  const fuzzyFn = $derived(
    createFuzzySearch(
      playersStore.players[genderStore.gender].filter((p) => p.present),
      {
        getText: (player) => [
          `${player.name} ${player.organization}`,
          `${player.organization} ${player.name}`
        ],
        strategy: 'aggressive'
      }
    )
  )

  let filteredPlayers = $derived.by(() => {
    const filtered = fuzzyFn(commandInput)
      .toSorted((a, b) => a.score - b.score)
      .map((x) => x.item)
    if (filtered.length == 0 && !commandInput) return playersStore.players[genderStore.gender]
    return filtered.slice(0, 20)
  })

  let commandValue = $state('')
  let commandInput = $state('')
  let openCommand = $state(false)

  const items: SelectItem[] = $derived(
    Object.entries(bracketsStore.selectedBracket?.contestants ?? []).map(([id, contestant]) => ({
      label: id,
      value: contestant,
      snippet: contestantSnippet
    }))
  )

  let collapsed = $state(true)

  const selectedWinner = $derived(
    winnerStore.get(genderStore.gender, bracketsStore.selectedCategory)
  )

  const matches = $derived(selectedWinner?.matches ?? {})
  const winners = $derived(selectedWinner?.winners ?? [])
  const dirty = $derived(Boolean(selectedWinner?.dirty))

  const selected: Record<number, string> = $derived(
    winners.reduce(
      (acc, winner) => ({ ...acc, [winner.classification]: winner.contestantId }),
      {}
    ) ?? []
  )
</script>

<div class="border-border bg-background fixed right-0 bottom-0 z-10 rounded-t-sm border-1">
  <Button
    variant="outline"
    class={cn(
      'flex w-full rounded-none border-b-1 px-3',
      dirty ? 'bg-yellow-100 dark:bg-yellow-800 dark:text-yellow-50' : ''
    )}
    onclick={() => {
      collapsed = !collapsed
    }}
  >
    <span>Classificação</span>
    <span class="flex-1"></span>
    {#if collapsed}
      <ChevronUp class="self-end opacity-60" />
    {:else}
      <ChevronDown class="self-end opacity-60" />
    {/if}
  </Button>
  <div
    class={cn(
      'classification-collapsible',
      'grid grid-cols-[auto_1fr] transition-all duration-75',
      collapsed ? 'invisible h-0' : 'visible h-auto'
    )}
  >
    {#each classifications as [classification, label], i (i)}
      <div class="border-1 p-1">
        {label}
      </div>
      <CommandSelect
        popoverClass="w-auto"
        items={items.filter((item) => !Object.values(selected).includes(item.label))}
        onNewItem={(value) => {
          openCommand = true
          commandInput = value

          const { promise, resolve } = Promise.withResolvers<string>()
          commandResolve = resolve

          promise.then((contestantId) => {
            if (!bracketsStore.selectedBracket) return
            const gender = genderStore.gender

            winnerStore.set(gender, bracketsStore.selectedCategory, {
              matches: mapObject(matches, (_, match) =>
                filterObject(match, (_, c) => c != classification)
              ),
              winners: [
                ...winners.filter((w) => w.classification != classification),
                { classification, contestantId }
              ],
              dirty: true
            })
          })
        }}
        onSelect={(item) => {
          if (!bracketsStore.selectedBracket) return
          const gender = genderStore.gender

          winnerStore.set(gender, bracketsStore.selectedCategory, {
            matches: mapObject(matches, (_, match) =>
              filterObject(match, (_, c) => c != classification)
            ),
            winners: [
              ...winners.filter((w) => w.classification != classification),
              { classification, contestantId: item.label }
            ],
            dirty: true
          })
        }}
      >
        {#snippet newItemSnippet()}
          <span class="flex size-3.5 items-center justify-center">
            <Search class="size-4" />
          </span>
          Pesquisar
        {/snippet}

        <Button variant="outline" class="flex w-full items-center rounded-none pr-0">
          {#if selected[classification] in playersStore.byContestantId}
            <span>{playersStore.byContestantId[selected[classification]].name}</span>
            <span class="text-xs opacity-60"
              >{playersStore.byContestantId[selected[classification]].organization}</span
            >
            <span class="flex-1"></span>
            <Button
              variant="ghost"
              class="text-muted-foreground p-1 hover:text-red-300"
              onclick={(e) => {
                e.stopPropagation()
                if (!bracketsStore.selectedBracket) return
                const gender = genderStore.gender

                const newWinners = [...winners.filter((w) => w.classification != classification)]
                winnerStore.set(gender, bracketsStore.selectedCategory, {
                  matches: mapObject(matches, (_, match) =>
                    filterObject(match, (_, c) => c != classification)
                  ),
                  winners: newWinners,
                  dirty: newWinners.length != 0
                })
              }}
            >
              <X />
            </Button>
          {/if}
        </Button>
      </CommandSelect>
    {/each}
  </div>
</div>

{#snippet contestantSnippet(item: SelectItem<Contestant>)}
  <span>{item.value.players[0].title}</span>
  <span class="text-sm opacity-60">{item.value.players[0].nationality}</span>
{/snippet}

<Command.Dialog bind:open={openCommand} bind:value={commandValue} shouldFilter={false}>
  <Command.Input
    placeholder="Digite aqui..."
    bind:value={commandInput}
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
            commandResolve?.(player.contestantId)
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
  .classification-collapsible {
    interpolate-size: allow-keywords;
  }
</style>
