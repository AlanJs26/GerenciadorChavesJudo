import { getPoints } from '@lib/bracket-lib'
import type { Player } from '@lib/types/bracket-lib'
import type { FilterObj, OperationObj, SourceObj } from '@lib/types/result-table'
import { SvelteSet } from 'svelte/reactivity'

import { playersStore } from '@/states.svelte'

type FilterDef = {
  key: string
  label: string
  map?: <T>(s: T) => string
  values: string[]
}

function buildCustomFilterObjects(defs: FilterDef[]): FilterObj[] {
  return defs.map<FilterObj<string | null>>(({ key, label, values, map = null }) => ({
    label,
    get values() {
      return Array.from(new Set([null, ...values]))
    },
    apply(players: Player[], value: string | null) {
      if (value == null) {
        return players.reduce<Record<string, Player[]>>((acc, player) => {
          const value = map?.(player[key]) ?? player[key]
          if (value in acc) {
            acc[value].push(player)
          } else {
            acc[value] = [player]
          }
          return acc
        }, {})
      }

      return players.filter((player) => (map ? map(player[key]) == value : player[key] == value))
    }
  }))
}

function buildTagFilterObjects(tagIds: string[]): FilterObj[] {
  return tagIds.map((tagId: string) => ({
    label: tagId,
    get values() {
      return [
        null,
        ...new Set(
          Object.values(playersStore.categories)
            .flat()
            .flat()
            .filter((t) => t.id == tagId)
            .map((t) => t.value)
        )
      ]
    },
    apply(players: Player[], value: string | null) {
      players = players.filter((player) => player.category.find((t) => t.id == tagId))

      if (value == null) {
        return players.reduce((acc, player) => {
          const tagValue = player.category.find((c) => c.id == tagId)!.value

          if (tagValue in acc) {
            acc[tagValue].push(player)
          } else {
            acc[tagValue] = [player]
          }
          return acc
        }, {})
      }

      return players.filter((player) => player.category.find((c) => c.id == tagId)!.value == value)
    }
  }))
}

class ResultObjects {
  filterObjects: FilterObj[] = $derived([
    ...buildCustomFilterObjects([
      {
        key: 'isMale',
        label: 'Sexo',
        map: (s) => (s ? 'Masculino' : 'Feminino'),
        values: ['Masculino', 'Feminino']
      },
      {
        key: 'organization',
        label: 'Organização',
        values: Object.values(playersStore.organizations).flat()
      },
      {
        key: 'present',
        label: 'Presença',
        map: (s) => (s ? 'Sim' : 'Não'),
        values: ['Sim', 'Não']
      },
      {
        key: 'name',
        label: 'Participantes',
        values: []
      }
    ]),
    ...buildTagFilterObjects(Array.from(new SvelteSet(Object.values(playersStore.tagIds).flat())))
  ])

  operationObjects = $state([
    {
      label: 'Somar',
      allowRank: true,
      apply(rows: string[]) {
        return rows.reduce((acc, row) => +acc + +row, 0)
      }
    },
    {
      label: 'Contar',
      allowRank: true,
      apply(rows: string[]) {
        return rows.length
      }
    },
    {
      label: 'Mínimo',
      allowRank: true,
      apply(rows: string[]) {
        return rows.reduce((acc, row) => Math.min(+acc, +row), 0)
      }
    },
    {
      label: 'Máximo',
      allowRank: true,
      apply(rows: string[]) {
        return rows.reduce((acc, row) => Math.max(+acc, +row), 0)
      }
    },
    {
      label: 'Mais Comum',
      allowRank: true,
      apply(rows: string[]) {
        if (rows.length == 0) return ''
        const countEntries = Object.entries<number>(
          rows.reduce((acc, row) => {
            acc[row] = (acc?.[row] ?? 0) + 1
            return acc
          }, {})
        )

        const max = countEntries.reduce(
          (acc, entry) => (acc[1] > entry[1] ? acc : entry),
          countEntries[0]
        )
        return max[0]
      }
    }
  ])

  sourceObjects: SourceObj[] = [
    {
      label: 'Participantes',
      allowedOperations: ['Contar'],
      fetch(players: Player[]) {
        return players.map((p) => p.name)
      }
    },
    {
      label: 'Organização',
      allowedOperations: ['Mais Comum'],
      fetch(players: Player[]) {
        return players.map((p) => p.organization)
      }
    },
    {
      label: 'Sexo',
      allowedOperations: ['Mais Comum'],
      fetch(players: Player[]) {
        return players.map((p) => (p.isMale ? 'Masculino' : 'Feminino'))
      }
    },
    {
      label: 'Nome',
      allowedOperations: ['Mais Comum'],
      fetch(players: Player[]) {
        return players.map((p) => p.name)
      }
    },
    {
      label: 'Pontos',
      allowedOperations: ['Somar', 'Mínimo', 'Máximo'],
      fetch(players: Player[]) {
        return players.map((p) => getPoints(p).toString())
      }
    }
  ]

  filters: Record<string, FilterObj> = $derived(
    resultObjects.filterObjects.reduce((acc, fobj) => {
      acc[fobj.label] = fobj
      return acc
    }, {})
  )
  operations: Record<string, OperationObj> = $derived(
    resultObjects.operationObjects.reduce((acc, fobj) => {
      acc[fobj.label] = fobj
      return acc
    }, {})
  )
  sources: Record<string, SourceObj> = $derived(
    resultObjects.sourceObjects.reduce((acc, fobj) => {
      acc[fobj.label ?? 'null'] = fobj
      return acc
    }, {})
  )
}

export const resultObjects = new ResultObjects()
