import { supabase } from '../supabase'

export const DEFAULT_SETTINGS = {
  passThreshold: 85,
  questionCounts: [5, 10, 20, 30],
  allowAll: true,
}

const LOCAL_STORAGE_KEY = 'app_learning_settings'

export function getLocalSettings() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        passThreshold: Number(parsed.passThreshold) || DEFAULT_SETTINGS.passThreshold,
        questionCounts:
          Array.isArray(parsed.questionCounts) && parsed.questionCounts.length > 0
            ? parsed.questionCounts.map(Number).filter((n) => n > 0).sort((a, b) => a - b)
            : DEFAULT_SETTINGS.questionCounts,
      }
    }
  } catch (err) {
    console.error('Gagal membaca local settings:', err)
  }
  return DEFAULT_SETTINGS
}

export function saveLocalSettings(settings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Gagal menyimpan local settings:', err)
  }
}

export async function fetchAppSettings() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .like('name', '__sys_config__:%')
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      const rawJson = data[0].name.replace(/^__sys_config__:/, '')
      const parsed = JSON.parse(rawJson)
      const settings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        id: data[0].id,
        passThreshold: Number(parsed.passThreshold) || DEFAULT_SETTINGS.passThreshold,
        questionCounts:
          Array.isArray(parsed.questionCounts) && parsed.questionCounts.length > 0
            ? parsed.questionCounts.map(Number).filter((n) => n > 0).sort((a, b) => a - b)
            : DEFAULT_SETTINGS.questionCounts,
      }
      saveLocalSettings(settings)
      return settings
    }
  } catch (err) {
    console.error('Gagal mengambil app settings dari database:', err)
  }
  return getLocalSettings()
}

export async function updateAppSettings(newSettings) {
  const cleanSettings = {
    passThreshold: Number(newSettings.passThreshold) || DEFAULT_SETTINGS.passThreshold,
    questionCounts:
      Array.isArray(newSettings.questionCounts) && newSettings.questionCounts.length > 0
        ? Array.from(new Set(newSettings.questionCounts.map(Number).filter((n) => n > 0))).sort((a, b) => a - b)
        : DEFAULT_SETTINGS.questionCounts,
    allowAll: newSettings.allowAll ?? true,
  }

  saveLocalSettings(cleanSettings)

  try {
    const configString = '__sys_config__:' + JSON.stringify(cleanSettings)

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .like('name', '__sys_config__:%')
      .limit(1)

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('users')
        .update({ name: configString })
        .eq('id', existing[0].id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('users')
        .insert({ name: configString })
      if (error) throw error
    }
    return { success: true, settings: cleanSettings }
  } catch (err) {
    console.error('Gagal menyimpan app settings ke database:', err)
    return { success: false, error: err.message, settings: cleanSettings }
  }
}
