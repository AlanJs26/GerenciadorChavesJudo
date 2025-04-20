import ExcelJS from 'exceljs'
import type { Organization, Player } from '@lib/types/bracket-lib'
import { dialog, shell, BrowserWindow } from 'electron'
import type { ResultError } from '@lib/types/errors'
import fs from 'fs/promises'

function cellToText(value: ExcelJS.CellValue | undefined): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'object' && 'richText' in value) {
    // Rich text cell
    return value.richText.map((t) => t.text).join('')
  }
  if (typeof value === 'object' && 'text' in value) {
    // Formula or shared string
    return value.text
  }
  return value.toString()
}

function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  )
}

function normalizeCategory(category: string | undefined): string {
  return category?.replaceAll(/\(\s*?(FEM|MASC)\s*?\)/g, '')?.replaceAll(/\s+/g, ' ') ?? ''
}

export async function organizationFromFile(
  _event: Electron.IpcMainInvokeEvent,
  path: string
): Promise<ResultError<Organization>> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)

  const organization: Organization = {
    organization: '',
    players: []
  }

  const worksheet = workbook.getWorksheet('Planilha1')
  if (worksheet === undefined) {
    return {
      error: {
        name: 'ExcelOrganizationError',
        cause: {
          file: path,
          message: 'Planilha não encontrada'
        }
      },
      result: null
    }
  }

  const organizationCell = cellToText(worksheet.getRow(5).getCell(2).value)
  organization.organization = toTitleCase(
    organizationCell.replace(/COLÉGIO \/ INSTITUIÇÃO:\s*(.+)/i, '$1').trim()
  )
  if (!organization.organization) {
    return {
      error: {
        name: 'ExcelOrganizationError',
        cause: {
          file: path,
          cell: organizationCell,
          message: 'Não foi possível encontrar a célula com o nome da instituição'
        }
      },
      result: null
    }
  }

  const lastRow = worksheet?.lastRow?.number ?? 0
  const rows = worksheet.getRows(12, lastRow) ?? []

  for (const row of rows) {
    if (!Array.isArray(row.values)) continue
    if (row.values.length == 0) break
    if (row.values.length == 2) continue

    const [_, ...values] = row.values.map((v) => cellToText(v).trim())

    const fields = [
      { value: values?.[1], message: 'Participante com nome inválido' },
      { value: values?.[2], message: 'Participante com gênero inválido' },
      { value: values?.[3], message: 'Participante com categoria inválida' }
    ]

    for (const { value, message } of fields) {
      if (!value) {
        return {
          error: {
            name: 'ExcelPlayerError',
            cause: {
              file: path,
              n: values?.[0],
              cell: value,
              message
            }
          },
          result: null
        }
      }
    }

    const player = {
      name: toTitleCase(values?.[1]),
      isMale: /^(ma|ho|menino|garoto)/i.test(values?.[2]),
      category: normalizeCategory(values?.[3])
    }

    organization.players.push(player)
  }

  return { result: organization, error: null }
}

export async function exportPlayers(
  _event: Electron.IpcMainInvokeEvent,
  players: Player[]
): Promise<void> {
  const dialogResult = await dialog.showSaveDialog({
    title: 'Exportar jogadores',
    defaultPath: `jogadores-${new Date().toISOString()}.xlsx`,
    filters: [
      {
        name: 'Excel',
        extensions: ['xlsx']
      }
    ]
  })

  if (dialogResult.canceled || !dialogResult.filePath) {
    console.warn('Exportação cancelada')
    return
  }
  const filePath = dialogResult.filePath

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Planilha1')

  worksheet.columns = [
    { header: 'Nome', key: 'name', width: 30 },
    { header: 'Sexo', key: 'isMale', width: 10 },
    { header: 'Categoria', key: 'category', width: 20 },
    { header: 'Escola', key: 'organization', width: 30 },
    { header: 'Presença', key: 'present', width: 30 }
  ]

  players.forEach(({ name, isMale, category, organization, present }) => {
    worksheet.addRow({
      name,
      isMale: isMale ? 'Masc.' : 'Fem.',
      category,
      organization,
      present: present ? 'Sim' : 'Não'
    })
  })

  workbook.xlsx.writeFile(filePath)
}

export async function printPDF(event: Electron.IpcMainInvokeEvent): Promise<string> {
  const win = BrowserWindow.fromWebContents(event.sender)

  if (!win) {
    throw new Error('No window found for the given web contents')
  }

  const dialogResult = await dialog.showSaveDialog({
    title: 'Exportar Chave para PDF',
    defaultPath: `chave.pdf`,
    filters: [
      {
        name: 'PDF',
        extensions: ['pdf']
      }
    ]
  })

  if (dialogResult.canceled || !dialogResult.filePath) {
    throw new Error('Exportação cancelada')
  }
  const filePath = dialogResult.filePath

  const data = await win.webContents.printToPDF({
    // printBackground: true,
    landscape: true
    // preferCSSPageSize: true
  })

  await fs.writeFile(filePath, data)

  shell.openExternal('file://' + filePath)

  return filePath
}
