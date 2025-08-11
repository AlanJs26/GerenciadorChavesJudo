<script lang="ts">
  import { setSelectedCategory } from '@components/bracket-tab/bracket-state.svelte'
  import Badge from '@components/ui/badge/badge.svelte'
  import { compareCategory } from '@lib/bracket-lib'
  import type { TaggedBracket } from '@lib/types/bracket-lib'

  import { bracketsStore, genderStore } from '@/states.svelte.ts'

  let {
    checked = $bindable(),
    el = $bindable(),
    gender,
    bracket
  }: {
    checked: boolean
    el: HTMLButtonElement
    gender: 'female' | 'male'
    bracket: TaggedBracket
  } = $props()
</script>

<button
  bind:this={el}
  class="participante hover:bg-primary/5 flex w-full cursor-pointer gap-5 !pr-5"
  onclick={function (): void {
    ;(this as HTMLDivElement).querySelector('input').click()
  }}
>
  <div class="flex w-full flex-1 flex-col items-start p-3">
    <div class="flex">
      <Badge
        variant={compareCategory(bracketsStore.selectedCategory, bracket.category) &&
        gender == genderStore.gender
          ? 'default'
          : 'outline'}
        group={true}
        category={bracket.category}
        onclick={(e) => {
          e.stopPropagation()
          genderStore.gender = gender
          setSelectedCategory(bracket.category)
        }}
      ></Badge>
    </div>
    <div class="text-muted-foreground !mt-1 !ml-2 flex flex-col text-start text-xs">
      <span>
        {gender == 'male' ? 'Masculino' : 'Feminino'}
      </span>
      <span>
        Participantes: {Object.keys(bracket.contestants).length}
      </span>
      <span>
        Tamanho: {Math.pow(2, bracket.rounds.length)}
      </span>
    </div>
  </div>
  <input
    type="checkbox"
    bind:checked
    onclick={(e: Event): void => {
      e.stopPropagation()
    }}
  />
</button>
