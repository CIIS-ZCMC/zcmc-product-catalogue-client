/* eslint-disable react/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/services/api'

const SettingsContext = createContext({
  settings: { require_password_on_edit: false },
  loading: true,
  reloadSettings: async () => {},
  updateSettings: async () => {},
})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ require_password_on_edit: false })
  const [loading, setLoading] = useState(true)

  const reloadSettings = useCallback(async () => {
    try {
      const data = await api.getSettings()
      if (data && typeof data === 'object') {
        setSettings({
          require_password_on_edit: Boolean(data.require_password_on_edit),
        })
      }
    } catch (err) {
      console.error('Failed to load application settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (newSettings) => {
    const res = await api.updateSettings(newSettings)
    if (res?.settings) {
      setSettings((prev) => ({
        ...prev,
        require_password_on_edit: Boolean(res.settings.require_password_on_edit),
      }))
    }
    return res
  }, [])

  useEffect(() => {
    reloadSettings()
  }, [reloadSettings])

  return (
    <SettingsContext.Provider value={{ settings, loading, reloadSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
