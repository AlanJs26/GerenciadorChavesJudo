import ExcelJS from 'exceljs'
import type { Organization } from '@lib/types/bracket-lib'
import { webUtils } from 'electron'

export async function organizationFromFile(file: File): Promise<Organization> {
  const path = webUtils.getPathForFile(file)
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
