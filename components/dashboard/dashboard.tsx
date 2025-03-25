"use client"

import { useState, useEffect } from "react"
import { PlusCircle, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SummaryCards from "@/components/dashboard/summary-cards"
import MonthlyChart from "@/components/dashboard/monthly-chart"
import TransactionTable from "@/components/transactions/transaction-table"
import LendingForm from "@/components/forms/lending-form"
import BorrowingForm from "@/components/forms/borrowing-form"
import ContactList from "@/components/contacts/contact-list"
import ActivityLog from "@/components/activity/activity-log"
import { fetchTransactions, fetchContacts } from "@/lib/firebase-utils"
import type { Transaction, Contact } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"

export default function Dashboard({ userId }: { userId: string }) {
  const { signOut } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLendingFormOpen, setIsLendingFormOpen] = useState(false)
  const [isBorrowingFormOpen, setIsBorrowingFormOpen] = useState(false)
  const [isContactListOpen, setIsContactListOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const transactionsData = await fetchTransactions(userId)
        setTransactions(transactionsData)

        const contactsData = await fetchContacts(userId)
        setContacts(contactsData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [userId])

  const handleTransactionAdded = (newTransaction: Transaction) => {
    setTransactions((prev) => [newTransaction, ...prev])
    setIsLendingFormOpen(false)
    setIsBorrowingFormOpen(false)
  }

  const handleContactUpdated = (updatedContacts: Contact[]) => {
    setContacts(updatedContacts)
    setIsContactListOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Money Manager</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsContactListOpen(true)} variant="outline">
            Manage Contacts
          </Button>
          <Button onClick={signOut} variant="outline" className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-6">
          <SummaryCards transactions={transactions} />
          <MonthlyChart transactions={transactions} />

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button onClick={() => setIsLendingFormOpen(true)} className="flex-1">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Lending
            </Button>
            <Button onClick={() => setIsBorrowingFormOpen(true)} className="flex-1">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Borrowing
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionTable transactions={transactions} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityLog userId={userId} />
        </TabsContent>
      </Tabs>

      {isLendingFormOpen && (
        <LendingForm
          onClose={() => setIsLendingFormOpen(false)}
          onTransactionAdded={handleTransactionAdded}
          contacts={contacts}
          userId={userId}
        />
      )}

      {isBorrowingFormOpen && (
        <BorrowingForm
          onClose={() => setIsBorrowingFormOpen(false)}
          onTransactionAdded={handleTransactionAdded}
          contacts={contacts}
          userId={userId}
        />
      )}

      {isContactListOpen && (
        <ContactList
          onClose={() => setIsContactListOpen(false)}
          contacts={contacts}
          onContactsUpdated={handleContactUpdated}
          userId={userId}
        />
      )}
    </div>
  )
}

