import { deflateSync } from 'fflate'

// ---------------------------------------------------------------------------
// CRC32 calculation (pure JS - same as desktop)
// ---------------------------------------------------------------------------

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

// ---------------------------------------------------------------------------
// DOS date/time (same as desktop)
// ---------------------------------------------------------------------------

function dosDateTime(date: Date): { time: number; dateVal: number } {
  const time =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() >> 1) & 0x1f)
  const dateVal =
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f)
  return { time, dateVal }
}

// ---------------------------------------------------------------------------
// In-memory ZIP creation using Uint8Array + fflate (browser-compatible)
// ---------------------------------------------------------------------------

interface ZipEntry {
  name: string
  content: Uint8Array
}

export function createZipBuffer(entries: ZipEntry[]): Uint8Array {
  const now = new Date()
  const { time, dateVal } = dosDateTime(now)
  const parts: Uint8Array[] = []
  const centralDir: Uint8Array[] = []
  let offset = 0

  const encoder = new TextEncoder()

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const uncompressed = entry.content
    // fflate.deflateSync produces raw DEFLATE (no zlib header) by default
    const compressed = deflateSync(uncompressed)
    const crc = crc32(uncompressed)

    // Local file header (30 bytes)
    const localHeader = new Uint8Array(30)
    const lhView = new DataView(localHeader.buffer)
    lhView.setUint32(0, 0x04034b50, true) // signature
    lhView.setUint16(4, 20, true) // version needed
    lhView.setUint16(6, 0, true) // flags
    lhView.setUint16(8, 8, true) // compression: DEFLATE
    lhView.setUint16(10, time, true) // mod time
    lhView.setUint16(12, dateVal, true) // mod date
    lhView.setUint32(14, crc, true) // crc32
    lhView.setUint32(18, compressed.length, true) // compressed size
    lhView.setUint32(22, uncompressed.length, true) // uncompressed size
    lhView.setUint16(26, nameBytes.length, true) // file name length
    lhView.setUint16(28, 0, true) // extra field length

    parts.push(localHeader, nameBytes, compressed)

    // Central directory entry (46 bytes)
    const cdEntry = new Uint8Array(46)
    const cdView = new DataView(cdEntry.buffer)
    cdView.setUint32(0, 0x02014b50, true) // signature
    cdView.setUint16(4, 20, true) // version made by
    cdView.setUint16(6, 20, true) // version needed
    cdView.setUint16(8, 0, true) // flags
    cdView.setUint16(10, 8, true) // compression: DEFLATE
    cdView.setUint16(12, time, true) // mod time
    cdView.setUint16(14, dateVal, true) // mod date
    cdView.setUint32(16, crc, true) // crc32
    cdView.setUint32(20, compressed.length, true) // compressed size
    cdView.setUint32(24, uncompressed.length, true) // uncompressed size
    cdView.setUint16(28, nameBytes.length, true) // file name length
    cdView.setUint16(30, 0, true) // extra field length
    cdView.setUint16(32, 0, true) // file comment length
    cdView.setUint16(34, 0, true) // disk number start
    cdView.setUint16(36, 0, true) // internal file attributes
    cdView.setUint32(38, 0, true) // external file attributes
    cdView.setUint32(42, offset, true) // relative offset of local header

    centralDir.push(cdEntry, nameBytes)

    offset += localHeader.length + nameBytes.length + compressed.length
  }

  const cdOffset = offset
  let cdSize = 0
  for (const buf of centralDir) cdSize += buf.length

  // End of central directory (22 bytes)
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  eocdView.setUint32(0, 0x06054b50, true) // signature
  eocdView.setUint16(4, 0, true) // disk number
  eocdView.setUint16(6, 0, true) // disk with CD
  eocdView.setUint16(8, entries.length, true) // entries on disk
  eocdView.setUint16(10, entries.length, true) // total entries
  eocdView.setUint32(12, cdSize, true) // size of central directory
  eocdView.setUint32(16, cdOffset, true) // offset of central directory
  eocdView.setUint16(20, 0, true) // comment length

  // Concatenate all parts + central directory + EOCD
  const allParts = [...parts, ...centralDir, eocd]
  const totalLength = allParts.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(totalLength)
  let pos = 0
  for (const part of allParts) {
    result.set(part, pos)
    pos += part.length
  }
  return result
}
