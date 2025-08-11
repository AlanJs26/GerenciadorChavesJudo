<script lang="ts">
  import { sidebarState } from '@components/sidebar/sidebar-state.svelte.ts'
  import { Button, buttonVariants } from '@components/ui/button'
  import { Checkbox } from '@components/ui/checkbox'
  import * as ContextMenu from '@components/ui/context-menu'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import { Input } from '@components/ui/input'
  import { Label } from '@components/ui/label'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Separator } from '@components/ui/separator'
  import {
    buildBracket,
    createGroupedBrackets,
    hashCategory,
    randomizedSort
  } from '@lib/bracket-lib'
  import type { Tag } from '@lib/types/bracket-lib'
  import { cn } from '@lib/utils'
  import { Bolt, MoonIcon, Plus, SunIcon } from '@lucide/svelte'
  import createFuzzySearch from '@nozbe/microfuzz'
  import { toggleMode } from 'mode-watcher'
  import { type Snippet } from 'svelte'
  import { SvelteMap as Map } from 'svelte/reactivity'

  import BracketCard from '@/components/bracket-tab/bracket-card.svelte'
  import CategorySelect from '@/components/category-select.svelte'
  import { bracketsStore, genderStore, playersStore } from '@/states.svelte.ts'

  const elByHash = new Map<string, Element>()
  let contextOpen = $state(false)
  let selectedTags = $state([])
  let filterText = $state('')

  const fuzzyFn = $derived(
    createFuzzySearch(bracketsStore.brackets[genderStore.gender], {
      getText: (bracket) => [bracket.category.map((t) => t.value).join(' ')]
    })
  )

  let filteredBrackets = $derived.by(() => {
    const filtered = fuzzyFn(filterText)
      .toSorted((a, b) => a.score - b.score)
      .map((x) => x.item)
    if (filtered.length == 0 && !filterText) return bracketsStore.brackets[genderStore.gender]
    return filtered
  })

  const selectedNum = $derived(sidebarState.selected[genderStore.gender].length)
  const commonBracketSize = $derived.by(() => {
    const brackets = sidebarState.selected[genderStore.gender]
    return Math.pow(
      2,
      brackets.reduce(
        (acc, bracket) => (acc == bracket.rounds.length ? acc : 0),
        brackets.at(0)?.rounds.length ?? 0
      )
    )
  })
  $effect(() => {
    const el = elByHash.get(hashCategory(bracketsStore.selectedCategory))
    el?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  })
</script>

<div class="flex h-full w-full flex-col items-center p-1">
  <div class="flex w-full flex-row">
    {@render configDropdown()}
    <Button variant="outline" class="flex-1">
      <Plus />
      Nova Chave
    </Button>
  </div>

  <Input id="busca" class="!my-1 w-full" placeholder="Filtrar..." bind:value={filterText} />

  <Separator />

  {#snippet scrollViewSnippet()}
    <ScrollArea class="flex w-full flex-1 flex-col" type="auto">
      {#each filteredBrackets as bracket, i (i)}
        {@const gender = genderStore.gender}
        <BracketCard
          bind:el={
            () => elByHash.get(hashCategory(bracket.category)),
            (v) => elByHash.set(hashCategory(bracket.category), v)
          }
          {gender}
          {bracket}
          bind:checked={
            () => sidebarState.checkedBrackets[gender].get(hashCategory(bracket.category)),
            (v) => sidebarState.checkedBrackets[gender].set(hashCategory(bracket.category), v)
          }
        />
      {/each}
    </ScrollArea>
  {/snippet}
  {@render contextmenu(scrollViewSnippet)}

  <Separator />

  {#if selectedNum > 0}
    <span class="!my-1">{selectedNum} selecionados</span>
  {/if}

  <span class="!mt-1 !mb-2 font-bold">Ações</span>

  <div class="grid w-full grid-cols-2 gap-1 px-1">
    {@render tagSelectSnippet(selectedNum)}
    <Button
      variant="outline"
      disabled={selectedNum == 0}
      onclick={() => {
        const gender = genderStore.gender
        for (const bracket of sidebarState.selected[gender]) {
          bracketsStore.delete(gender, bracket.category)
        }
        sidebarState.checkedBrackets[gender] = new Map<string, boolean>()
      }}>Apagar</Button
    >
    <Button
      variant="outline"
      disabled={selectedNum == 0}
      onclick={() => {
        const gender = genderStore.gender
        const letterGen = (n) => {
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
          return letters[n % letters.length]
        }
        for (const bracket of sidebarState.selected[gender]) {
          const players = Object.keys(bracket.contestants).map(
            (id) => playersStore.byContestantId[id]
          )
          const groupTag = bracket.category.find((t) => t.id == 'Grupo')
          const newTags: Tag[] = []

          const newTagsLength = groupTag ? 1 : 2
          for (let i = 0; i < 25; i++) {
            if (newTags.length >= newTagsLength) break
            const newTag: Tag = { id: 'Grupo', value: letterGen(i) }
            if (
              !bracketsStore.has(gender, [
                ...bracket.category.filter((t) => t.id != 'Grupo'),
                newTag
              ])
            ) {
              newTags.push(newTag)
            }
          }

          for (const player of players) {
            playersStore.attachTags(player, [groupTag ?? newTags[0]])
          }
          for (const [i, newTag] of Object.entries(newTags)) {
            const newCategory = [...bracket.category.filter((t) => t.id != 'Grupo'), newTag]
            const newStatus = i == 1 ? [{ id: 'Duplicado', value: 'Duplicado' }] : []
            bracketsStore.setTagged(gender, {
              ...bracket,
              category: newCategory,
              status: [...bracket.status, ...newStatus]
            })
            if (i == 0) {
              bracketsStore.selectedCategory = newCategory
            }
          }
          if (!groupTag) {
            bracketsStore.delete(gender, bracket.category)
          }
        }
        sidebarState.checkedBrackets[gender] = new Map<string, boolean>()
      }}>Duplicar</Button
    >
    <Button
      variant="outline"
      disabled={selectedNum == 0}
      onclick={() => {
        const gender = genderStore.gender
        for (const bracket of sidebarState.selected[gender]) {
          const players = Object.keys(bracket.contestants).map(
            (id) => playersStore.byContestantId[id]
          )
          const randomized = randomizedSort(players, 'organization')
          const newBracket = buildBracket(randomized, 0, false)
          bracketsStore.set(gender, bracket.category, newBracket)
        }
        // sidebarState.checkedBrackets[gender] = new Map<string, boolean>()
      }}>Sortear</Button
    >

    {@render bracketSizeSnippet(selectedNum)}

    <Button variant="outline" disabled={selectedNum == 0}>Imprimir</Button>
    <!-- TODO: Implementar as outras ações de gerenciamento de chaves -->
  </div>
</div>

{#snippet bracketSizeSnippet(selectedNum: number)}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      disabled={selectedNum == 0}
      class={buttonVariants({ variant: 'outline' })}
    >
      Mudar Tamanho
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-56">
      <DropdownMenu.Group class="flex flex-col items-center">
        <DropdownMenu.DropdownMenuGroupHeading class="!font-bold"
          >Tamanho</DropdownMenu.DropdownMenuGroupHeading
        >

        <div class="grid w-full grid-cols-4">
          {#each [2, 4, 8, 16] as bracketSize (bracketSize)}
            <DropdownMenu.Item
              class="grid place-items-center"
              disabled={bracketSize == commonBracketSize}
              onclick={() => {
                const gender = genderStore.gender
                for (const bracket of sidebarState.selected[gender]) {
                  const players = Object.keys(bracket.contestants).map(
                    (id) => playersStore.byContestantId[id]
                  )

                  if (bracketSize < players.length) {
                    const newBrackets = createGroupedBrackets(players, bracketSize)

                    bracketsStore.delete(gender, bracket.category)
                    for (const newBracket of newBrackets) {
                      bracketsStore.setTagged(gender, newBracket)
                    }
                    bracketsStore.selectedCategory = newBrackets[0].category
                  } else {
                    const newBracket = buildBracket(players, bracketSize)
                    bracketsStore.set(gender, bracket.category, newBracket)
                    bracketsStore.selectedCategory = newBracket.category
                  }
                }
                sidebarState.checkedBrackets[gender] = new Map<string, boolean>()
              }}
            >
              <span>{bracketSize}</span>
            </DropdownMenu.Item>
          {/each}
        </div>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

{#snippet tagSelectSnippet(selectedNum: number)}
  <DropdownMenu.Root
    onOpenChange={(open) => {
      if (!open) return
      const brackets = [...sidebarState.selected.male, ...sidebarState.selected.female]
      selectedTags = brackets[0].category
    }}
  >
    <DropdownMenu.Trigger disabled={selectedNum < 2} class={buttonVariants({ variant: 'outline' })}>
      Mesclar
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-70">
      <DropdownMenu.Group class="flex flex-col items-center">
        <DropdownMenu.DropdownMenuGroupHeading class="!font-bold"
          >Nova Categoria</DropdownMenu.DropdownMenuGroupHeading
        >

        <CategorySelect bind:selectedTags gender={genderStore.gender} />

        <DropdownMenu.Item
          class={cn(buttonVariants({ variant: 'default' }), '!mt-2')}
          onclick={() => {
            const gender = genderStore.gender
            const brackets = sidebarState.selected[gender]
            const players = brackets.flatMap((bracket) =>
              Object.keys(bracket.contestants).map((id) => ({
                ...playersStore.byContestantId[id],
                category: selectedTags
              }))
            )
            for (const bracket of sidebarState.selected[gender]) {
              bracketsStore.delete(gender, bracket.category)
            }
            const newBrackets = createGroupedBrackets(players, 32, false)
            for (const newBracket of newBrackets) {
              bracketsStore.set(gender, newBracket.category, newBracket)
            }
            for (const player of players) {
              playersStore.setPlayer(player)
            }
            bracketsStore.selectedCategory = newBrackets[0].category
            sidebarState.checkedBrackets[gender] = new Map<string, boolean>()
          }}>Mesclar</DropdownMenu.Item
        >
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

{#snippet configDropdown()}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
      <Bolt class="h-4 w-4" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-56">
      <DropdownMenu.Group>
        <DropdownMenu.DropdownMenuGroupHeading class="!font-bold"
          >Tema</DropdownMenu.DropdownMenuGroupHeading
        >

        <DropdownMenu.Item
          closeOnSelect={false}
          onclick={() => {
            document.startViewTransition(() => {
              toggleMode()
            })
          }}
        >
          <SunIcon
            class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"
          />
          <MoonIcon
            class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
          />
          <span>Mudar Tema</span>
        </DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

{#snippet contextmenu(trigger: Snippet)}
  <ContextMenu.Root bind:open={contextOpen}>
    <ContextMenu.Trigger class="flex min-h-0 w-full flex-1 flex-col">
      {@render trigger()}
    </ContextMenu.Trigger>

    <ContextMenu.Content class="z-10 flex flex-1 flex-col p-3" updatePositionStrategy="always">
      <ContextMenu.Group class="flex w-full cursor-pointer flex-row items-center">
        <Checkbox
          id="checkbox"
          aria-labelledby="checkbox-label"
          class="cursor-pointer"
          bind:checked={
            () =>
              bracketsStore.brackets[genderStore.gender].length ==
              sidebarState.selected[genderStore.gender].length,
            () => {
              const gender = genderStore.gender
              const brackets = bracketsStore.brackets[gender]
              const noneChecked = sidebarState.selected[gender].length == 0
              for (const bracket of brackets) {
                sidebarState.checkedBrackets[gender].set(
                  hashCategory(bracket.category),
                  noneChecked
                )
              }
              contextOpen = false
            }
          }
        />
        <Label
          id="checkbox-label"
          for="checkbox"
          class="!ml-2 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Alternar Tudo
        </Label>
      </ContextMenu.Group>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/snippet}
