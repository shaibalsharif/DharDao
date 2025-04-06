"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Transaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export default function MonthlyChart({ transactions }: { transactions: Transaction[] }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())

  const navigatePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((prev) => prev - 1)
    } else {
      setCurrentMonth((prev) => prev - 1)
    }
  }

  const navigateNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((prev) => prev + 1)
    } else {
      setCurrentMonth((prev) => prev + 1)
    }
  }

  const chartData = useMemo(() => {
    // Get days in the selected month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    // Initialize data structure for each day
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      lent: 0,
      borrowed: 0,
      recovered: 0,
      payment: 0,
    }))

    // Populate with transaction data
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
        const dayIndex = date.getDate() - 1

        if (transaction.type === "lend") {
          dailyData[dayIndex].lent += transaction.amount
        } else if (transaction.type === "borrow") {
          dailyData[dayIndex].borrowed += transaction.amount
        } else if (transaction.type === "recover") {
          dailyData[dayIndex].recovered += transaction.amount
        } else if (transaction.type === "payment") {
          dailyData[dayIndex].payment += transaction.amount
        }
      }
    })

    return dailyData
  }, [transactions, currentYear, currentMonth])

  // Get month name
  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Monthly Transactions</CardTitle>
          <CardDescription>
            Transaction activity for {monthName} {currentYear}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={navigatePrevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => `${value > 999 ? `${(value / 1000).toFixed(1)}k` : value}`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Legend />
              <Bar dataKey="lent" name="Lent" fill="#22c55e" />
              <Bar dataKey="borrowed" name="Borrowed" fill="#ef4444" />
              <Bar dataKey="recovered" name="Recovered" fill="#3b82f6" />
              <Bar dataKey="payment" name="Payment" fill="#9333ea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

