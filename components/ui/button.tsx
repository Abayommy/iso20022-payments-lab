import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef((props, ref) => {
  const { className, variant = "default", size = "default", ...rest } = props
  
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  
  const variants = {
    default: "bg-gray-900 text-gray-50 hover:bg-gray-900/90",
    outline: "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
  }
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
  }
  
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...rest}
    />
  )
})
Button.displayName = "Button"

export { Button }
