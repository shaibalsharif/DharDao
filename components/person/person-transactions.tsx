"use client"

import { useMemo } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TransactionTable from "@/components/transactions/transaction-table"
import type { Transaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface PersonTransactionsProps {
  contactId: string
  contactName: string
  transactions: Transaction[]
  onClose: () => void
  onRecoverTransaction?: (transaction: Transaction) => void
  onPayTransaction?: (transaction: Transaction) => void
  onViewActivity?: (transaction: Transaction) => void
}

export default function PersonTransactions({
  contactId,
  contactName,
  transactions,
  onClose,
  onRecoverTransaction,
  onPayTransaction,
  onViewActivity,
}: PersonTransactionsProps) {
  // Filter transactions for this person
  const personTransactions = useMemo(() => {
    return transactions.filter((t) => t.contactId === contactId)
  }, [transactions, contactId])

  // Calculate summary data
  const summary = useMemo(() => {
    let totalLent = 0
    let totalBorrowed = 0
    let totalRecovered = 0
    let totalPaid = 0

    personTransactions.forEach((transaction) => {
      if (transaction.type === "lend") {
        totalLent += transaction.amount
      } else if (transaction.type === "borrow") {
        totalBorrowed += transaction.amount
      } else if (transaction.type === "recover") {
        totalRecovered += transaction.amount
      } else if (transaction.type === "payment") {
        totalPaid += transaction.amount
      }
    })

    const netLending = totalLent - totalRecovered
    const netBorrowing = totalBorrowed - totalPaid
    const balance = netLending - netBorrowing

    return {
      totalLent,
      totalBorrowed,
      totalRecovered,
      totalPaid,
      netLending,
      netBorrowing,
      balance,
    }
  }, [personTransactions])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Transactions with {contactName}
            <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Lent</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-green-600">{formatCurrency(summary.totalLent)}</div>
              <div className="text-xs text-muted-foreground">Recovered: {formatCurrency(summary.totalRecovered)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Borrowed</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-red-600">{formatCurrency(summary.totalBorrowed)}</div>
              <div className="text-xs text-muted-foreground">Paid: {formatCurrency(summary.totalPaid)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Net Lending</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className={`text-xl font-bold ${summary.netLending > 0 ? "text-green-600" : "text-gray-600"}`}>
                {formatCurrency(summary.netLending)}
              </div>
              <div className="text-xs text-muted-foreground">
                {summary.netLending > 0 ? "Outstanding" : "All recovered"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Net Borrowing</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className={`text-xl font-bold ${summary.netBorrowing > 0 ? "text-red-600" : "text-gray-600"}`}>
                {formatCurrency(summary.netBorrowing)}
              </div>
              <div className="text-xs text-muted-foreground">
                {summary.netBorrowing > 0 ? "Outstanding" : "All paid"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-4">
          <CardHeader className="p-3">
            <CardTitle className="text-lg">Balance</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div
              className={`text-2xl font-bold ${summary.balance > 0 ? "text-green-600" : summary.balance < 0 ? "text-red-600" : "text-gray-600"}`}
            >
              {formatCurrency(Math.abs(summary.balance))}
              {summary.balance !== 0 && (
                <span className="text-base ml-2">{summary.balance > 0 ? "owed to you" : "you owe"}</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {summary.balance === 0
                ? "All settled up"
                : summary.balance > 0
                  ? `${contactName} owes you money`
                  : `You owe ${contactName} money`}
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 overflow-y-scroll">
          <TransactionTable
            transactions={personTransactions}
            onRecoverTransaction={onRecoverTransaction}
            onPayTransaction={onPayTransaction}
            onViewActivity={onViewActivity}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
