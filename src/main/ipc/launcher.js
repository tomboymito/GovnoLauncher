import { ipcMain } from 'electron'
import { LAUNCHER_CHANNELS } from '../../shared/ipcChannels.js'
import { readTestPackConfig, launchTestPack } from '../launcher/testPackLauncher.js'

let runningState = 'idle'

export function registerLauncherIpc() {
  ipcMain.handle(LAUNCHER_CHANNELS.GET_TEST_PACK, async () => {
    try {
      return await readTestPackConfig()
    } catch {
      return null
    }
  })

  ipcMain.handle(LAUNCHER_CHANNELS.LAUNCH_TEST_PACK, async (event) => {
    if (runningState !== 'idle') {
      return { ok: false, error: 'Запуск уже выполняется' }
    }

    const send = (channel, payload) => {
      if (!event.sender.isDestroyed()) event.sender.send(channel, payload)
    }
    const setState = (state) => {
      runningState = state
      send(LAUNCHER_CHANNELS.STATE, state)
    }

    setState('preparing')
    try {
      const proc = await launchTestPack({
        onLog: (line) => send(LAUNCHER_CHANNELS.LOG, line),
        onProgress: (progress) => send(LAUNCHER_CHANNELS.PROGRESS, progress),
        onExit: (code) => {
          send(LAUNCHER_CHANNELS.LOG, `Процесс Minecraft завершился с кодом ${code}`)
          setState('idle')
        }
      })
      setState('running')
      return { ok: true, pid: proc.pid }
    } catch (err) {
      send(LAUNCHER_CHANNELS.LOG, `Ошибка: ${err.message}`)
      setState('idle')
      return { ok: false, error: err.message }
    }
  })
}
