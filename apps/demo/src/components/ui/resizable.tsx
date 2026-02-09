"use client"

import { GripVertical } from "lucide-react"
import { Group, Panel, Separator } from "react-resizable-panels"
import type { GroupProps, SeparatorProps } from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: GroupProps) => (
  <Group
    className={cn(
      "flex h-full w-full",
      className
    )}
    {...props}
  />
)

const ResizablePanel = Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: Omit<SeparatorProps, 'children'> & {
  withHandle?: boolean
  children?: React.ReactNode
}) => (
  <Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-border",
      "after:absolute after:inset-y-0 after:-left-1 after:-right-1 after:content-['']",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      "[&[data-resize-handle-state=drag]]:bg-primary [&[data-resize-handle-state=hover]]:bg-primary/60",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-6 w-3.5 items-center justify-center rounded-sm border bg-background shadow-sm">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
    )}
  </Separator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
