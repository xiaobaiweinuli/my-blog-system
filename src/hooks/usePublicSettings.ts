import { useEffect, useState } from "react"

export function usePublicSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/settings/public")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const map: Record<string, string> = {}
          data.data.forEach((item: any) => {
            map[item.key] = item.value
          })
          setSettings(map)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return { settings, loading }
} 