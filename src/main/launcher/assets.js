import { readFile } from 'fs/promises'
import { join } from 'path'
import { downloadFile, mapWithConcurrency } from './downloader.js'
import { assetsDir } from './paths.js'

const RESOURCES_BASE_URL = 'https://resources.download.minecraft.net'

// Downloads the asset index and every referenced object (textures, sounds, lang files).
export async function downloadAssets(assetIndexRef, { onProgress, concurrency = 12 } = {}) {
  const indexPath = join(assetsDir(), 'indexes', `${assetIndexRef.id}.json`)
  await downloadFile(assetIndexRef.url, indexPath, { sha1: assetIndexRef.sha1, size: assetIndexRef.size })
  const index = JSON.parse(await readFile(indexPath, 'utf-8'))

  const objects = Object.values(index.objects)
  let done = 0

  await mapWithConcurrency(objects, concurrency, async (obj) => {
    const prefix = obj.hash.slice(0, 2)
    const dest = join(assetsDir(), 'objects', prefix, obj.hash)
    const url = `${RESOURCES_BASE_URL}/${prefix}/${obj.hash}`
    await downloadFile(url, dest, { sha1: obj.hash, size: obj.size })
    done++
    onProgress?.({ done, total: objects.length })
  })

  return { assetIndexId: assetIndexRef.id }
}
