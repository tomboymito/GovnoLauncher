import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const WINDOWS_JAVA_BASES = [
  'C:\\Program Files\\Eclipse Adoptium',
  'C:\\Program Files\\Java',
  'C:\\Program Files\\Microsoft',
  'C:\\Program Files (x86)\\Java'
]
const MAC_JAVA_BASE = '/Library/Java/JavaVirtualMachines'
const LINUX_JAVA_BASES = ['/usr/lib/jvm']

function javaBinaryName() {
  return process.platform === 'win32' ? 'java.exe' : 'java'
}

function listSubdirs(base) {
  try {
    return readdirSync(base, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => join(base, e.name))
  } catch {
    return []
  }
}

// Given a JDK/JRE "home" directory, returns the java executable inside it
// (handling macOS's Contents/Home nesting), or null if none is found there.
function resolveBinFromHome(homeDir) {
  const direct = join(homeDir, 'bin', javaBinaryName())
  if (existsSync(direct)) return direct
  const macNested = join(homeDir, 'Contents', 'Home', 'bin', javaBinaryName())
  if (existsSync(macNested)) return macNested
  return null
}

function candidateBinaries() {
  const candidates = []

  if (process.env.JAVA_HOME) {
    const bin = resolveBinFromHome(process.env.JAVA_HOME)
    if (bin) candidates.push(bin)
  }

  const bases =
    process.platform === 'win32'
      ? WINDOWS_JAVA_BASES
      : process.platform === 'darwin'
        ? [MAC_JAVA_BASE]
        : LINUX_JAVA_BASES

  for (const base of bases) {
    for (const home of listSubdirs(base)) {
      const bin = resolveBinFromHome(home)
      if (bin) candidates.push(bin)
    }
  }

  // Whatever `java` resolves to on PATH, tried last so an explicit install wins.
  candidates.push(javaBinaryName())

  return [...new Set(candidates)]
}

async function detectMajorVersion(javaBin) {
  try {
    const { stderr, stdout } = await execFileAsync(javaBin, ['-version'])
    const output = `${stderr}${stdout}`
    const match = output.match(/version "(\d+)(?:\.(\d+))?/)
    if (!match) return null
    const first = Number(match[1])
    // Legacy scheme: "1.8.0_491" means major version 8.
    return first === 1 ? Number(match[2]) : first
  } catch {
    return null
  }
}

// Finds a java executable satisfying `requiredMajor` (checks JAVA_HOME, common
// per-OS install locations, then PATH). Prefers the closest major version at or
// above the requirement — modding toolchains (ASM, ModLauncher) are usually only
// tested against the Java generation current when they shipped, and an unrelated
// bleeding-edge JVM can break them in subtle ways a "newer is fine" pick would miss.
// Throws a clear, actionable error if nothing compatible is found.
export async function findCompatibleJava(requiredMajor, { onLog } = {}) {
  const viable = []
  for (const bin of candidateBinaries()) {
    const major = await detectMajorVersion(bin)
    if (major == null) continue
    onLog?.(`Найдена Java ${major}: ${bin}`)
    if (major >= requiredMajor) viable.push({ bin, major })
  }

  if (viable.length === 0) {
    throw new Error(
      `Не найдена подходящая Java (нужна версия ${requiredMajor} или новее). ` +
        `Установите JDK ${requiredMajor}+ (например, Eclipse Temurin) и повторите запуск.`
    )
  }

  viable.sort((a, b) => a.major - b.major)
  const chosen = viable[0]
  onLog?.(`Использую Java ${chosen.major}: ${chosen.bin}`)
  return chosen.bin
}
