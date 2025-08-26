import type { Organization, Player } from '@lib/types/bracket-lib'
import type { TableExport } from '@lib/types/data-table'
import { fail, type Result, success } from '@shared/errors'
import { BrowserWindow, dialog, shell } from 'electron'
import ExcelJS from 'exceljs'
import { existsSync } from 'fs'
import fs, { readFile, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'

import { readLJEForm, readNescauForm } from './excel-forms'

export async function organizationFromFile(
  _event: Electron.IpcMainInvokeEvent,
  type: string,
  path: string
): Promise<Result<Organization[]>> {
  const forms: Record<string, (path: string) => Promise<Result<Organization[]>>> = {
    nescau: readNescauForm,
    lje: readLJEForm
  }
  if (!(type in forms)) {
    return fail('Invalid Type', `O tipo de ficha "${type}" não é suportado`)
  }
  return await forms[type](path)
}

export async function exportTable(
  _event: Electron.IpcMainInvokeEvent,
  tableData: TableExport | TableExport[],
  defaultPath?: string
): Promise<Result<void>> {
  const dialogResult = await dialog.showSaveDialog({
    title: 'Exportar',
    defaultPath: defaultPath ?? `tabela-${new Date().toISOString()}.xlsx`,
    filters: [
      {
        name: 'Excel',
        extensions: ['xlsx']
      }
    ]
  })

  if (dialogResult.canceled || !dialogResult.filePath) {
    console.warn('Exportação cancelada')
    return fail('Cancelled', 'Exportação cancelada')
  }
  const filePath = dialogResult.filePath

  if (!Array.isArray(tableData)) {
    tableData = [tableData]
  }

  const workbook = new ExcelJS.Workbook()
  for (const data of tableData) {
    const worksheet = workbook.addWorksheet(data.name)

    worksheet.columns = data.headers.at(-1)!.map(({ id }) => ({
      key: id
    }))

    const rowsToMerge: Record<
      string,
      {
        row: { start: number; end: number }
        column: number
      }
    > = {}
    for (const [i, headers] of Object.entries(data.headers)) {
      const header: string[] = []
      const colsToMerge: { start: number; end: number }[] = []
      let totalColSpan = 0
      for (const { label, colSpan, id } of headers) {
        header.push(label)

        if (colSpan > 1) {
          colsToMerge.push({
            start: totalColSpan + 1,
            end: totalColSpan + colSpan
          })
        } else {
          if (label in rowsToMerge) {
            rowsToMerge[id].row.end = +i + 1
          } else {
            rowsToMerge[id] = {
              row: { start: +i + 1, end: +i + 1 },
              column: totalColSpan + 1
            }
          }
        }
        totalColSpan += colSpan
        for (let i = 0; i < colSpan - 1; i++) {
          header.push('')
        }
      }
      worksheet.addRow(header)
      const rowIdx = worksheet.rowCount // Find out how many rows are there currently
      for (const { start, end } of colsToMerge) {
        worksheet.mergeCells(rowIdx, start, rowIdx, end)
      }
    }

    for (const { row, column } of Object.values(rowsToMerge)) {
      if (row.start == row.end) continue
      worksheet.mergeCells(row.start, column, row.end, column)
    }

    data.rows.forEach((row) => {
      worksheet.addRow(row)
    })

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        }
      })
    })
  }

  try {
    await workbook.xlsx.writeFile(filePath)
    return success(undefined)
  } catch (error) {
    const e = error as Error
    return fail(e.name, e.message)
  }
}

export async function printPDF(event: Electron.IpcMainInvokeEvent): Promise<Result<string>> {
  const win = BrowserWindow.fromWebContents(event.sender)

  if (!win) {
    return fail('UnknownWindow', 'No window found for the given web contents')
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
    return fail('Canceled', 'Exportação cancelada')
  }
  const filePath = dialogResult.filePath

  const data = await win.webContents.printToPDF({
    landscape: true,
    pageSize: 'A4'
  })

  await fs.writeFile(filePath, data)

  shell.openExternal('file://' + filePath)

  return success(filePath)
}

export async function exportState(
  _event: Electron.IpcMainInvokeEvent,
  state: string,
  defaultPath?: string
): Promise<Result<void>> {
  let filePath = ''

  if (defaultPath) {
    filePath = path.resolve(defaultPath.replace(/^~/, os.homedir()))

    if (!filePath.endsWith('.json')) {
      return fail('WrongExtension', 'Extensão de arquivo incorreta')
    }

    const dirname = path.dirname(filePath)

    if (!existsSync(dirname)) {
      fs.mkdir(dirname, { recursive: true })
    }
  } else {
    const dialogResult = await dialog.showSaveDialog({
      title: 'Exportar Dados',
      defaultPath: `dados.json`,
      filters: [
        {
          name: 'Json',
          extensions: ['json']
        }
      ]
    })

    if (dialogResult.canceled || !dialogResult.filePath) {
      return fail('Canceled', 'Exportação cancelada')
    }

    filePath = dialogResult.filePath
  }

  try {
    await writeFile(filePath, state)

    return success(undefined)
  } catch (error) {
    const e = error as Error
    return fail(e.name, e.message)
  }
}

export async function importState(
  _event: Electron.IpcMainInvokeEvent,
  defaultPath?: string
): Promise<Result<string>> {
  let filePath = ''

  if (defaultPath) {
    filePath = path.resolve(defaultPath.replace(/^~/, os.homedir()))

    if (!filePath.endsWith('.json')) {
      return fail('WrongExtension', 'Extensão de arquivo incorreta')
    }
  } else {
    const dialogResult = await dialog.showOpenDialog({
      title: 'Importar Dados',
      filters: [
        {
          name: 'Json',
          extensions: ['json']
        }
      ]
    })

    if (dialogResult.canceled || !dialogResult.filePaths.length) {
      return fail('Cancelled', 'Importação cancelada')
    }

    filePath = dialogResult.filePaths[0]
  }

  try {
    const stateString = await readFile(filePath, { encoding: 'utf8' })

    const stateKeys = ['brackets', 'players', 'winnersByCategory']
    if (!stateKeys.every((k) => stateString.includes(k)))
      return fail('InvalidState', `Arquivo de estado "${path.basename(filePath)}" inválido`)

    return success(stateString)
  } catch (error) {
    const e = error as Error
    return fail(e.name, e.message)
  }
}
