import { electronAPI } from '@electron-toolkit/preload'
import type { State } from '@lib/types/bracket-lib'
import { fail, success } from '@shared/errors'
import { contextBridge, ipcRenderer } from 'electron'
import { webUtils } from 'electron'

import type { API } from './index.d'

// Custom APIs for renderer
const api: API = {
  // eslint-disable-next-line
  organizationFromFile: (file) => ipcRenderer.invoke('dialog:organizationFromFile', webUtils.getPathForFile(file)),

  exportPlayers: (players) => ipcRenderer.invoke('dialog:exportPlayers', players),
  // eslint-disable-next-line
  exportState: (state, defaultPath?) => ipcRenderer.invoke('dialog:exportState', state, defaultPath),

  importState: async (defaultPath?) => {
    const result = await ipcRenderer.invoke('dialog:importState', defaultPath)
    if (result.error) {
      const e = result.error
      return fail(e.name, e.message, e.cause)
    }

    try {
      const state: State = JSON.parse(result.data)
      return success(state)
    } catch {
      return fail('InvalidState', `Não foi possível processar o arquivo`)
    }
  },

  printPDF: () => ipcRenderer.invoke('dialog:printPDF')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
