"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ArrowDownIcon, ArrowUpIcon, RotateCcw } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Transaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

export default function TransactionTable({ transactions }: { transactions: Transaction[] }) {
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

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Person</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden md:table-cell">Method</TableHead>
              <TableHead className="hidden md:table-cell">Return Date</TableHead>
              <TableHead className="hidden md:table-cell">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{format(new Date(transaction.date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>{transaction.personName}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {transaction.type === "lend" ? (
                        <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                      ) : transaction.type === "borrow" ? (
                        <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                      ) : (
                        <RotateCcw className="mr-1 h-4 w-4 text-blue-500" />
                      )}
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        transaction.type === "lend"
                          ? "text-green-500"
                          : transaction.type === "borrow"
                            ? "text-red-500"
                            : "text-blue-500"
                      }
                    >
                      {formatCurrency(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex items-center">
                      {getMethodIcon(transaction.method)} {transaction.method || "Cash"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {transaction.returnDate ? format(new Date(transaction.returnDate), "MMM dd, yyyy") : "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{transaction.notes || "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
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

