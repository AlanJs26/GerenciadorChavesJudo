export type Player = {
  name: string
  isMale: boolean
  category: string
  organization: string
  present: boolean
}

export type Organization = {
  organization: string
  players: Omit<Player, 'organization' | 'present'>[]
}

export type Bracket = {
  rounds: { name: string }[]
  contestants: Record<string, { players: { title: string; nationality: string }[] }>
  matches: {
    roundIndex: number
    order: number
    sides: { contestantId: string }[]
  }[]
}

export type BracketCollection = {
  male: Record<string, Bracket>
  female: Record<string, Bracket>
}
