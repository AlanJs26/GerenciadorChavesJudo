import type { ColumnDef } from '@tanstack/table-core'
// import { createRawSnippet } from 'svelte'
// import type { Task } from '../(data)/schemas'
import {
  // DataTableCheckbox,
  DataTableColumnHeader,
  DataTableCell,
  // DataTablePriorityCell,
  // DataTableStatusCell,
  // DataTableTitleCell,
  DataTableRowActions,
  DataTableAddButton
} from './index'
import { renderComponent } from '@components/ui/data-table'
import type { Player } from '@lib/types/bracket-lib'
import { winnerStore } from '@/states.svelte'

function getPoints(player: Player): number {
  let points = 0

  for (const [category, winners] of Object.entries(winnerStore.winnersByCategory)) {
    if (category != player.category) continue

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
        points += 3
        break
    }
  }

  return points
}

export const columns: ColumnDef<Player>[] = [
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
    header: ({ column }): unknown => {
      return renderComponent(DataTableColumnHeader<Player, unknown>, {
        column,
        title: 'Nome'
      })
    },
    cell: ({ row }): unknown => {
      return renderComponent(DataTableCell, {
        value: row.original.name
      })
    },
    enableHiding: false
  },
  {
    accessorKey: 'isMale',
    header: ({ column }) =>
      renderComponent(DataTableColumnHeader<Player, unknown>, { column, title: 'Sexo' }),
    cell: ({ row }): unknown => {
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
    header: ({ column }) =>
      renderComponent(DataTableColumnHeader<Player, unknown>, { column, title: 'Escola' }),
    cell: ({ row }): unknown => {
      return renderComponent(DataTableCell, {
        value: row.original.organization
      })
    },
    filterFn: (row, id, value): boolean => {
      return value.includes(row.getValue(id))
    }
  },
  {
    accessorKey: 'category',
    header: ({ column }) =>
      renderComponent(DataTableColumnHeader<Player, unknown>, {
        column,
        title: 'Categoria'
      }),
    cell: ({ row }): unknown => {
      return renderComponent(DataTableCell, {
        value: row.original.category
      })
    },
    filterFn: (row, id, value): boolean => {
      return value.includes(row.getValue(id))
    }
  },
  {
    id: 'points',
    accessorFn: (player: Player, _index: number) => getPoints(player).toString(),
    header: ({ column, table }) =>
      renderComponent(DataTableColumnHeader<Player, unknown>, {
        column,
        title: `Pontos (${table.getRowModel().flatRows.reduce((acc, row) => acc + +row.getValue('points'), 0)})`
      }),
    cell: ({ row }): unknown => {
      return renderComponent(DataTableCell, {
        value: getPoints(row.original),
        center: true
      })
    },
    sortingFn: (rowA, rowB, id): number => {
      return +rowA.getValue(id) - +rowB.getValue(id)
    }
  },
  {
    accessorKey: 'present',
    header: ({ column }): unknown => {
      return renderComponent(DataTableColumnHeader<Player, unknown>, {
        title: 'Presença',
        column
      })
    },
    cell: ({ row }): unknown => {
      return renderComponent(DataTableCell, {
        value: row.original.present ? 'Sim' : 'Não'
      })
    }
  },
  {
    id: 'actions',
    header: ({ table }): unknown => {
      return renderComponent(DataTableAddButton<Player>, {
        table
      })
    },
    cell: ({ row, table }) => renderComponent(DataTableRowActions<Player>, { row, table })
  }
]
