"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const drawerVariants = cva(
  "fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
)

export interface DrawerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof drawerVariants> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  ({ className, children, side = "right", open, onOpenChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open || false)

    React.useEffect(() => {
      if (open !== undefined) {
        setIsOpen(open)
      }
    }, [open])

    const handleClose = () => {
      setIsOpen(false)
      onOpenChange?.(false)
    }

    // Handle clicking outside to close
    React.useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (isOpen && event.target instanceof HTMLElement) {
          const drawerElement = document.getElementById("drawer-content")
          if (drawerElement && !drawerElement.contains(event.target)) {
            handleClose()
          }
        }
      }

      document.addEventListener("mousedown", handleOutsideClick)
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick)
      }
    }, [isOpen])

    // Handle ESC key to close
    React.useEffect(() => {
      const handleEscKey = (event: KeyboardEvent) => {
        if (isOpen && event.key === "Escape") {
          handleClose()
        }
      }

      document.addEventListener("keydown", handleEscKey)
      return () => {
        document.removeEventListener("keydown", handleEscKey)
      }
    }, [isOpen])

    if (!isOpen) {
      return null
    }

    return (
      <div className="fixed inset-0 z-50 bg-black/80" data-state={isOpen ? "open" : "closed"}>
        <div
          ref={ref}
          id="drawer-content"
          className={cn(drawerVariants({ side }), className)}
          data-state={isOpen ? "open" : "closed"}
          {...props}
        >
          <div className="absolute right-4 top-4">
            <button
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          {children}
        </div>
      </div>
    )
  },
)
Drawer.displayName = "Drawer"

export const DrawerPortal = () => null
export const DrawerOverlay = () => null
export const DrawerTrigger = () => null
export const DrawerClose = () => null
export const DrawerContent = () => null
export const DrawerHeader = () => null
export const DrawerFooter = () => null
export const DrawerTitle = () => null
export const DrawerDescription = () => null

