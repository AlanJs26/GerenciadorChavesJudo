import type { Organization, Player } from '@lib/types/bracket-lib'
import { fail, type Result, success } from '@shared/errors'
import ExcelJS from 'exceljs'

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

// TODO: Filtrar worksheets de judo
function mapNescauPeso(isMale: boolean, age: string, weight: number): Result<string> {
  // rows: age (KIDS, pré-mirim, ...)
  // columns: peso (Ligeiro, Leve, ...)
  const maleMatrix = [
    [26, 32, 40, 50, 50],
    [30, 36, 45, 55, 55],
    [31, 38, 42, 60, 60],
    [45, 55, 66, 81, 81],
    [55, 66, 81, 81],
    [26, 32, 40, 50, 50]
  ]
  const femaleMatrix = [
    [26, 32, 40, 50, 50],
    [30, 36, 45, 55, 55],
    [31, 38, 47, 60, 60],
    [40, 48, 57, 70, 70],
    [44, 52, 63, 63],
    [26, 32, 40, 50, 50]
  ]
  const allAges = ['Kids', 'Pré Mirim', 'Mirim', 'Infantil', 'Juvenil', 'Adaptado']
  const allPesos = ['Ligeiro', 'Leve', 'Médio', 'Pesado', 'Super Pesado']

  const matrix = isMale ? maleMatrix : femaleMatrix

  const ageIndex = allAges.indexOf(age)

  if (ageIndex == -1) {
    return fail('Invalid age', `"${age}" não é uma categoria válida`)
  }

  const pesoIndex = matrix[ageIndex].findIndex((testWeight) => weight < testWeight)
  const peso = pesoIndex == -1 ? allPesos[matrix[ageIndex].length - 1] : allPesos[pesoIndex]
  return success(peso)
}

function normalizeCategory(category: string | undefined): string {
  return (
    category
      ?.replaceAll(/\(\s*?(FEM|MASC)\s*?\)/g, '')
      ?.replaceAll(/[0-9]+\s*kg/g, '')
      ?.replaceAll(/\s+/g, ' ') ?? ''
  )
}

export async function readNescauForm(path: string): Promise<Result<Organization[]>> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)

  const organizations: Record<string, Organization> = {}

  for (const worksheet of workbook.worksheets) {
    const typeCell = cellToText(worksheet.getRow(1).getCell(1).value)
    if (!typeCell.match(/judô/i)) {
      continue
    }

    const ageCategoryCell = cellToText(worksheet.getRow(2).getCell(1).value)
    const ageCategory = toTitleCase(ageCategoryCell.replace(/Categoria:\s*(.+)/i, '$1').trim())
    const genderCell = cellToText(worksheet.getRow(3).getCell(1).value)
    const gender = toTitleCase(genderCell.replace(/GÊNERO:\s*(.+)/i, '$1'))

    if (ageCategory == 'Adaptado') continue

    if (!ageCategory) {
      return fail('ExcelCellError', `Não foi possível extrair a categoria`, {
        file: path,
        cell: ageCategoryCell
      })
    }
    if (!gender) {
      return fail('ExcelCellError', `Não foi possível extrair o gênero`, {
        file: path,
        cell: genderCell
      })
    }

    const lastRow = worksheet?.lastRow?.number ?? 0
    const rows = worksheet.getRows(5, lastRow) ?? []

    for (const row of rows) {
      if (!Array.isArray(row.values)) continue
      if (row.values.length == 0) break
      if (row.values.length == 2) continue

      const [_, ...values] = row.values.map((v) => cellToText(v).trim())

      const fields = [
        { value: values?.[0], message: 'Participante com nome inválido' },
        { value: values?.[2], message: 'Participante com instituição/responsável inválido' },
        { value: values?.[3], message: 'Participante com peso inválido' }
      ]

      for (const { value, message } of fields) {
        if (!value) {
          return fail('ExcelPlayerError', message, {
            file: path,
            n: values?.[0],
            cell: value
          })
        }
      }

      const pesoResult = mapNescauPeso(gender == 'Masculino', ageCategory, +values?.[3])
      if (!pesoResult.status) {
        return fail('ExcelPlayerError', pesoResult.error.name + ': ' + pesoResult.error.message, {
          file: path,
          n: values?.[0],
          cell: values?.[3]
        })
      }
      const peso = pesoResult.data

      const player: Omit<Player, 'organization' | 'present' | 'contestantId'> = {
        name: toTitleCase(values?.[0]),
        isMale: gender == 'Masculino',
        category: [
          { id: 'Idade', value: ageCategory },
          { id: 'Peso', value: peso }
        ]
      }

      const organizationName = toTitleCase(values?.[2])

      if (organizationName in organizations) {
        organizations[organizationName].players.push(player)
      } else {
        organizations[organizationName] = {
          organization: organizationName,
          players: [player]
        }
      }
    }
  }

  return success(Object.values(organizations))
}

export async function readLJEForm(path: string): Promise<Result<Organization[]>> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)

  const organization: Organization = {
    organization: '',
    players: []
  }

  const worksheet = workbook.worksheets[0]
  if (worksheet === undefined) {
    return fail('ExcelOrganizationError', 'Planilha não encontrada', {
      file: path
    })
  }

  const organizationCell = cellToText(worksheet.getRow(5).getCell(2).value)
  organization.organization = toTitleCase(
    organizationCell.replace(/COLÉGIO \/ INSTITUIÇÃO:\s*(.+)/i, '$1').trim()
  )
  if (!organization.organization) {
    return fail(
      'ExcelOrganizationError',
      'Não foi possível encontrar a célula com o nome da instituição',
      {
        file: path,
        cell: organizationCell
      }
    )
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
        return fail('ExcelPlayerError', message, {
          file: path,
          n: values?.[0],
          cell: value
        })
      }
    }

    const player: Omit<Player, 'organization' | 'present' | 'contestantId'> = {
      name: toTitleCase(values?.[1]),
      isMale: /^(ma|ho|menino|garoto)/i.test(values?.[2]),
      category: normalizeCategory(values?.[3])
        .split('-')
        .map((str) => ({
          id: str.includes('SUB') ? 'SUB' : 'Peso',
          value: str
        }))
    }

    organization.players.push(player)
  }

  return success([organization])
}
