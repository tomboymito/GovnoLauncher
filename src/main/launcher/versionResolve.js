import { readFile } from 'fs/promises'
import { join } from 'path'
import { versionsDir } from './paths.js'

async function loadVersionJson(versionId) {
  const path = join(versionsDir(), versionId, `${versionId}.json`)
  return JSON.parse(await readFile(path, 'utf-8'))
}

// Keeps the first occurrence of each group:artifact pair — the merge always
// walks child (Forge) libraries before parent (vanilla) ones, so Forge's
// patched versions of shared libraries win.
function dedupeLibraries(libraries) {
  const seen = new Set()
  const result = []
  for (const lib of libraries) {
    const key = lib.name.split(':').slice(0, 2).join(':')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(lib)
  }
  return result
}

// Modern (1.17+) Forge puts every library on the JPMS module path (`-p`) instead
// of the classpath. If we kept vanilla's own `-cp ${classpath}` too, the same
// jars would sit on both paths — the JVM then resolves those classes through
// the classpath's unnamed module, so Forge's own module (cpw.mods.securejarhandler)
// never actually resolves and `--add-opens`/`--add-exports` targeting it silently
// no-ops, crashing with InaccessibleObjectException at startup.
function stripClasspathArg(jvmArgs) {
  const idx = jvmArgs.indexOf('-cp')
  if (idx === -1) return jvmArgs
  const copy = [...jvmArgs]
  copy.splice(idx, 2)
  return copy
}

function mergeJvmArgs(parentJvm, childJvm) {
  const usesModulePath = (childJvm || []).includes('-p')
  const base = usesModulePath ? stripClasspathArg(parentJvm || []) : parentJvm || []
  return [...base, ...(childJvm || [])]
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
    jvm: mergeJvmArgs(parent.arguments?.jvm, json.arguments?.jvm)
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
