import {
  compareCategory,
  comparePlayer,
  gendered,
  hashCategory,
  unhashCategory
} from '@lib/bracket-lib'
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
import type { ResultTable } from '@lib/types/result-table'
import { compareObject, filterObject } from '@lib/utils'
import type { Table } from '@tanstack/table-core'
// import { SvelteSet as Set } from 'svelte/reactivity'

class GenderedStore<T> {
  protected state: Gendered<Record<string, T>> = $state(gendered(() => ({})))

  get(gender: Gender, category: Category) {
    if (!category) return null
    const hash = hashCategory(category)
    return this.state[gender][hash] ?? null
  }
  get_(gender: Gender, hash: string) {
    return this.state[gender][hash] ?? null
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

  byContestantId_: Record<string, Player> = $derived(
    Object.values(gendered((gender) => Object.values(this.state[gender]).flat()))
      .flat()
      .reduce((acc, player) => {
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

  organizations: Gendered<string[]> = $derived(
    gendered((gender) => [...new Set(this.players[gender].flat().map((p) => p.organization))])
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
    console.log($state.snapshot(this.dynamicCategoryByContestantId_))

    const originalGender = originalPlayer?.isMale ? 'male' : 'female'
    const newGender = newPlayer.isMale ? 'male' : 'female'

    // New Player
    if (!originalPlayer) {
      console.log('new Player')
      const newPlayers = this.get(newGender, newPlayer.category) ?? []
      this.set(newGender, newPlayer.category, [
        ...newPlayers,
        {
          ...newPlayer,
          category: this.removeDynamicCategories(newPlayer.category)
        }
      ])

      return
    }

    if (comparePlayer(originalPlayer, newPlayer)) return

    const dynamicTags = newPlayer.category.filter((t) => this.dynamicTagIds?.includes(t.id))

    if (originalPlayer.isMale != newPlayer.isMale) {
      delete this.dynamicCategoryByContestantId_[originalGender][newPlayer.contestantId]
    }

    this.dynamicCategoryByContestantId_[newGender][newPlayer.contestantId] = dynamicTags

    if (
      originalPlayer.isMale != newPlayer.isMale ||
      (originalPlayer.isMale == newPlayer.isMale &&
        !compareCategory(originalPlayer.category, newPlayer.category))
    ) {
      const originalPlayers = this.get(originalGender, originalPlayer.category)!

      this.set(
        originalGender,
        originalPlayer.category,
        originalPlayers.filter((p) => p.contestantId != newPlayer.contestantId)
      )
    }

    const newPlayers =
      this.get(newGender, newPlayer.category)?.filter(
        (p) => p.contestantId != newPlayer.contestantId
      ) ?? []
    this.set(newGender, newPlayer.category, [
      ...newPlayers,
      {
        ...newPlayer,
        category: this.removeDynamicCategories(newPlayer.category)
      }
    ])
  }
  bulkAttachTags(players: Player[], newTags: Tag[][]) {
    const zip = <T, U>(a: T[], b: U[]) => a.map((ai, i) => [ai, b[i]] as [T, U])

    const genderedTuple = Object.groupBy(zip(players, newTags), ([p, _]) =>
      p.isMale ? 'male' : 'female'
    )

    const newDynamicCategoryByContestantId = {}
    for (const [gender, tuple] of Object.entries(genderedTuple)) {
      const allDynSet = new Set(this.dynamicTagIds)
      const allStaticSet = new Set(this.tagIds[gender]).difference(allDynSet)

      for (const [player, newTags] of tuple) {
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const seenIds = new Set<string>()

        if (!(gender in newDynamicCategoryByContestantId)) {
          newDynamicCategoryByContestantId[gender] = {}
        }
        newDynamicCategoryByContestantId[gender][player.contestantId] = [
          ...(this.dynamicCategoryByContestantId_[gender][player.contestantId] ?? []),
          ...newTags
        ]
          .toReversed()
          .filter((tag) => {
            if (allStaticSet.has(tag.id) || seenIds.has(tag.id)) return false
            seenIds.add(tag.id)
            return true
          })
      }
    }

    for (const gender of Object.keys(newDynamicCategoryByContestantId)) {
      this.dynamicCategoryByContestantId_[gender] = {
        ...this.dynamicCategoryByContestantId_[gender],
        ...newDynamicCategoryByContestantId[gender]
      }
    }
  }
  attachTags(player: Player, newTags: Tag[]) {
    const gender = player.isMale ? 'male' : 'female'

    const allDynSet = new Set(this.dynamicTagIds)
    const allStaticSet = new Set(this.tagIds[gender]).difference(allDynSet)

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const seenIds = new Set<string>()
    this.dynamicCategoryByContestantId_[gender][player.contestantId] = [
      ...(this.dynamicCategoryByContestantId_[gender][player.contestantId] ?? []),
      ...newTags
    ]
      .toReversed()
      .filter((tag) => {
        if (allStaticSet.has(tag.id) || seenIds.has(tag.id)) return false
        seenIds.add(tag.id)
        return true
      })

    // this.dynamicCategoryByContestantId_[gender][player.contestantId] = [
    //   ...(this.dynamicCategoryByContestantId_[gender][player.contestantId]?.filter(
    //     (tag) => !newTags.find((t) => tag.id == t.id)
    //   ) ?? []),
    //   ...newTags.filter((tag) => !allStaticSet.has(tag.id))
    // ]
    playersStore.setPlayer({
      ...player,
      category: [
        ...player.category.filter((tag) => !newTags.find((t) => tag.id == t.id)),
        ...newTags
      ]
    })
  }

  set(gender: Gender, category: Category, value: Player[]) {
    value.sort((a, b) => a.contestantId.localeCompare(b.contestantId))
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
    const record = players.reduce((acc, player) => {
      const hash = hashCategory(player.category)
      if (hash in acc) {
        acc[hash].push(player)
      } else {
        acc[hash] = [player]
      }
      return acc
    }, {})
    for (const key of Object.keys(record)) {
      record[key].sort((a, b) => a.contestantId.localeCompare(b.contestantId))
    }
    return record
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

  statusColors: Record<string, string> = $state({
    Impressão: 'rgb(from red r g b / 0.5)'
  })

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

  statuses: Gendered<Category[]> = $derived(
    gendered((gender) => this.derivedState[gender].map((ds) => ds.status))
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
    return filterObject(taggedBracket, (key) => key != 'category' && key != 'status')
  }
  setRaw(gender: Gender, category: Category, bracket: Bracket) {
    this.state[gender][hashCategory(category)] = { ...bracket, category, status: [] }
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

class ResultTableStore {
  selectedName = $state('')
  tables = $state<ResultTable[]>([])
  selectedTable = $derived(this.tables.find((t) => t.name == this.selectedName))
  dataTable = $state<Table<unknown>>()
}

const winnerStoreProxyHandler = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: function (target: any, prop: string, _receiver: unknown) {
    if (prop === 'winnersByCategory') {
      return Reflect.get(target, 'state')
    }
    return Reflect.get(target, prop)
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: function (target: any, prop: string, value: unknown) {
    if (prop === 'winnersByCategory') {
      return Reflect.set(target, 'state', value)
    }
    return Reflect.set(target, prop, value)
  }
}

interface WinnerStore extends GenderedStore<Winners> {
  winnersByCategory: Gendered<WinnersByCategory>
}

export const resultTableStore = new ResultTableStore()
export const playersStore = new PlayerStore()
export const bracketsStore = new BracketStore()
export const winnerStore: WinnerStore = new Proxy(
  new GenderedStore<Winners>(),
  winnerStoreProxyHandler
)
export const genderStore = new GenderStore()
