
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumb() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)

  if (paths.length === 0) return null

  return (
    <nav className="flex items-center text-sm text-muted-foreground font-medium">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="size-4" />
      </Link>
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`
        const isLast = index === paths.length - 1
        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="size-4 mx-2 text-muted-foreground/50" />
            <Link 
              href={href} 
              className={isLast ? "text-foreground font-semibold" : "hover:text-foreground transition-colors capitalize"}
            >
              {path.replace(/-/g, ' ')}
            </Link>
          </div>
        )
      })}
    </nav>
  )
}
