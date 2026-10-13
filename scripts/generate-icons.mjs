// Tegner KørMeds app-ikoner (hvidt K på grøn baggrund) uden eksterne biblioteker.
// Kør: node scripts/generate-icons.mjs
// Skriver: app/apple-icon.png (180), app/icon.png (192), public/icon-192.png, public/icon-512.png
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const GREEN = [0x2f, 0x7d, 0x6d]
const WHITE = [255, 255, 255]

// Bogstavet K som tre tykke linjestykker i en enhedsfirkant (0..1).
const HALF_WIDTH = 0.055
const SEGMENTS = [
  [0.34, 0.24, 0.34, 0.76], // stamme
  [0.37, 0.5, 0.66, 0.24], // øvre ben
  [0.42, 0.47, 0.68, 0.76], // nedre ben
]

function distToSegment(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1
  const dy = y2 - y1
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function inK(x, y) {
  return SEGMENTS.some((s) => distToSegment(x, y, s) <= HALF_WIDTH)
}

function crc32(buf) {
  let c
  let crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size) {
  const SS = 3 // 3x3 supersampling for glatte kanter
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      let cover = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          if (inK((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size)) cover++
        }
      }
      const a = cover / (SS * SS)
      const o = y * (size * 3 + 1) + 1 + x * 3
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(GREEN[i] * (1 - a) + WHITE[i] * a)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
writeFileSync('app/apple-icon.png', png(180))
writeFileSync('app/icon.png', png(192))
writeFileSync('public/icon-192.png', png(192))
writeFileSync('public/icon-512.png', png(512))
console.log('Ikoner skrevet: app/apple-icon.png, app/icon.png, public/icon-192.png, public/icon-512.png')
