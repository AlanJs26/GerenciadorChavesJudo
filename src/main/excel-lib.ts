import ExcelJS from 'exceljs'
import type { Organization, Player } from '@lib/types/bracket-lib'
import { dialog, shell, BrowserWindow } from 'electron'
import fs from 'fs/promises'

export async function organizationFromFile(
  _event: Electron.IpcMainInvokeEvent,
  path: string
): Promise<Organization> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)

  const organization: Organization = {
    organization: '',
    players: []
  }

  const worksheet = workbook.getWorksheet('Planilha1')
  if (worksheet === undefined) {
    return organization
  }

  const organizationCell = worksheet.getRow(5).getCell(2).value as string
  organization.organization = organizationCell.replace('COLÉGIO / INSTITUIÇÃO:', '').trim()

  const lastRow = worksheet?.lastRow?.number ?? 0
  const rows = worksheet.getRows(12, lastRow) ?? []

  for (const row of rows) {
    const values = row.values

    if (values.length == 0) {
      break
    } else if (
      !Array.isArray(values) ||
      values.length < 5 ||
      typeof values[2] != 'string' ||
      typeof values[4] != 'string'
    ) {
      continue
    }

    organization.players.push({
      name: (values[2] as string)?.trim() ?? '',
      isMale: ['m', 'h'].includes((values[3] as string)?.toLowerCase().trim().at(0) ?? '$'),
      category: values[4]?.replaceAll(/\(\s*?(FEM|MASC)\s*?\)/g, '').replaceAll(/\s+/g, ' ') ?? ''
    })
  }

  return organization
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
