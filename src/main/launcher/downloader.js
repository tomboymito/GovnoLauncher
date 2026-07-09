import { createWriteStream, createReadStream, existsSync } from 'fs'
import { mkdir, rm, rename, stat } from 'fs/promises'
import { dirname } from 'path'
import { createHash } from 'crypto'

function sha1File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha1')
    const stream = createReadStream(path)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

async function verifyExisting(path, sha1, size) {
  if (!existsSync(path)) return false
  if (size != null) {
    const st = await stat(path)
    if (st.size !== size) return false
  }
  if (sha1) {
    const actual = await sha1File(path)
    if (actual !== sha1) return false
  }
  return true
}

// Downloads a file with SHA1 verification, retries and resumable-safe temp files.
// Skips the download entirely if a valid file already sits at destPath.
export async function downloadFile(url, destPath, { sha1, size, retries = 3, onProgress } = {}) {
  if (await verifyExisting(destPath, sha1, size)) {
    return { skipped: true }
  }

  await mkdir(dirname(destPath), { recursive: true })

  let lastError
  for (let attempt = 1; attempt <= retries; attempt++) {
    const tmpPath = `${destPath}.part`
    try {
      const response = await fetch(url)
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status} for ${url}`)
      }

      const total = Number(response.headers.get('content-length')) || size || 0
      let received = 0
      const fileStream = createWriteStream(tmpPath)
      const reader = response.body.getReader()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        received += value.byteLength
        await new Promise((resolve, reject) => {
          fileStream.write(value, (err) => (err ? reject(err) : resolve()))
        })
        onProgress?.({ received, total })
      }
      await new Promise((resolve, reject) => {
        fileStream.end((err) => (err ? reject(err) : resolve()))
      })

      if (sha1) {
        const actual = await sha1File(tmpPath)
        if (actual !== sha1) {
          throw new Error(`SHA1 mismatch for ${url}: expected ${sha1}, got ${actual}`)
        }
      }

      await rename(tmpPath, destPath)
      return { skipped: false }
    } catch (err) {
      lastError = err
      await rm(tmpPath, { force: true })
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * attempt))
      }
    }
  }
  throw lastError
}

// Runs async worker(item) over items with at most `limit` in flight at once.
export async function mapWithConcurrency(items, limit, worker) {
  const queue = [...items]
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      await worker(item)
    }
  })
  await Promise.all(runners)
}
