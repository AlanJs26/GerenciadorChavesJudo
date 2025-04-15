import type { ColumnDef } from '@tanstack/table-core'
import { createRawSnippet } from 'svelte'
import type { Task } from '../(data)/schemas'
import {
  DataTableCheckbox,
  DataTableColumnHeader,
  DataTableCell,
  DataTablePriorityCell,
  DataTableRowActions,
  DataTableStatusCell,
  DataTableTitleCell
} from './index'
import { renderComponent, renderSnippet } from '@components/ui/data-table'
import type { Player } from '@lib/types/bracket-lib'

export const columns: ColumnDef<Player>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      renderComponent(DataTableCheckbox, {
        checked: table.getIsAllPageRowsSelected(),
        onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
        'aria-label': 'Select all',
        class: 'translate-y-[2px]'
      }),
    cell: ({ row }) =>
      renderComponent(DataTableCheckbox, {
        checked: row.getIsSelected(),
        onCheckedChange: (value) => row.toggleSelected(!!value),
        'aria-label': 'Select row',
        class: 'translate-y-[2px]'
      }),
    enableSorting: false,
    enableHiding: false
  },
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
    accessorKey: 'presence',
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
    },
    filterFn: (row, id, value): boolean => {
      return value.includes(row.getValue(id))
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => renderComponent(DataTableRowActions<Player>, { row })
  }
]
