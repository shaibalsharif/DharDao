"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ArrowDownIcon, ArrowUpIcon, RotateCcw, RefreshCw, DollarSign, Check } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Transaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface TransactionTableProps {
  transactions: Transaction[]
  onRecoverTransaction?: (transaction: Transaction) => void
  onPayTransaction?: (transaction: Transaction) => void
  onViewActivity?: (transaction: Transaction) => void
}

export default function TransactionTable({
  transactions,
  onRecoverTransaction,
  onPayTransaction,
  onViewActivity,
}: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage)

  // Generate page numbers
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  // Helper function to get payment method icon
  const getMethodIcon = (method?: string) => {
    switch (method) {
      case "cash":
        return "💵"
      case "bKash":
        return "📱"
      case "Nogod":
        return "📲"
      case "rocket":
        return "🚀"
      case "bank":
        return "🏦"
      default:
        return "💰"
    }
  }

  // Check if a lending transaction has been recovered
  const isRecovered = (transaction: Transaction) => {
    if (transaction.type !== "lend") return false

    // Find recovery transactions for this person
    const recoveries = sortedTransactions.filter((t) => t.type === "recover" && t.personId === transaction.personId)

    // Calculate total recovered amount
    const totalRecovered = recoveries.reduce((sum, t) => sum + t.amount, 0)

    // Return true if fully recovered
    return totalRecovered >= transaction.amount
  }

  // Check if a borrowing transaction has been paid
  const isPaid = (transaction: Transaction) => {
    if (transaction.type !== "borrow") return false

    // Find payment transactions for this person
    const payments = sortedTransactions.filter((t) => t.type === "payment" && t.personId === transaction.personId)

    // Calculate total paid amount
    const totalPaid = payments.reduce((sum, t) => sum + t.amount, 0)

    // Return true if fully paid
    return totalPaid >= transaction.amount
  }

  // Handle double click on transaction
  const handleDoubleClick = (transaction: Transaction) => {
    if (onViewActivity) {
      onViewActivity(transaction)
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="grid gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedTransactions.length > 0 ? (
            paginatedTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="overflow-hidden transition-all duration-200 hover:shadow-md"
                onDoubleClick={() => handleDoubleClick(transaction)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    <div
                      className={`p-3 flex justify-between items-center ${
                        transaction.type === "lend"
                          ? "bg-green-50 dark:bg-green-900/20"
                          : transaction.type === "borrow"
                            ? "bg-red-50 dark:bg-red-900/20"
                            : transaction.type === "recover"
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "bg-purple-50 dark:bg-purple-900/20"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`rounded-full p-2 mr-3 ${
                            transaction.type === "lend"
                              ? "bg-green-100 dark:bg-green-800"
                              : transaction.type === "borrow"
                                ? "bg-red-100 dark:bg-red-800"
                                : transaction.type === "recover"
                                  ? "bg-blue-100 dark:bg-blue-800"
                                  : "bg-purple-100 dark:bg-purple-800"
                          }`}
                        >
                          {transaction.type === "lend" ? (
                            <ArrowUpIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
                          ) : transaction.type === "borrow" ? (
                            <ArrowDownIcon className="h-5 w-5 text-red-600 dark:text-red-300" />
                          ) : transaction.type === "recover" ? (
                            <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                          ) : (
                            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium capitalize">
                            {transaction.type}
                            {transaction.type === "lend" && isRecovered(transaction) && (
                              <Badge className="ml-2 bg-green-500">Recovered</Badge>
                            )}
                            {transaction.type === "borrow" && isPaid(transaction) && (
                              <Badge className="ml-2 bg-blue-500">Paid</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(transaction.date), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            transaction.type === "lend"
                              ? "text-green-600 dark:text-green-400"
                              : transaction.type === "borrow"
                                ? "text-red-600 dark:text-red-400"
                                : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center justify-end">
                          {getMethodIcon(transaction.method)} {transaction.method || "Cash"}
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{transaction.personName}</div>
                          <div className="text-sm text-muted-foreground">{transaction.personPhone}</div>
                          {transaction.notes && (
                            <div className="text-sm mt-2 text-muted-foreground">
                              <span className="font-medium">Note:</span> {transaction.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          {transaction.type === "lend" && onRecoverTransaction && !isRecovered(transaction) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onRecoverTransaction(transaction)}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Recover
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Record recovery for this lending</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {transaction.type === "lend" && isRecovered(transaction) && (
                            <Badge className="flex items-center bg-green-500">
                              <Check className="h-3 w-3 mr-1" /> Recovered
                            </Badge>
                          )}

                          {transaction.type === "borrow" && onPayTransaction && !isPaid(transaction) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPayTransaction(transaction)}
                                    className="text-green-500 hover:text-green-700 hover:bg-green-100 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                  >
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Pay
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Record payment for this borrowing</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {transaction.type === "borrow" && isPaid(transaction) && (
                            <Badge className="flex items-center bg-blue-500">
                              <Check className="h-3 w-3 mr-1" /> Paid
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground col-span-full">No transactions found</div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination className="py-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {pageNumbers.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

