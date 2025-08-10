import { compareCategory, gendered, hashCategory, unhashCategory } from '@lib/bracket-lib'
import type {
  Bracket,
  BracketCollection,
  Category,
  Gender,
  Gendered,
  Player,
  Tag,
  TaggedBracket,
  Winners,
  WinnersByCategory
} from '@lib/types/bracket-lib'
import { addInvalidContestantIds, compareObject, filterObject } from '@lib/utils'
import { SvelteSet as Set } from 'svelte/reactivity'

class GenderedStore<T> {
  protected state: Gendered<Record<string, T>> = $state(gendered(() => ({})))

  get(gender: Gender, category: Category) {
    if (!category) return null
    const hash = hashCategory(category)
    if (hash in this.state[gender]) {
      return this.state[gender][hash]
    }
    return null
  }
  has(gender: Gender, category: Category) {
    return Boolean(this.get(gender, category))
  }
  set(gender: Gender, category: Category, value: T) {
    this.state[gender][hashCategory(category)] = value
  }
  clear() {
    this.state.male = {}
    this.state.female = {}
  }
  delete(gender: Gender, category: Category) {
    const found = this.get(gender, category)
    if (found) {
      delete this.state[gender][hashCategory(category)]
      return found
    }
    return null
  }
}

// Players store
class PlayerStore extends GenderedStore<Player[]> {
  // declare protected state: Gendered<Record<string, Player[]>>

  private dynamicCategoryByContestantId_: Gendered<Record<string, Category>> = $state(
    gendered(() => ({}))
  )

  private flatPlayers: Gendered<Player[]> = $derived(
    gendered((gender) =>
      Object.values(this.state[gender])
        .flat()
        .map((player) => {
          const category = [
            player.category,
            this.dynamicCategoryByContestantId?.[player.contestantId] ?? []
          ].flat()
          return { ...player, category }
        })
    )
  )

  dynamicCategoryByContestantId: Record<string, Category> = $derived({
    ...this.dynamicCategoryByContestantId_.female,
    ...this.dynamicCategoryByContestantId_.male
  })

  dynamicTagIds: string[] = $derived([
    ...new Set(
      Object.values(this.dynamicCategoryByContestantId)
        .flat()
        .map((t) => t.id)
    )
  ])

  byContestantId: Record<string, Player> = $derived(
    [...this.flatPlayers.female, ...this.flatPlayers.male].reduce((acc, player) => {
      acc[player.contestantId] = player
      return acc
    }, {})
  )

  categories: Gendered<Category[]> = $derived(
    gendered((gender) => this.uniqueCategories(this.flatPlayers[gender]))
  )

  tagIds: Gendered<string[]> = $derived(
    gendered((gender) => [...new Set(this.categories[gender].flat().map((t) => t.id))])
  )

  get players(): Gendered<Player[]> {
    return this.flatPlayers
  }
  set players(value: Gendered<Player[]>) {
    this.state = gendered((gender) => this.createCategoryRecord(value[gender]))
    this.clearDynamicCategories()
  }

  setPlayer(newPlayer: Player) {
    const originalPlayer = this.byContestantId?.[newPlayer.contestantId]
    const dynamicTags = newPlayer.category.filter((t) => this.dynamicTagIds.includes(t.id))

    const newGender = newPlayer.isMale ? 'male' : 'female'

    this.dynamicCategoryByContestantId_[newGender][newPlayer.contestantId] = dynamicTags

    if (
      originalPlayer &&
      (!compareCategory(originalPlayer.category, newPlayer.category, this.dynamicTagIds) ||
        originalPlayer.isMale != newPlayer.isMale)
    ) {
      const originalPlayers = this.get(newGender, originalPlayer.category)!
      const originalGender = originalPlayer?.isMale ? 'male' : 'female'

      this.set(
        originalGender,
        originalPlayer.category,
        originalPlayers.filter((p) => p.contestantId != originalPlayer.contestantId)
      )
    }

    const newPlayers = this.get(newGender, newPlayer.category)

    this.set(newGender, newPlayer.category, [
      ...(newPlayers?.filter((p) => p.contestantId != newPlayer.contestantId) ?? []),
      {
        ...newPlayer,
        category: this.removeDynamicCategories(newPlayer.category)
      }
    ])

    if (!originalPlayer) {
      addInvalidContestantIds([newPlayer.contestantId])
    }
  }

  attachTags(player: Player, newTags: Tag[]) {
    const gender = player.isMale ? 'male' : 'female'

    const allDynSet = new Set(this.dynamicTagIds)
    const allStaticSet = new Set(this.tagIds[gender]).difference(allDynSet)

    const playerDynTags = this.dynamicCategoryByContestantId_[gender][player.contestantId] ?? []
    const playerStaticTags = player.category.filter((tag) => allStaticSet.has(tag.id))

    const newSet = new Set(newTags.map((t) => t.id))
    const playerDynSet = new Set(playerDynTags.map((t) => t.id))
    const playerStaticSet = new Set(playerStaticTags.map((t) => t.id))

    const newDynTags = newTags.filter((tag) => allDynSet.has(tag.id))
    const newStaticTags = newTags.filter((tag) => allStaticSet.has(tag.id))

    const targetDynSet = playerDynSet.difference(newSet.difference(allStaticSet))
    const filteredPlayerDynTags = playerDynTags.filter((tag) => targetDynSet.has(tag.id))

    const targetStaticSet = playerStaticSet.difference(newSet.difference(allDynSet))
    const filteredPlayerStaticTags = playerStaticTags.filter((tag) => targetStaticSet.has(tag.id))

    this.dynamicCategoryByContestantId_[gender][player.contestantId] = [
      ...filteredPlayerDynTags,
      ...newDynTags
    ]
    playersStore.setPlayer({ ...player, category: [...filteredPlayerStaticTags, ...newStaticTags] })
  }

  set(gender: Gender, category: Category, value: Player[]) {
    super.set(gender, this.removeDynamicCategories(category), value)
  }

  get(gender: Gender, category: Category) {
    return super.get(gender, this.removeDynamicCategories(category))
  }

  clear(): void {
    super.clear()
    this.clearDynamicCategories()
  }

  clearDynamicCategories(): void {
    this.dynamicCategoryByContestantId_ = gendered(() => ({}))
  }

  private removeDynamicCategories(category: Category) {
    return category.filter((tag) => !this.dynamicTagIds.includes(tag.id))
  }

  private createCategoryRecord(players: Player[]): Record<string, Player[]> {
    return players.reduce((acc, player) => {
      const hash = hashCategory(player.category)
      if (hash in acc) {
        acc[hash].push(player)
      } else {
        acc[hash] = [player]
      }
      return acc
    }, {})
  }

  private uniqueCategories(players: Player[]): Category[] {
    return [...new Set(players.map((p) => hashCategory(p.category)))]
      .sort((a, b) => a.localeCompare(b))
      .map((hashed) => unhashCategory(hashed))
  }
}

// Brackets store
class BracketStore extends GenderedStore<TaggedBracket> {
  declare protected state: Gendered<Record<string, TaggedBracket>>
  selectedCategory: Category = $state([])

  private derivedState: Gendered<TaggedBracket[]> = $derived(
    gendered((gender) => Object.values(this.state[gender]))
  )

  flatBrackets: TaggedBracket[] = $derived(
    [this.derivedState.male, this.derivedState.female].flat()
  )

  selectedBracket: TaggedBracket | null = $derived(
    this.get(genderStore.gender, this.selectedCategory)
  )

  categories: Gendered<Category[]> = $derived(
    gendered((gender) => this.derivedState[gender].map((ds) => ds.category))
  )

  tagById: Gendered<Record<string, Tag[]>> = $derived(
    gendered((gender) =>
      this.categories[gender].reduce(
        (acc, category) => {
          for (const tag of category) {
            if (acc[tag.id]?.find((t) => compareObject(t, tag))) continue
            if (tag.id in acc) {
              acc[tag.id].push(tag)
            } else {
              acc[tag.id] = [tag]
            }
          }
          return acc
        },
        {} as Record<string, Tag[]>
      )
    )
  )

  get brackets(): BracketCollection {
    return this.derivedState
  }
  set brackets(value: BracketCollection) {
    this.state.female = Object.fromEntries(
      value.female.map((bracket) => [hashCategory(bracket.category), bracket])
    )
    this.state.male = Object.fromEntries(
      value.male.map((bracket) => [hashCategory(bracket.category), bracket])
    )
  }
  setTagged(gender: Gender, bracket: TaggedBracket) {
    this.state[gender][hashCategory(bracket.category)] = bracket
  }
  getRaw(gender: Gender, category: Category): Bracket | null {
    const taggedBracket = this.get(gender, category)
    if (!taggedBracket) return taggedBracket
    return filterObject(taggedBracket, (key) => key != 'category')
  }
  setRaw(gender: Gender, category: Category, bracket: Bracket) {
    this.state[gender][hashCategory(category)] = { ...bracket, category }
  }
  clear(): void {
    super.clear()
    playersStore.clearDynamicCategories()
  }
}

// Gender store
class GenderStore {
  isMale: boolean = $state(false)
  private gender_: Gender = $derived(this.isMale ? 'male' : 'female')
  private radio_ = $derived(this.isMale ? 'Masculino' : 'Feminino')
  get gender(): Gender {
    return this.gender_
  }
  set gender(value: string) {
    this.isMale = value == 'male'
  }
  get radio(): string {
    return this.radio_
  }
  set radio(value: string) {
    this.isMale = value == 'Masculino'
  }
  toggle() {
    this.isMale = !this.isMale
  }
}
// Winners store
class WinnerStore extends GenderedStore<Winners> {
  winnersByCategory: Gendered<WinnersByCategory> = this.state
}

class SidebarStore {
  tab = $state('chaves')
}

export const playersStore = new PlayerStore()
export const bracketsStore = new BracketStore()
export const winnerStore = new WinnerStore()
export const genderStore = new GenderStore()
export const sidebarStore = new SidebarStore()
