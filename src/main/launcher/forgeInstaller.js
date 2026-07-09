import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { spawn } from 'child_process'
import { downloadFile } from './downloader.js'
import { runtimeRoot, versionsDir } from './paths.js'

const FORGE_MAVEN_BASE = 'https://maven.minecraftforge.net/net/minecraftforge/forge'

export function forgeVersionId(mcVersion, forgeVersion) {
  return `${mcVersion}-forge-${forgeVersion}`
}

async function fetchSha1(url) {
  const response = await fetch(`${url}.sha1`)
  if (!response.ok) return null
  return (await response.text()).trim()
}

// The Forge installer's client-install step refuses to run unless it finds a
// launcher_profiles.json in the target dir (its heuristic for "this is a real
// .minecraft folder"). We never run the vanilla launcher there, so seed a
// minimal stub ourselves — its content is otherwise unused by us.
async function ensureLauncherProfilesStub() {
  const path = join(runtimeRoot(), 'launcher_profiles.json')
  if (existsSync(path)) return
  await mkdir(runtimeRoot(), { recursive: true })
  await writeFile(path, JSON.stringify({ profiles: {}, settings: {}, version: 3 }), 'utf-8')
}

function runJava(javaBin, args, { onLog } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(javaBin, args, { stdio: ['ignore', 'pipe', 'pipe'] })

    const forwardLines = (stream) => {
      let buffer = ''
      stream.on('data', (chunk) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) onLog?.(line)
      })
    }
    forwardLines(proc.stdout)
    forwardLines(proc.stderr)

    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`java exited with code ${code}`))
    })
  })
}

// Ensures the Forge patched client + libraries are installed in runtimeRoot(),
// which has the same versions/libraries layout as a real .minecraft directory.
// Skips the (slow) installer run if the target version was already installed.
export async function ensureForgeInstalled(mcVersion, forgeVersion, javaBin, { onLog } = {}) {
  const versionId = forgeVersionId(mcVersion, forgeVersion)
  const versionJsonPath = join(versionsDir(), versionId, `${versionId}.json`)
  if (existsSync(versionJsonPath)) {
    onLog?.(`Forge ${forgeVersion} для Minecraft ${mcVersion} уже установлен, пропускаем установщик.`)
    return versionId
  }

  const installerName = `forge-${mcVersion}-${forgeVersion}-installer.jar`
  const installerUrl = `${FORGE_MAVEN_BASE}/${mcVersion}-${forgeVersion}/${installerName}`
  const installerPath = join(runtimeRoot(), 'forge-installers', installerName)

  onLog?.(`Скачиваем установщик Forge: ${installerUrl}`)
  const sha1 = await fetchSha1(installerUrl)
  await downloadFile(installerUrl, installerPath, { sha1 })

  await ensureLauncherProfilesStub()

  onLog?.('Запускаем установку Forge (headless)...')
  await runJava(javaBin, ['-jar', installerPath, '--installClient', runtimeRoot()], { onLog })

  if (!existsSync(versionJsonPath)) {
    throw new Error(`Установщик Forge завершился успешно, но ${versionId}.json не найден`)
  }

  return versionId
}
