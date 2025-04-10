"use client"

import { useState, useEffect, useCallback } from "react"
import {
  PlusCircle,
  LogOut,
  Menu,
  RefreshCw,
  DollarSign,
  UserPlus,
  Users,
  Settings,
  Home,
  Activity,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Drawer } from "@/components/ui/drawer"
import SummaryCards from "@/components/dashboard/summary-cards"
import MonthlyChart from "@/components/dashboard/monthly-chart"
import TransactionTable from "@/components/transactions/transaction-table"
import LendingForm from "@/components/forms/lending-form"
import BorrowingForm from "@/components/forms/borrowing-form"
import RecoveryForm from "@/components/forms/recovery-form"
import PaymentForm from "@/components/forms/payment-form"
import ContactList from "@/components/contacts/contact-list"
import ContactForm from "@/components/contacts/contact-form"
import ActivityLog from "@/components/activity/activity-log"
import { fetchTransactions, fetchContacts } from "@/app/actions"
import type { Transaction, Contact } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import ProfilePhoto from "@/components/profile/profile-photo"


const filterDeletedContacts = (contacts: Contact[]) => {
  return contacts.filter((contact) => !contact.isDeleted)
}


export default function Dashboard({ userId }: { userId: string }) {
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLendingFormOpen, setIsLendingFormOpen] = useState(false)
  const [isBorrowingFormOpen, setIsBorrowingFormOpen] = useState(false)
  const [isRecoveryFormOpen, setIsRecoveryFormOpen] = useState(false)
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
  const [isContactListOpen, setIsContactListOpen] = useState(false)
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Activity filter states
  const [activityStartDate, setActivityStartDate] = useState<Date | undefined>(undefined)
  const [activityEndDate, setActivityEndDate] = useState<Date | undefined>(undefined)
  const [activityType, setActivityType] = useState<string | null>(null)
  const [activityAction, setActivityAction] = useState<string | null>(null)
  const [activityRelatedId, setActivityRelatedId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!userId || dataLoaded) return

    setIsLoading(true)
    try {
      
      
      const transactionsData = await fetchTransactions(userId)
      setTransactions(transactionsData)

      const contactsData = await fetchContacts(userId)
      setContacts(contactsData)
      setDataLoaded(true)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error loading data",
        description: "There was a problem loading your data. Please try refreshing the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId, dataLoaded, toast])

  useEffect(() => {
    if (userId && !dataLoaded) {
      loadData()
    }
  }, [userId, dataLoaded, loadData])

  const handleTransactionAdded = (newTransaction: Transaction) => {
    setTransactions((prev) => [newTransaction, ...prev])
    setIsLendingFormOpen(false)
    setIsBorrowingFormOpen(false)
    setIsRecoveryFormOpen(false)
    setIsPaymentFormOpen(false)
    setSelectedTransaction(null)
  }

  const handleContactUpdated = (updatedContacts: Contact[]) => {
    setContacts(updatedContacts)
    setIsContactListOpen(false)
    setIsAddContactOpen(false)
  }

  const handleRecoverTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsRecoveryFormOpen(true)
  }

  const handlePayTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsPaymentFormOpen(true)
  }

  const handleViewTransactionActivity = (transaction: Transaction) => {
    // Set the transaction date as the activity filter date
    const transactionDate = new Date(transaction.date)

    // Set start date to beginning of the day
    const startDate = new Date(transactionDate)
    startDate.setHours(0, 0, 0, 0)

    // Set end date to end of the day
    const endDate = new Date(transactionDate)
    endDate.setHours(23, 59, 59, 999)

    // Set activity filters
    setActivityStartDate(startDate)
    setActivityEndDate(endDate)
    setActivityType("transaction")
    setActivityRelatedId(transaction.id.toString())

    // Switch to activity tab
    setActiveTab("activity")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-3xl font-bold">Money Manager</h1>
        <Button variant="outline" size="icon" onClick={() => setIsDrawerOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 flex-1 overflow-auto pb-20">
          <SummaryCards transactions={transactions} />
          <MonthlyChart transactions={transactions} />

          {/* Action buttons - fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-background p-2 border-t z-10">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    setSelectedTransaction(null)
                    setIsLendingFormOpen(true)
                  }}
                  className="bg-green-600 hover:bg-green-700 h-10 text-sm"
                >
                  <PlusCircle className="mr-1 h-4 w-4" /> Add Lending
                </Button>
                <Button
                  onClick={() => {
                    setSelectedTransaction(null)
                    setIsBorrowingFormOpen(true)
                  }}
                  className="bg-red-600 hover:bg-red-700 h-10 text-sm"
                >
                  <PlusCircle className="mr-1 h-4 w-4" /> Add Borrowing
                </Button>
                <Button
                  onClick={() => {
                    setSelectedTransaction(null)
                    setIsRecoveryFormOpen(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 h-10 text-sm"
                >
                  <RefreshCw className="mr-1 h-4 w-4" /> Record Recovery
                </Button>
                <Button
                  onClick={() => {
                    setSelectedTransaction(null)
                    setIsPaymentFormOpen(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-700 h-10 text-sm"
                >
                  <DollarSign className="mr-1 h-4 w-4" /> Record Payment
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="flex-1 overflow-hidden">
          <TransactionTable
            transactions={transactions}
            onRecoverTransaction={handleRecoverTransaction}
            onPayTransaction={handlePayTransaction}
            onViewActivity={handleViewTransactionActivity}
          />
        </TabsContent>

        <TabsContent value="activity" className="flex-1 overflow-hidden">
          <ActivityLog
            userId={userId}
            startDate={activityStartDate}
            endDate={activityEndDate}
            activityType={activityType}
            actionType={activityAction}
            relatedId={activityRelatedId}
            onResetFilters={() => {
              setActivityStartDate(undefined)
              setActivityEndDate(undefined)
              setActivityType(null)
              setActivityAction(null)
              setActivityRelatedId(null)
            }}
          />
        </TabsContent>
      </Tabs>

      {isLendingFormOpen && (
        <LendingForm
          onClose={() => {
            setIsLendingFormOpen(false)
            setSelectedTransaction(null)
          }}
          onTransactionAdded={handleTransactionAdded}
          contacts={filterDeletedContacts(contacts)}
          userId={userId}
        />
      )}

      {isBorrowingFormOpen && (
        <BorrowingForm
          onClose={() => {
            setIsBorrowingFormOpen(false)
            setSelectedTransaction(null)
          }}
          onTransactionAdded={handleTransactionAdded}
          contacts={filterDeletedContacts(contacts)}
          userId={userId}
        />
      )}

      {isRecoveryFormOpen && (
        <RecoveryForm
          onClose={() => {
            setIsRecoveryFormOpen(false)
            setSelectedTransaction(null)
          }}
          onTransactionAdded={handleTransactionAdded}
          transactions={transactions}
          userId={userId}
          selectedTransaction={selectedTransaction}
        />
      )}

      {isPaymentFormOpen && (
        <PaymentForm
          onClose={() => {
            setIsPaymentFormOpen(false)
            setSelectedTransaction(null)
          }}
          onTransactionAdded={handleTransactionAdded}
          transactions={transactions}
          userId={userId}
          selectedTransaction={selectedTransaction}
        />
      )}

      {isContactListOpen && (
        <ContactList
          onClose={() => setIsContactListOpen(false)}
          contacts={contacts}
          onContactsUpdated={handleContactUpdated}
          userId={userId}
          transactions={transactions}
          onRecoverTransaction={handleRecoverTransaction}
          onPayTransaction={handlePayTransaction}
          onViewActivity={handleViewTransactionActivity}
        />
      )}

      {isAddContactOpen && (
        <ContactForm
          onClose={() => setIsAddContactOpen(false)}
          onContactSaved={handleContactUpdated}
          contacts={contacts}
          contactToEdit={null}
          userId={userId}
        />
      )}

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center mb-4">
            <ProfilePhoto
              userId={userId}
              photoURL={user?.photoURL || null}
              displayName={user?.displayName || null}
              email={user?.email || null}
              onPhotoUpdated={(newPhotoURL) => {
                // Update the user object with the new photo URL
                if (user) {
                  // This is a workaround since we can't directly modify the user object
                  const updatedUser = Object.assign({}, user, { photoURL: newPhotoURL })
                  // You might need to implement a state update mechanism here
                  // or refresh the page to see the changes
                }
              }}
            />
            <h2 className="text-xl font-semibold mt-2">{user?.displayName || user?.email}</h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setActiveTab("dashboard")
                setIsDrawerOpen(false)
              }}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setActiveTab("transactions")
                setIsDrawerOpen(false)
              }}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Transactions
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setActiveTab("activity")
                setIsDrawerOpen(false)
              }}
            >
              <Activity className="mr-2 h-4 w-4" />
              Activity Log
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setIsContactListOpen(true)
                setIsDrawerOpen(false)
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Contacts
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setIsAddContactOpen(true)
                setIsDrawerOpen(false)
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Contact
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                // Future settings page
                setIsDrawerOpen(false)
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>

            <Button variant="outline" className="justify-start text-red-500 mt-4" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
