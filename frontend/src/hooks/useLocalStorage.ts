import { useCallback, useState } from "react"

export function useLocalStorage(key: string, initialValue: string | null = null) {
  const [value, setValue] = useState<string | null>(() => {
    return window.localStorage.getItem(key) ?? initialValue
  })

  const set = useCallback(
    (next: string | null) => {
      if (next === null) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, next)
      }
      setValue(next)
    },
    [key]
  )

  return [value, set] as const
}
