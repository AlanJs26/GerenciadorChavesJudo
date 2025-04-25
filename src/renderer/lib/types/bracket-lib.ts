export type Organization = {
  organization: string
  players: Omit<Player, 'organization' | 'present' | 'contestantId'>[]
}

export type Player = {
  name: string
  isMale: boolean
  category: string
  organization: string
  present: boolean
  contestantId: string
}

export type BracketCollection = {
  male: Record<string, Bracket>
  female: Record<string, Bracket>
}

export type Bracket = {
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

export type PlayerColumn = Omit<
  {
    [K in keyof Player]: string
  },
  'contestantId'
>

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

export type State = {
  players: Player[]
  brackets: BracketCollection
  winnersByCategory: WinnersByCategory
}
