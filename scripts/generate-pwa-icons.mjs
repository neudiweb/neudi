import sharp from 'sharp'
import { readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

async function generateIcons () {
  const svg = await readFile(join(publicDir, 'pwa-icon.svg'))

  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'pwa-192x192.png'))

  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'pwa-512x512.png'))

  console.log('PWA icons generated: pwa-192x192.png, pwa-512x512.png')
}

generateIcons().catch(console.error)
