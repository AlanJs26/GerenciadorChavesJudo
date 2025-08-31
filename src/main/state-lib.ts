import { fail, type Result, success } from '@shared/errors'
import { dialog } from 'electron'
import { existsSync } from 'fs'
import fs, { readFile, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'

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

    const stateKeys = ['brackets', 'players', 'winnersByCategory', 'resultTables']
    if (!stateKeys.every((k) => stateString.includes(k)))
      return fail('InvalidState', `Arquivo de estado "${path.basename(filePath)}" inválido`)

    return success(stateString)
  } catch (error) {
    const e = error as Error
    return fail(e.name, e.message)
  }
}
