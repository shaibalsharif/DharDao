"use client"

import { Tooltip } from "@/components/ui/tooltip"

import type React from "react"

// Re-export all the components from recharts
export {
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Add chart-specific components
export const ChartContainer = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const ChartTooltip = ({ content, ...props }: any) => {
  return <Tooltip content={content} {...props} />
}
