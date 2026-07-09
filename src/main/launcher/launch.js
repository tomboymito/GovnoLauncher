import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import { buildClasspath } from './libraries.js'

const OS_NAME = { win32: 'windows', darwin: 'osx', linux: 'linux' }[process.platform]

function rulesAllow(rules, features) {
  if (!rules || rules.length === 0) return true
  let allowed = false
  for (const rule of rules) {
    let matches = true
    if (rule.os?.name && rule.os.name !== OS_NAME) matches = false
    if (rule.features) {
      for (const [key, expected] of Object.entries(rule.features)) {
        if (Boolean(features?.[key]) !== expected) matches = false
      }
    }
    if (matches) allowed = rule.action === 'allow'
  }
  return allowed
}

function substitute(str, placeholders) {
  return str.replace(/\$\{(\w+)\}/g, (_, key) => placeholders[key] ?? `\${${key}}`)
}

function resolveArgList(argList, placeholders, features) {
  const out = []
  for (const entry of argList || []) {
    if (typeof entry === 'string') {
      out.push(substitute(entry, placeholders))
      continue
    }
    if (!rulesAllow(entry.rules, features)) continue
    const values = Array.isArray(entry.value) ? entry.value : [entry.value]
    for (const v of values) out.push(substitute(v, placeholders))
  }
  return out
}

// Builds the full `java <jvm args> <mainClass> <game args>` argument list for
// a resolved (merged Forge+vanilla) version spec.
export function buildLaunchArgs(versionSpec, options) {
  const {
    gameDir,
    clientJarPath,
    nativesDirPath,
    assetsRootPath,
    username,
    uuid,
    accessToken = '-',
    userType = 'msa',
    versionType = 'release',
    memoryMinMb = 2048,
    memoryMaxMb = 4096
  } = options

  const classpath = buildClasspath(versionSpec.libraries, [clientJarPath])
  const placeholders = {
    natives_directory: nativesDirPath,
    launcher_name: 'gornilo-launcher',
    launcher_version: '0.1.0',
    classpath,
    auth_player_name: username,
    version_name: versionSpec.id,
    game_directory: gameDir,
    assets_root: assetsRootPath,
    assets_index_name: versionSpec.assets,
    auth_uuid: uuid,
    auth_access_token: accessToken,
    clientid: '-',
    auth_xuid: '-',
    user_type: userType,
    version_type: versionType
  }

  const features = {}
  const jvmArgs = versionSpec.arguments?.jvm
    ? resolveArgList(versionSpec.arguments.jvm, placeholders, features)
    : [`-Djava.library.path=${nativesDirPath}`, '-cp', classpath]

  const gameArgs = versionSpec.arguments?.game
    ? resolveArgList(versionSpec.arguments.game, placeholders, features)
    : (versionSpec.minecraftArguments || '')
        .split(' ')
        .filter(Boolean)
        .map((arg) => substitute(arg, placeholders))

  return [
    `-Xms${memoryMinMb}M`,
    `-Xmx${memoryMaxMb}M`,
    ...jvmArgs,
    versionSpec.mainClass,
    ...gameArgs
  ]
}

// Spawns the java process, streaming stdout/stderr line-by-line into onLog.
export async function spawnGame(javaBin, javaArgs, { gameDir, onLog, onExit }) {
  await mkdir(gameDir, { recursive: true })

  const proc = spawn(javaBin, javaArgs, { cwd: gameDir, stdio: ['ignore', 'pipe', 'pipe'] })

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

  proc.on('exit', (code) => onExit?.(code))

  return proc
}
