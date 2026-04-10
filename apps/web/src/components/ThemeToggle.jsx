"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Laptop } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="flex bg-muted/40 p-1 rounded-full border border-border/50 backdrop-blur-md">
      <button 
        onClick={() => setTheme("light")} 
        className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button 
        onClick={() => setTheme("system")} 
        className={`p-1.5 rounded-full transition-all ${theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Laptop className="w-4 h-4" />
      </button>
      <button 
        onClick={() => setTheme("dark")} 
        className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}
