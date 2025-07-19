import { gendered, hashCategory, unhashCategory } from '@lib/bracket-lib'
import type {
  Bracket,
  BracketCollection,
  Category,
  Gendered,
  Player,
  TaggedBracket,
  WinnersByCategory,
  Tag
} from '@lib/types/bracket-lib'
import { compareObject, filterObject } from '@lib/utils'

class GenderedStore<T> {
  protected state: Gendered<Record<string, T>> = $state(gendered(() => ({})))

  get(gender: 'female' | 'male', category: Category) {
    if (!category) return null
    const hash = hashCategory(category)
    if (hash in this.state[gender]) {
      return this.state[gender][hash]
    }
    return null
  }
  has(gender: 'female' | 'male', category: Category) {
    return Boolean(this.get(gender, category))
  }
  set(gender: 'female' | 'male', category: Category, value: T) {
    this.state[gender][hashCategory(category)] = value
  }
  clear() {
    this.state.male = {}
    this.state.female = {}
  }
  delete(gender: 'female' | 'male', category: Category) {
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
  private flatPlayers: Gendered<Player[]> = $derived(
    gendered((gender) => Object.values(this.state[gender]).flat())
  )

  readonly byContestantId: Record<string, Player> = $derived(
    [...this.flatPlayers.female, ...this.flatPlayers.male].reduce((acc, player) => {
      if (player.contestantId) {
        acc[player.contestantId] = player
      }
      return acc
    }, {})
  )

  readonly categories: Gendered<Category[]> = $derived(
    gendered((gender) => this.uniqueCategories(this.flatPlayers[gender]))
  )

  get players(): Gendered<Player[]> {
    return this.flatPlayers
  }
  set players(value: Gendered<Player[]>) {
    this.state = gendered((gender) => this.createCategoryRecord(value[gender]))
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

  categories: Gendered<Category[]> = $derived(
    gendered((gender) => this.derivedState[gender].map((ds) => ds.category))
  )

  tagById: Gendered<Record<string, Tag[]>> = $derived(
    gendered(gender => this.categories[gender].reduce((acc, category) => {
      for (const tag of category) {
        if (acc[tag.id]?.find(t => compareObject(t, tag))) continue
        if (tag.id in acc) {
          acc[tag.id].push(tag)
        } else {
          acc[tag.id] = [tag]
        }
      }
      return acc
    }, {} as Record<string, Tag[]>))
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
  setTagged(gender: 'female' | 'male', bracket: TaggedBracket) {
    this.state[gender][hashCategory(bracket.category)] = bracket
  }
  getRaw(gender: 'female' | 'male', category: Category): Bracket | null {
    const taggedBracket = this.get(gender, category)
    if (!taggedBracket) return taggedBracket
    return filterObject(taggedBracket, (key) => key != 'category')
  }
  setRaw(gender: 'female' | 'male', category: Category, bracket: Bracket) {
    this.state[gender][hashCategory(category)] = { ...bracket, category }
  }
}

// Gender store
class GenderStore {
  isMale: boolean = $state(false)
  private gender_ = $derived(this.isMale ? 'male' : 'female')
  private radio_ = $derived(this.isMale ? 'Masculino' : 'Feminino')
  get gender(): string {
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
class WinnerStore extends GenderedStore<WinnersByCategory> {
  winnersByCategory = this.state
}

export const playersStore = new PlayerStore()
export const bracketsStore = new BracketStore()
export const winnerStore = new WinnerStore()
export const genderStore = new GenderStore()
