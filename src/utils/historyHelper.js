import { supabase } from '../supabase'

const STORAGE_KEY = 'app_deleted_session_ids'

export function getLocalDeletedSessionIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const list = JSON.parse(raw)
      if (Array.isArray(list)) return new Set(list)
    }
  } catch (err) {
    console.error('Gagal membaca local deleted sessions:', err)
  }
  return new Set()
}

export function saveLocalDeletedSessionIds(setOrArray) {
  try {
    const list = Array.from(setOrArray)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Gagal menyimpan local deleted sessions:', err)
  }
}

export async function getDeletedSessionIds() {
  const localSet = getLocalDeletedSessionIds()
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .like('name', '__sys_deleted_sessions__:%')
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      const rawJson = data[0].name.replace(/^__sys_deleted_sessions__:/, '')
      const list = JSON.parse(rawJson)
      if (Array.isArray(list)) {
        const mergedSet = new Set([...localSet, ...list])
        saveLocalDeletedSessionIds(mergedSet)
        return mergedSet
      }
    }
  } catch (err) {
    console.error('Gagal mengambil daftar riwayat terhapus dari database:', err)
  }
  return localSet
}

export async function markSessionsAsDeleted(newDeletedIds) {
  if (!newDeletedIds || newDeletedIds.length === 0) return

  const localSet = getLocalDeletedSessionIds()
  newDeletedIds.forEach((id) => localSet.add(id))
  saveLocalDeletedSessionIds(localSet)

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('users')
      .select('id, name')
      .like('name', '__sys_deleted_sessions__:%')
      .limit(1)

    if (fetchErr) throw fetchErr

    let currentList = []
    let recordId = null
    if (existing && existing.length > 0) {
      recordId = existing[0].id
      try {
        const rawJson = existing[0].name.replace(/^__sys_deleted_sessions__:/, '')
        currentList = JSON.parse(rawJson) || []
      } catch {
        currentList = []
      }
    }

    const merged = Array.from(new Set([...currentList, ...newDeletedIds]))
    const configString = '__sys_deleted_sessions__:' + JSON.stringify(merged)

    if (recordId) {
      const { error } = await supabase
        .from('users')
        .update({ name: configString })
        .eq('id', recordId)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('users')
        .insert({ name: configString })
      if (error) throw error
    }
    return merged
  } catch (err) {
    console.error('Gagal menyimpan status riwayat terhapus ke database:', err)
  }
}
