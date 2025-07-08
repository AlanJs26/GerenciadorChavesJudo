<script lang="ts">
  import { playersStore, winnerStore } from '@/states.svelte'
  import type { Winners } from '@lib/types/bracket-lib'
  import { cn } from '@lib/utils'
  import { Separator } from '@components/ui/separator'
  import { onDestroy, onMount } from 'svelte'

  let {
    bracketFullscreen,
    currentCategory,
    bracketsEl = $bindable()
  }: {
    bracketFullscreen: boolean
    currentCategory: string
    bracketsEl: HTMLDivElement
  } = $props()

  let isBracketVisible = $state(false)

  let winners: Winners = $derived(winnerStore.winnersByCategory[currentCategory])
  let observer: MutationObserver | undefined

  onMount(() => {
    observer = new MutationObserver(() => {
      isBracketVisible = Boolean(bracketsEl?.children?.length)
    })

    observer.observe(bracketsEl, { childList: true })
  })
  onDestroy(() => {
    observer.disconnect()
  })
</script>

<div
  class={cn(
    'flex h-full w-full flex-col items-center',
    !isBracketVisible ? 'hidden' : '',
    bracketFullscreen ? 'fullscreen' : ''
  )}
>
  {#if bracketFullscreen}
    {@const sortedWinners = winners?.winners.toSorted(
      (a, b) => a.classification - b.classification
    )}

    <h1 class="text-[24pt]">
      {(() => {
        const regex = /sub\s*(?<num>[0-9]+)[^\w]*(?<weight>[0-9]+\s*kg)\s*(?<name>.+)/gim
        const match = regex.exec(currentCategory)
        if (!match) return currentCategory

        const { name, weight, num } = match.groups
        const sub = `SUB${num}`
        const timeBySub = {
          SUB09: `2'00"`,
          SUB11: `2'30"`,
          SUB13: `3'00"`,
          SUB15: `3'00"`
        }
        return `${sub} - ${name} (${weight.replaceAll(' ', '')}) - ${timeBySub?.[sub] || ''}`
      })()}
    </h1>
    <div
      class="absolute bottom-0 right-0 z-[101] flex min-w-[300px] flex-col border-[1px] border-solid border-gray-500 bg-white text-center"
    >
      <h1 class="p-1 text-[8pt]">Vencedores</h1>
      <Separator />

      {#each ['🏆 1º', '🥈 2º', '🥉 3º', '🥉 3º'] as classification, i}
        {@const winnerClassification = sortedWinners?.[i]?.classification?.toString()}
        <div
          class="m-0 flex w-full flex-row border-t-[1px] border-solid border-inherit p-0 text-[8pt]"
        >
          <div class="m-0 grid h-7 w-[40px] place-items-center border-r-[1px] border-inherit">
            <span>{classification}</span>
          </div>
          <div class="m-0 grid h-7 min-h-4 w-full flex-1 place-items-center px-3">
            {#if classification.includes(winnerClassification)}
              <span> {playersStore.byContestantId[sortedWinners[i].contestantId].name} </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
  <div class={cn('brackets flex h-full w-full')} bind:this={bracketsEl}></div>
</div>
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

<style>
  .brackets {
    min-width: 0;
    min-height: 0;
    height: calc(100% - 80px);
  }
  .fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    background: white;
    height: 100vh !important;

    .brackets {
      height: 100% !important;
    }
  }
</style>
