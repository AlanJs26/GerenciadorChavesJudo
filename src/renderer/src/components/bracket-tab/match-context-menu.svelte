<script lang="ts">
  import { buttonVariants } from '@components/ui/button'
  import * as ContextMenu from '@components/ui/context-menu'
  import type { Match } from '@lib/types/bracket-lib'
  import { Plus, Trash2 } from '@lucide/svelte'

  import { playersStore } from '@/states.svelte'

  let {
    selectedMatch,
    onSubmitWinner,
    onSubmitAdd,
    onSubmitDelete,
    visible = $bindable(),
    children
  }: {
    selectedMatch: Match
    onSubmitWinner: (contestantId: string, selectedMatch: Match) => void
    onSubmitAdd: (side: 0 | 1, selectedMatch: Match) => void
    onSubmitDelete: (contestantId: string, selectedMatch: Match) => void
    visible: boolean
  } = $props()
</script>

<ContextMenu.Root bind:open={() => visible, (open) => (!open ? (visible = open) : null)}>
  <ContextMenu.Trigger class="h-full w-full">
    {@render children()}
  </ContextMenu.Trigger>

  <ContextMenu.Content class="flex w-64 flex-col items-center" updatePositionStrategy="always">
    {@const sides = selectedMatch.sides}
    {@const filteredSides = sides.filter((s) => s?.contestantId)}
    {#if filteredSides.length > 0}
      <span class="font-bold">Escolha um Vencedor</span>
    {/if}
    <ContextMenu.Group class="flex w-full flex-row">
      {#each filteredSides as { contestantId } (contestantId)}
        <ContextMenu.Item
          class="flex-1 justify-center"
          onclick={() => {
            onSubmitWinner(contestantId, selectedMatch)
          }}
        >
          {(() => {
            const player = playersStore.byContestantId?.[contestantId]
            return player?.name ?? ''
          })()}</ContextMenu.Item
        >
      {/each}
    </ContextMenu.Group>
    <ContextMenu.Separator class="mb-3 w-full" />

    {#if filteredSides.length < 2}
      <span class="font-bold">Adicionar Jogador</span>
      <div class="grid w-full grid-cols-2">
        {#each [0, 1] as side (side)}
          {#if !sides?.[side]?.contestantId}
            <ContextMenu.Item
              class={`col-start-${side + 1} flex w-full justify-center`}
              onclick={() => {
                onSubmitAdd(side, selectedMatch)
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
        {#each selectedMatch.sides.filter((s) => s?.contestantId) as { contestantId } (contestantId)}
          <ContextMenu.Item
            onclick={() => {
              onSubmitDelete(contestantId, selectedMatch)
            }}>{playersStore.byContestantId?.[contestantId].name ?? ''}</ContextMenu.Item
          >
        {/each}
      </ContextMenu.SubContent>
    </ContextMenu.Sub>
  </ContextMenu.Content>
</ContextMenu.Root>
