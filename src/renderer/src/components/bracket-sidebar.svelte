<script lang="ts">
  import { Button, buttonVariants } from '@components/ui/button'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import { Input } from '@components/ui/input'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Separator } from '@components/ui/separator'
  import { buildBracket, gendered } from '@lib/bracket-lib'
  import type { Tag, TaggedBracket } from '@lib/types/bracket-lib'
  import { Bolt, MoonIcon, Plus, SunIcon } from '@lucide/svelte'
  import { toggleMode } from 'mode-watcher'
  import { SvelteMap as Map } from 'svelte/reactivity'

  import BracketCard from '@/components/bracket-tab/bracket-card.svelte'
  import { bracketsStore, genderStore, playersStore } from '@/states.svelte.ts'

  const checkedBrackets = $state({
    female: new Map<TaggedBracket, boolean>(),
    male: new Map<TaggedBracket, boolean>()
  })
  const selected = $derived(
    gendered((gender) =>
      Array.from(checkedBrackets[gender].entries())
        .filter(([_bracket, checked]) => checked)
        .map(([bracket, _checked]) => bracket)
    )
  )
  const selectedNum = $derived(selected.male.length + selected.female.length)
</script>

<div class="flex h-full w-full flex-col items-center p-1">
  <div class="flex w-full flex-row">
    {@render configDropdown()}
    <Button variant="outline" class="flex-1">
      <Plus />
      Nova Chave
    </Button>
  </div>

  <Input id="busca" class="!my-1 w-full" placeholder="Filtrar..." />

  {#if selectedNum > 0}
    <span>{selectedNum} selecionados</span>
  {:else}
    <span>&nbsp;</span>
  {/if}

  <Separator />
  <ScrollArea class="flex w-full flex-1 flex-col" type="auto">
    {#each bracketsStore.brackets[genderStore.gender] as bracket, i (i)}
      {@const gender = genderStore.gender}
      <BracketCard
        {gender}
        {bracket}
        bind:checked={
          () => checkedBrackets[gender].get(bracket), (v) => checkedBrackets[gender].set(bracket, v)
        }
      />
    {/each}
  </ScrollArea>
  <Separator />

  <span class="!my-2 font-bold">Ações</span>

  <div class="grid w-full grid-cols-2 gap-1 px-1">
    <Button variant="outline" disabled={selectedNum < 2}>Mesclar</Button>
    <Button
      variant="outline"
      disabled={selectedNum == 0}
      onclick={() => {
        ;['female', 'male'].forEach((gender) => {
          for (const bracket of selected[gender]) {
            bracketsStore.delete(gender, bracket.category)
          }
          checkedBrackets[gender] = new Map<TaggedBracket, boolean>()
        })
      }}>Apagar</Button
    >
    <Button
      variant="outline"
      disabled={selectedNum == 0}
      onclick={() => {
        const letterGen = (n) => {
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
          return letters[n % letters.length]
        }
        ;['female', 'male'].forEach((gender) => {
          for (const bracket of selected[gender]) {
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
            for (const newTag of newTags) {
              const newCategory = [...bracket.category.filter((t) => t.id != 'Grupo'), newTag]
              bracketsStore.set(gender, newCategory, { ...bracket, category: newCategory })
            }
            if (!groupTag) {
              bracketsStore.delete(gender, bracket.category)
            }
          }
          checkedBrackets[gender] = new Map<TaggedBracket, boolean>()
        })
      }}>Duplicar</Button
    >
    <Button variant="outline" disabled={selectedNum == 0}>Sortear</Button>
    <Button variant="outline" disabled={selectedNum == 0}>Mudar Tamanho</Button>
    <Button variant="outline" disabled={selectedNum == 0}>Imprimir</Button>
    <!-- TODO: Implementar as outras ações de gerenciamento de chaves -->
  </div>
</div>

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
