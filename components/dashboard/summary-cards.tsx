"use client"

import { useMemo } from "react"
import { ArrowDownIcon, ArrowUpIcon, RotateCcw } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Transaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

export default function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const summaryData = useMemo(() => {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    let totalLent = 0
    let totalBorrowed = 0
    let totalRecovered = 0
    let thisMonthLent = 0
    let thisMonthBorrowed = 0

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date)

      if (transaction.type === "lend") {
        totalLent += transaction.amount
        if (transactionDate >= firstDayOfMonth) {
          thisMonthLent += transaction.amount
        }
      } else if (transaction.type === "borrow") {
        totalBorrowed += transaction.amount
        if (transactionDate >= firstDayOfMonth) {
          thisMonthBorrowed += transaction.amount
        }
      } else if (transaction.type === "recover") {
        totalRecovered += transaction.amount
      }
    })

    const balance = totalLent - totalBorrowed

    return {
      totalLent,
      totalBorrowed,
      totalRecovered,
      balance,
      thisMonthLent,
      thisMonthBorrowed,
    }
  }, [transactions])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Lent</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summaryData.totalLent)}</div>
          <p className="text-xs text-muted-foreground">{formatCurrency(summaryData.thisMonthLent)} this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summaryData.totalBorrowed)}</div>
          <p className="text-xs text-muted-foreground">{formatCurrency(summaryData.thisMonthBorrowed)} this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Recovered</CardTitle>
          <RotateCcw className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summaryData.totalRecovered)}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summaryData.balance >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatCurrency(summaryData.balance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summaryData.balance >= 0 ? "You're owed more than you owe" : "You owe more than you're owed"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

