export type Player = {
  name: string
  isMale: boolean
  category: string
  organization: string
  present: boolean
  contestantId: string
}

export type Organization = {
  organization: string
  players: Omit<Player, 'organization' | 'present' | 'contestantId'>[]
}

export type Match = {
  roundIndex: number
  order: number
  sides: { contestantId: string }[]
}

export type Bracket = {
  rounds: { name: string }[]
  contestants: Record<string, { players: { title: string; nationality: string }[] }>
  matches: Match[]
}

export type BracketCollection = {
  male: Record<string, Bracket>
  female: Record<string, Bracket>
}

export type PlayerColumn = Omit<
  {
    [K in keyof Player]: string
  },
  'contestantId'
>
