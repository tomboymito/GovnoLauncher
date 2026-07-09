import { app } from 'electron'
import { join } from 'path'

// Vanilla + Forge files (libraries, assets, versions) are shared across all
// packs that target the same Minecraft/Forge version — only mods differ per pack.
export function runtimeRoot() {
  return join(app.getPath('userData'), 'runtime')
}

export function librariesDir() {
  return join(runtimeRoot(), 'libraries')
}

export function versionsDir() {
  return join(runtimeRoot(), 'versions')
}

export function assetsDir() {
  return join(runtimeRoot(), 'assets')
}

export function nativesDir(versionId) {
  return join(runtimeRoot(), 'natives', versionId)
}

// packs/ lives at the project root in dev and next to the app in a packaged
// build; mod files for a given pack are never shared with other packs.
export function packsRoot() {
  if (app.isPackaged) {
    return join(app.getPath('userData'), 'packs')
  }
  return join(app.getAppPath(), 'packs')
}

export function packDir(packId) {
  return join(packsRoot(), packId)
}

export function packModsDir(packId) {
  return join(packDir(packId), 'mods')
}
