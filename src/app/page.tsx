
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Direct entry to dashboard for prototype purposes
    router.push("/dashboard")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="size-12 bg-primary rounded-xl" />
        <h1 className="text-xl font-headline font-bold text-primary">RentFlow</h1>
      </div>
    </div>
  )
}
