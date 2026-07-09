import { readFile } from 'fs/promises'
import { join } from 'path'
import { versionsDir } from './paths.js'

async function loadVersionJson(versionId) {
  const path = join(versionsDir(), versionId, `${versionId}.json`)
  return JSON.parse(await readFile(path, 'utf-8'))
}

// Keeps the first occurrence of each group:artifact:classifier combo — the merge
// always walks child (Forge) libraries before parent (vanilla) ones, so Forge's
// patched versions of shared libraries win. The classifier must be part of the
// key: natives-windows/natives-linux/etc share group:artifact with the plain
// jar (and each other) but are separate files that all need to stay on the
// classpath, not get collapsed into a single "duplicate".
function dedupeLibraries(libraries) {
  const seen = new Set()
  const result = []
  for (const lib of libraries) {
    const [group, artifact, , classifier] = lib.name.split(':')
    const key = `${group}:${artifact}:${classifier || ''}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(lib)
  }
  return result
}

// Recursively resolves the Mojang `inheritsFrom` chain (Forge version -> vanilla
// version) into a single launch spec: merged libraries, concatenated jvm/game
// arguments, and the child's mainClass/downloads taking precedence.
export async function resolveVersion(versionId) {
  const json = await loadVersionJson(versionId)
  if (!json.inheritsFrom) {
    return { ...json, libraries: dedupeLibraries(json.libraries || []) }
  }

  const parent = await resolveVersion(json.inheritsFrom)

  const libraries = dedupeLibraries([...(json.libraries || []), ...(parent.libraries || [])])
  const mergedArguments = {
    game: [...(parent.arguments?.game || []), ...(json.arguments?.game || [])],
    jvm: [...(parent.arguments?.jvm || []), ...(json.arguments?.jvm || [])]
  }

  return {
    ...parent,
    ...json,
    id: json.id,
    mainClass: json.mainClass || parent.mainClass,
    libraries,
    arguments: mergedArguments,
    assetIndex: json.assetIndex || parent.assetIndex,
    assets: json.assets || parent.assets,
    javaVersion: json.javaVersion || parent.javaVersion,
    downloads: json.downloads || parent.downloads
  }
}
