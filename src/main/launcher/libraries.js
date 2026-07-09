import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import AdmZip from 'adm-zip'
import { downloadFile } from './downloader.js'
import { librariesDir } from './paths.js'

const OS_NAME = { win32: 'windows', darwin: 'osx', linux: 'linux' }[process.platform]

function rulesAllow(rules) {
  if (!rules || rules.length === 0) return true
  let allowed = false
  for (const rule of rules) {
    let matches = true
    if (rule.os?.name && rule.os.name !== OS_NAME) matches = false
    if (rule.os?.arch && rule.os.arch !== process.arch) matches = false
    if (matches) allowed = rule.action === 'allow'
  }
  return allowed
}

function mavenPathFromName(name) {
  const [group, artifact, version, classifier] = name.split(':')
  const base = `${group.replace(/\./g, '/')}/${artifact}/${version}/${artifact}-${version}`
  return classifier ? `${base}-${classifier}.jar` : `${base}.jar`
}

// Returns { path, url, sha1, size } for a library's main artifact, resolving
// libraries that only carry Maven coordinates (typical for Forge-injected libs).
function resolveArtifact(lib) {
  const artifact = lib.downloads?.artifact
  if (artifact) {
    return {
      path: join(librariesDir(), artifact.path),
      url: artifact.url,
      sha1: artifact.sha1,
      size: artifact.size
    }
  }
  const relPath = mavenPathFromName(lib.name)
  const base = (lib.url || 'https://libraries.minecraft.net/').replace(/\/?$/, '/')
  return { path: join(librariesDir(), relPath), url: base + relPath, sha1: null, size: null }
}

function resolveNativeClassifier(lib) {
  const classifierKey = lib.natives?.[OS_NAME]
  if (!classifierKey) return null
  const classifiers = lib.downloads?.classifiers
  const entry = classifiers?.[classifierKey.replace('${arch}', process.arch === 'x64' ? '64' : '32')]
  if (!entry) return null
  return { path: join(librariesDir(), entry.path), url: entry.url, sha1: entry.sha1, size: entry.size }
}

// Downloads every library applicable to this OS. Extracts legacy classifier-based
// natives (pre-1.19 LWJGL) into nativesOutDir when provided.
export async function downloadLibraries(libraries, { nativesOutDir, onProgress } = {}) {
  const applicable = (libraries || []).filter((lib) => rulesAllow(lib.rules))

  for (const lib of applicable) {
    const artifact = resolveArtifact(lib)
    if (artifact.url) {
      await downloadFile(artifact.url, artifact.path, { sha1: artifact.sha1, size: artifact.size })
    }
    onProgress?.({ library: lib.name })

    if (nativesOutDir) {
      const native = resolveNativeClassifier(lib)
      if (native) {
        await downloadFile(native.url, native.path, { sha1: native.sha1, size: native.size })
        await extractNatives(native.path, nativesOutDir, lib.extract?.exclude)
      }
    }
  }
}

async function extractNatives(jarPath, outDir, exclude = []) {
  await mkdir(outDir, { recursive: true })
  const zip = new AdmZip(jarPath)
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue
    if (exclude.some((prefix) => entry.entryName.startsWith(prefix))) continue
    if (entry.entryName.startsWith('META-INF/')) continue
    zip.extractEntryTo(entry, outDir, false, true)
  }
}

// Builds the classpath (OS-specific separator) from a resolved library list.
export function buildClasspath(libraries, extraJars = []) {
  const separator = process.platform === 'win32' ? ';' : ':'
  const applicable = (libraries || []).filter((lib) => rulesAllow(lib.rules))
  const jarPaths = applicable.map((lib) => resolveArtifact(lib).path).filter((p) => existsSync(p))
  return [...jarPaths, ...extraJars].join(separator)
}
