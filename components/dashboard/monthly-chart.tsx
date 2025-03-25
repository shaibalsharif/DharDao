"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Transaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"

export default function MonthlyChart({ transactions }: { transactions: Transaction[] }) {
  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentYear = new Date().getFullYear()

    // Initialize data structure
    const monthlyData = months.map((month) => ({
      name: month,
      lent: 0,
      borrowed: 0,
      recovered: 0,
    }))

    // Populate with transaction data
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth()

        if (transaction.type === "lend") {
          monthlyData[monthIndex].lent += transaction.amount
        } else if (transaction.type === "borrow") {
          monthlyData[monthIndex].borrowed += transaction.amount
        } else if (transaction.type === "recover") {
          monthlyData[monthIndex].recovered += transaction.amount
        }
      }
    })

    return monthlyData
  }, [transactions])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Transactions</CardTitle>
        <CardDescription>Your lending and borrowing activity for the current year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value > 999 ? `${(value / 1000).toFixed(1)}k` : value}`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar dataKey="lent" name="Lent" fill="#22c55e" />
              <Bar dataKey="borrowed" name="Borrowed" fill="#ef4444" />
              <Bar dataKey="recovered" name="Recovered" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

