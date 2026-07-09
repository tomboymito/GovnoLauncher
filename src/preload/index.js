import { contextBridge, ipcRenderer } from 'electron'
import { LAUNCHER_CHANNELS } from '../shared/ipcChannels.js'

contextBridge.exposeInMainWorld('gornilo', {
  launcher: {
    getTestPack: () => ipcRenderer.invoke(LAUNCHER_CHANNELS.GET_TEST_PACK),
    launchTestPack: () => ipcRenderer.invoke(LAUNCHER_CHANNELS.LAUNCH_TEST_PACK),
    onLog: (callback) => {
      const listener = (_event, line) => callback(line)
      ipcRenderer.on(LAUNCHER_CHANNELS.LOG, listener)
      return () => ipcRenderer.removeListener(LAUNCHER_CHANNELS.LOG, listener)
    },
    onProgress: (callback) => {
      const listener = (_event, progress) => callback(progress)
      ipcRenderer.on(LAUNCHER_CHANNELS.PROGRESS, listener)
      return () => ipcRenderer.removeListener(LAUNCHER_CHANNELS.PROGRESS, listener)
    },
    onState: (callback) => {
      const listener = (_event, state) => callback(state)
      ipcRenderer.on(LAUNCHER_CHANNELS.STATE, listener)
      return () => ipcRenderer.removeListener(LAUNCHER_CHANNELS.STATE, listener)
    }
  }
})
