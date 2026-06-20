'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let dispose: (() => void) | undefined
    let cancelled = false
    import('@/demo/three-pop-up-book/minimal').then((m) => {
      if (cancelled) return
      dispose = m.mountMinimalPopUp()
      setLoaded(true)
    })
    return () => {
      cancelled = true
      dispose?.()
    }
  }, [])

  if (loaded) return null
  return <div className="loading-note">Loading a minimal pop-up book…</div>
}
