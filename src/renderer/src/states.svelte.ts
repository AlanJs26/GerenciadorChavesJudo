import { gendered, hashCategory, unhashCategory } from '@lib/bracket-lib'
import type {
  Bracket,
  BracketCollection,
  Category,
  Gendered,
  Player,
  TaggedBracket,
  WinnersByCategory,
  Tag,
  Gender,
  Winners
} from '@lib/types/bracket-lib'
import { compareObject, filterObject } from '@lib/utils'

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
  declare protected state: Gendered<Record<string, Player[]>>

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

  byContestantId: Record<string, Player> = $derived(
    [...this.flatPlayers.female, ...this.flatPlayers.male].reduce((acc, player) => {
      acc[player.contestantId] = player
      return acc
    }, {})
  )

  categories: Gendered<Category[]> = $derived(
    gendered((gender) => this.uniqueCategories(this.flatPlayers[gender]))
  )

  get players(): Gendered<Player[]> {
    return this.flatPlayers
  }
  set players(value: Gendered<Player[]>) {
    this.state = gendered((gender) => this.createCategoryRecord(value[gender]))
    this.clearDynamicCategories()
  }

  attachTags(player: Player, newTags: Tag[]) {
    const gender = player.isMale ? 'male' : 'female'
    const filtered = newTags.filter(
      (tag) =>
        !(this.dynamicCategoryByContestantId_[gender][player.contestantId] ?? []).find(
          (t) => t.id == tag.id
        )
    )
    if (filtered.length == 0) return

    if (player.contestantId in this.dynamicCategoryByContestantId_[gender]) {
      this.dynamicCategoryByContestantId_[gender][player.contestantId].push(...filtered)
    } else {
      this.dynamicCategoryByContestantId_[gender][player.contestantId] = filtered
    }
  }

  clear(): void {
    super.clear()
    this.clearDynamicCategories()
  }

  clearDynamicCategories(): void {
    this.dynamicCategoryByContestantId_ = gendered(() => ({}))
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
    return Array.from(new Set(players.map((p) => hashCategory(p.category))))
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

export const playersStore = new PlayerStore()
export const bracketsStore = new BracketStore()
export const winnerStore = new WinnerStore()
export const genderStore = new GenderStore()
