// @ts-ignore typescript is not able to find exported snippets from .svelte files
import { tagsCellSnippet } from '@components/player-tab/data-table/tags-cell.svelte'
import { renderComponent } from '@components/ui/data-table'
import { compareCategory, hashCategory, unhashCategory } from '@lib/bracket-lib'
import type { Player } from '@lib/types/bracket-lib'
import type { ColumnDef } from '@tanstack/table-core'

import { winnerStore } from '@/states.svelte'

// import { createRawSnippet } from 'svelte'
// import type { Task } from '../(data)/schemas'
import {
  DataTableAddButton,
  DataTableCell,
  // DataTableCheckbox,
  DataTableColumnHeader,
  // DataTablePriorityCell,
  // DataTableStatusCell,
  // DataTableTitleCell,
  DataTableRowActions
} from './index'

function getPoints(player: Player): number {
  const gender = player.isMale ? 'male' : 'female'
  let points = 0

  for (const [hashedCategory, winners] of Object.entries(winnerStore.winnersByCategory[gender])) {
    const category = unhashCategory(hashedCategory)
    if (!compareCategory(category, player.category)) continue

    const winner = winners.winners?.find((w) => w.contestantId == player.contestantId)
    if (!winner) {
      points += 0
      continue
    }
    switch (winner.classification) {
      case 1:
        points += 7
        break
      case 2:
        points += 5
        break
      case 3:
      case 4:
        points += 3
        break
    }
  }

  return points
}

export const columns: ColumnDef<Player, string>[] = [
  // {
  //   id: 'select',
  //   header: ({ table }) =>
  //     renderComponent(DataTableCheckbox, {
  //       checked: table.getIsAllPageRowsSelected(),
  //       onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
  //       'aria-label': 'Select all',
  //       class: 'translate-y-[2px]'
  //     }),
  //   cell: ({ row }) =>
  //     renderComponent(DataTableCheckbox, {
  //       checked: row.getIsSelected(),
  //       onCheckedChange: (value) => row.toggleSelected(!!value),
  //       'aria-label': 'Select row',
  //       class: 'translate-y-[2px]'
  //     }),
  //   enableSorting: false,
  //   enableHiding: false
  // },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return renderComponent(DataTableColumnHeader, {
        column,
        title: 'Nome'
      })
    },
    cell: ({ row }) => {
      return renderComponent(DataTableCell, {
        value: row.original.name
      })
    },
    enableHiding: false
  },
  {
    accessorKey: 'isMale',
    header: ({ column }) => renderComponent(DataTableColumnHeader, { column, title: 'Sexo' }),
    cell: ({ row }) => {
      return renderComponent(DataTableCell, {
        value: row.original.isMale ? 'Masc.' : 'Fem.'
      })
    },
    filterFn: (row, id, value): boolean => {
      return value.includes(row.getValue(id))
    }
  },
  {
    accessorKey: 'organization',
    header: ({ column }) => renderComponent(DataTableColumnHeader, { column, title: 'Escola' }),
    cell: ({ row }) => {
      return renderComponent(DataTableCell, {
        value: row.original.organization
      })
    },
    filterFn: (row, id, value): boolean => {
      return value.includes(row.getValue(id))
    }
  },
  {
    id: 'category',
    accessorFn: (player: Player, _index: number) => hashCategory(player.category),
    header: ({ column }) =>
      renderComponent(DataTableColumnHeader, {
        column,
        title: 'Categoria'
      }),
    cell: ({ row }) => {
      return renderComponent(DataTableCell, {
        snippet: tagsCellSnippet,
        value: row.original.category
      })
    }
  },
  {
    id: 'points',
    accessorFn: (player: Player, _index: number) => getPoints(player).toString(),
    header: ({ column, table }) =>
      renderComponent(DataTableColumnHeader, {
        column,
        title: `Pontos (${table.getRowModel().flatRows.reduce((acc, row) => acc + +row.getValue<string>('points'), 0)})`
      }),
    cell: ({ row }) => {
      return renderComponent(DataTableCell, {
        value: getPoints(row.original),
        center: true
      })
    },
    sortingFn: (rowA, rowB, id): number => {
      return +rowA.getValue<string>(id) - +rowB.getValue<string>(id)
    }
  },
  {
    accessorKey: 'present',
    header: ({ column }) => {
      return renderComponent(DataTableColumnHeader, {
        title: 'Presença',
        column
      })
    },
    cell: ({ row }) => {
      return renderComponent(DataTableCell, {
        value: row.original.present ? 'Sim' : 'Não'
      })
    }
  },
  {
    id: 'actions',
    header: ({ table }) => {
      return renderComponent(DataTableAddButton, {
        table
      })
    },
    cell: ({ row, table }) => renderComponent(DataTableRowActions, { row, table })
  }
]
