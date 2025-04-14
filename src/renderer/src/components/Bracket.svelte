<script lang="ts">
  import type { BracketCollection, Bracket } from '@lib/types/bracket-lib'
  import { createBracket } from 'bracketry'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Badge } from '@components/ui/badge'
  import { Plus } from '@lucide/svelte'

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

  let gender: 'male' | 'female' = $derived(isMale ? 'male' : 'female')
  let selectedBrackets = $derived(
    filterObject<Record<string, Bracket>>(brackets[gender], (key, v) => v.matches.length > 0)
  )

  export function update(): void {
    // Make sure we have a valid category selected
    if (!currentCategory || !(currentCategory in selectedBrackets)) {
      const availableCategories = Object.keys(selectedBrackets)
      currentCategory = availableCategories.length > 0 ? availableCategories[0] : ''
      console.warn(
        'No valid category selected. Defaulting to first available category:',
        currentCategory
      )
      return
    }

    let currentBracket = brackets[gender][currentCategory]

    if (!currentBracket) {
      console.warn('No bracket found for', gender, currentCategory)
      currentBracket = { matches: [], rounds: [], contestants: {} }
    }

    if (!bracketry) {
      bracketry = createBracket(currentBracket, bracketsEl, {
        navButtonsPosition: 'overTitles'
      })
    } else {
      bracketry.replaceData(currentBracket)
    }
  }

  // ==================== Helper Functions ====================
  function filterObject<T>(obj: T, predicate: (key: string, value: T[keyof T]) => boolean): T {
    return Object.keys(obj)
      .filter((key) => predicate(key, obj[key]))
      .reduce((res, key) => ((res[key] = obj[key]), res), {} as T)
  }
</script>

<div class="brackets-container">
  <div class="categories p-2">
    <ScrollArea contentclass="!flex flex-wrap justify-center">
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
  <div id="brackets" bind:this={bracketsEl}></div>
</div>

<style>
  .categories {
    display: flex;
    align-self: center;
    gap: 10px;
  }
  .brackets-container {
    grid-area: brackets;
    background-color: #ffefef;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;

    & > #brackets {
      min-width: 0;
      min-height: 0;
      height: 100%;
      width: 100%;
    }
  }
</style>
