export type Gendered<T> = {
  male: T
  female: T
} & Record<string, T>

export interface Tag {
  id: string
  value: string
}

export type Category = Tag[]
export type StatefullCategory = {
  category: Category
  state: boolean
}

export interface Player {
  name: string
  isMale: boolean
  category: Tag[]
  organization: string
  present: boolean
  contestantId: string
}

export interface TaggedBracket extends Bracket {
  category: Category
}

export type BracketCollection = Gendered<TaggedBracket[]>

export type WinnersByCategory = Record<string, Winners>

export type Classification = 1 | 2 | 3
export type Winners = {
  matches: Record<
    string,
    | { top: Classification; bottom?: Classification }
    | { top?: Classification; bottom: Classification }
  >
  winners: {
    contestantId: string
    classification: Classification
  }[]
}

// App State

export type State = {
  players: Player[]
  brackets: BracketCollection
  winnersByCategory: WinnersByCategory
}

// CSV Data

export interface Organization {
  organization: string
  players: Omit<Player, 'organization' | 'present' | 'contestantId'>[]
}

export type PlayerColumn = Omit<
  {
    [K in keyof Player]: string
  },
  'contestantId'
>

// Bracketry

export interface Bracket {
  rounds: { name: string }[]
  contestants: Record<string, Contestant>
  matches: Match[]
}

export type Contestant = { players: { title: string; nationality: string }[] }

export type Match = {
  roundIndex: number
  order: number
  sides: { contestantId?: string }[]
}
