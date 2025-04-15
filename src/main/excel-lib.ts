import ExcelJS from 'exceljs'
import type { Organization, Player } from '@lib/types/bracket-lib'
import { dialog } from 'electron'

export async function organizationFromFile(
  event: Electron.IpcMainInvokeEvent,
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

  const lastRow = worksheet?.lastRow?.number
  if (!lastRow) {
    return organization
  }
  const rows = worksheet.getRows(12, lastRow)
  if (!rows) {
    return organization
  }
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
      name: values[2],
      isMale: values[3] == 'MASC.',
      category: values[4] ?? ''
    })
  }

  return organization
}

export async function exportPlayers(
  event: Electron.IpcMainInvokeEvent,
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
