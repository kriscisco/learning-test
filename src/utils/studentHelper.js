/**
 * Helper untuk format nama dan PIN siswa
 * Format yang disimpan di tabel users: "Nama Siswa [PIN:1234]"
 * atau format nama biasa jika pin tidak disertakan.
 */

export function parseStudentNameAndPin(rawName) {
  if (!rawName) return { name: '', pin: '' }
  const match = rawName.match(/^(.*?)(?:\s*\[PIN:(\w+)\])?$/i)
  if (match) {
    return {
      name: (match[1] || '').trim(),
      pin: (match[2] || '').trim(),
    }
  }
  return { name: rawName.trim(), pin: '' }
}

export function formatStudentNameWithPin(name, pin) {
  const cleanName = (name || '').trim()
  const cleanPin = (pin || '').trim()
  if (cleanPin) {
    return `${cleanName} [PIN:${cleanPin}]`
  }
  return cleanName
}
