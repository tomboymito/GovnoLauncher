import { readFile } from 'fs/promises'
import { join } from 'path'
import { downloadFile } from './downloader.js'
import { versionsDir } from './paths.js'

const VERSION_MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'

export async function fetchVersionManifest() {
  const response = await fetch(VERSION_MANIFEST_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch Mojang version manifest: HTTP ${response.status}`)
  }
  return response.json()
}

// Downloads and caches <mcVersion>.json (client downloads, libraries, asset index, main class, args).
export async function fetchVersionJson(mcVersion) {
  const manifest = await fetchVersionManifest()
  const entry = manifest.versions.find((v) => v.id === mcVersion)
  if (!entry) {
    throw new Error(`Minecraft version "${mcVersion}" not found in Mojang version manifest`)
  }

  const destPath = join(versionsDir(), mcVersion, `${mcVersion}.json`)
  await downloadFile(entry.url, destPath, { sha1: entry.sha1 })

  return JSON.parse(await readFile(destPath, 'utf-8'))
}

// Downloads the vanilla client jar referenced by a resolved version JSON.
export async function downloadClientJar(versionJson) {
  const destPath = join(versionsDir(), versionJson.id, `${versionJson.id}.jar`)
  const { url, sha1, size } = versionJson.downloads.client
  await downloadFile(url, destPath, { sha1, size })
  return destPath
}
