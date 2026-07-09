import { readFile } from 'fs/promises'
import { createHash } from 'crypto'
import { join } from 'path'
import { fetchVersionJson, downloadClientJar } from './mojangManifest.js'
import { downloadLibraries } from './libraries.js'
import { downloadAssets } from './assets.js'
import { ensureForgeInstalled } from './forgeInstaller.js'
import { resolveVersion } from './versionResolve.js'
import { buildLaunchArgs, spawnGame } from './launch.js'
import { findCompatibleJava } from './javaLocator.js'
import { nativesDir, assetsDir, packDir, packsRoot } from './paths.js'

const TEST_USERNAME = 'Gornilo_Player'

// Matches Minecraft's offline-mode UUID derivation: UUID.nameUUIDFromBytes("OfflinePlayer:<name>").
function offlinePlayerUuid(username) {
  const hash = createHash('md5').update(`OfflinePlayer:${username}`).digest()
  hash[6] = (hash[6] & 0x0f) | 0x30
  hash[8] = (hash[8] & 0x3f) | 0x80
  const hex = hash.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function readTestPackConfig() {
  const path = join(packsRoot(), 'test-pack', 'pack.json')
  return JSON.parse(await readFile(path, 'utf-8'))
}

// Full pipeline: resolve vanilla version -> download libs/client/assets ->
// install Forge headlessly -> merge versions -> launch java with this pack's mods.
export async function launchTestPack({ onLog, onProgress, onExit }) {
  const pack = await readTestPackConfig()
  const { mcVersion, forgeVersion } = pack

  onLog(`Читаю конфигурацию тестовой сборки: Minecraft ${mcVersion}, Forge ${forgeVersion}`)

  onLog('Получаю манифест версии Mojang...')
  const vanillaJson = await fetchVersionJson(mcVersion)

  const requiredJavaMajor = vanillaJson.javaVersion?.majorVersion || 17
  onLog(`Ищу подходящую Java (нужна ${requiredJavaMajor}+)...`)
  const javaBin = await findCompatibleJava(requiredJavaMajor, { onLog })

  onLog('Скачиваю библиотеки Minecraft...')
  await downloadLibraries(vanillaJson.libraries, {
    nativesOutDir: nativesDir(mcVersion),
    onProgress: (p) => onProgress?.({ stage: 'libraries', ...p })
  })

  onLog('Скачиваю клиент Minecraft...')
  const clientJarPath = await downloadClientJar(vanillaJson)

  onLog('Скачиваю ресурсы (assets)...')
  await downloadAssets(vanillaJson.assetIndex, {
    onProgress: (p) => onProgress?.({ stage: 'assets', ...p })
  })

  const forgeId = await ensureForgeInstalled(mcVersion, forgeVersion, javaBin, { onLog })

  onLog('Собираю итоговую версию (Forge + vanilla)...')
  const versionSpec = await resolveVersion(forgeId)

  onLog('Довскачиваю библиотеки Forge (если появились новые)...')
  await downloadLibraries(versionSpec.libraries, {
    nativesOutDir: nativesDir(forgeId),
    onProgress: (p) => onProgress?.({ stage: 'forge-libraries', ...p })
  })

  const gameDir = packDir(pack.id)
  const username = TEST_USERNAME
  const uuid = offlinePlayerUuid(username)

  const javaArgs = buildLaunchArgs(versionSpec, {
    gameDir,
    clientJarPath,
    nativesDirPath: nativesDir(mcVersion),
    assetsRootPath: assetsDir(),
    username,
    uuid
  })

  onLog(`Запускаю Minecraft (${forgeId}) из ${gameDir}...`)
  return spawnGame(javaBin, javaArgs, { gameDir, onLog, onExit })
}
