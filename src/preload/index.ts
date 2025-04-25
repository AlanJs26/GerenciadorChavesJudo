import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Player, Organization } from '@lib/types/bracket-lib'
import type { ResultError } from '@lib/types/errors'
import { webUtils } from 'electron'

// Custom APIs for renderer
const api = {
  organizationFromFile: (file: File): Promise<ResultError<Organization>> =>
    ipcRenderer.invoke('dialog:organizationFromFile', webUtils.getPathForFile(file)),
  exportPlayers: (players: Player[]): Promise<void> =>
    ipcRenderer.invoke('dialog:exportPlayers', players),
  exportState: (state: string, defaultPath?: string): Promise<ResultError<void>> =>
    ipcRenderer.invoke('dialog:exportState', state, defaultPath),
  importState: (defaultPath?: string): Promise<ResultError<string>> =>
    ipcRenderer.invoke('dialog:importState', defaultPath),
  printPDF: (): Promise<string> => ipcRenderer.invoke('dialog:printPDF')
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
