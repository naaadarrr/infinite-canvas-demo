"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

const CollapsibleContext = React.createContext<{
  open: boolean
  toggle: () => void
}>({ open: true, toggle: () => {} })

function Collapsible({ 
  open: controlledOpen, 
  onOpenChange, 
  defaultOpen = true, 
  children, 
  className 
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const toggle = React.useCallback(() => {
    if (isControlled) {
      onOpenChange?.(!open)
    } else {
      setUncontrolledOpen(prev => {
        onOpenChange?.(!prev)
        return !prev
      })
    }
  }, [isControlled, open, onOpenChange])

  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <div className={cn("", className)} data-state={open ? "open" : "closed"}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

function CollapsibleTrigger({ 
  children, 
  className, 
  showIcon = true,
  asChild,
  ...props 
}: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean; showIcon?: boolean }) {
  const { open, toggle } = React.useContext(CollapsibleContext)
  
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 text-sm font-medium transition-all hover:underline",
        className
      )}
      onClick={toggle}
      data-state={open ? "open" : "closed"}
      {...props}
    >
      {showIcon ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open && "rotate-90",
          )}
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      ) : null}
      {children}
    </button>
  )
}

function CollapsibleContent({ 
  children, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = React.useContext(CollapsibleContext)
  
  if (!open) return null

  return (
    <div
      className={cn("overflow-hidden transition-all", className)}
      data-state={open ? "open" : "closed"}
      {...props}
    >
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
