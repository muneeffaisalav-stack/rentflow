
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumb() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)

  if (paths.length === 0) return null

  const formatSegment = (segment: string, index: number, allPaths: string[]) => {
    // If it's a 20-character alphanumeric string, it's likely a Firestore ID
    if (segment.length >= 15 && /^[a-zA-Z0-9]+$/.test(segment)) {
      const parent = allPaths[index - 1]
      if (parent === 'tenants') return 'Tenant Profile'
      if (parent === 'properties') return 'Property Details'
      if (parent === 'users') return 'User Profile'
      return 'Details'
    }
    return segment.replace(/-/g, ' ')
  }

  return (
    <nav className="flex items-center text-sm text-muted-foreground font-medium">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="size-4" />
      </Link>
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`
        const isLast = index === paths.length - 1
        const label = formatSegment(path, index, paths)
        
        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="size-4 mx-2 text-muted-foreground/50" />
            <Link 
              href={href} 
              className={isLast ? "text-foreground font-semibold" : "hover:text-foreground transition-colors capitalize"}
            >
              {label}
            </Link>
          </div>
        )
      })}
    </nav>
  )
}
