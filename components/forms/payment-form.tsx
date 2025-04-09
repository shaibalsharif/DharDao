"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/lib/types"
import { addTransaction } from "@/app/actions"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  transactionId: z.string().min(1, "Please select a transaction"),
  paymentType: z.enum(["full", "partial"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.date(),
  method: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PaymentFormProps {
  onClose: () => void
  onTransactionAdded: (transaction: Transaction) => void
  transactions: Transaction[]
  userId: string
  selectedTransaction?: Transaction | null
}

export default function PaymentForm({
  onClose,
  onTransactionAdded,
  transactions,
  userId,
  selectedTransaction,
}: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Helper function to check if a borrowing transaction has been fully paid
  const isFullyPaid = (transaction: Transaction): boolean => {
    if (transaction.type !== "borrow") return false

    // Find all payment transactions for this person
    const payments = transactions.filter((t) => t.type === "payment" && t.contactId === transaction.contactId)

    // Calculate total paid amount
    const totalPaid = payments.reduce((sum, t) => sum + t.amount, 0)

    // Return true if fully paid
    return totalPaid >= transaction.amount
  }

  // Filter only borrow transactions that haven't been fully paid
  const borrowTransactions = transactions.filter((t) => t.type === "borrow" && !isFullyPaid(t))

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionId: selectedTransaction?.id?.toString() || "",
      paymentType: "full",
      date: new Date(),
      method: "cash",
      notes: "",
    },
  })

  const selectedTransactionId = form.watch("transactionId")
  const paymentType = form.watch("paymentType")
  const amount = form.watch("amount")

  const currentSelectedTransaction = borrowTransactions.find((t) => t.id.toString() === selectedTransactionId)

  // Calculate remaining amount to be paid
  const getRemainingAmount = (): number => {
    if (!currentSelectedTransaction) return 0

    const payments = transactions.filter(
      (t) => t.type === "payment" && t.contactId === currentSelectedTransaction.contactId,
    )

    const totalPaid = payments.reduce((sum, t) => sum + t.amount, 0)
    return Math.max(0, currentSelectedTransaction.amount - totalPaid)
  }

  const remainingAmount = getRemainingAmount()

  // Set default amount when transaction or payment type changes
  useEffect(() => {
    if (currentSelectedTransaction && paymentType === "full") {
      form.setValue("amount", remainingAmount)
    }
  }, [selectedTransactionId, paymentType, form, currentSelectedTransaction, remainingAmount])

  // Set the selected transaction when it changes
  useEffect(() => {
    if (selectedTransaction && selectedTransaction.type === "borrow" && !isFullyPaid(selectedTransaction)) {
      form.setValue("transactionId", selectedTransaction.id.toString())
      if (paymentType === "full") {
        const remaining = getRemainingAmount()
        form.setValue("amount", remaining)
      }
    }
  }, [selectedTransaction, form, paymentType])

  // Validate amount doesn't exceed remaining amount
  useEffect(() => {
    if (paymentType === "partial" && amount > remainingAmount && remainingAmount > 0) {
      form.setError("amount", {
        type: "manual",
        message: `Amount cannot exceed the remaining amount of ${remainingAmount.toFixed(2)}`,
      })
    } else {
      form.clearErrors("amount")
    }
  }, [amount, paymentType, remainingAmount, form])

  const onSubmit = async (values: FormValues) => {
    if (!currentSelectedTransaction) return

    // Additional validation
    if (values.amount > remainingAmount) {
      form.setError("amount", {
        type: "manual",
        message: `Amount cannot exceed the remaining amount of ${remainingAmount.toFixed(2)}`,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const newTransaction: Omit<Transaction, "id" | "userId"> = {
        type: "payment",
        contactId: currentSelectedTransaction.contactId,
        contactName: currentSelectedTransaction.contactName,
        personPhone: currentSelectedTransaction.personPhone,
        amount: values.amount,
        date: values.date.toISOString(),
        method: values.method,
        notes: values.notes,
        createdAt: new Date().toISOString(),
      }

      const transactionWithId = await addTransaction(userId, newTransaction)
      if (transactionWithId) {
        toast({
          title: "Payment recorded",
          description: `Successfully recorded payment of ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(values.amount)}`,
        })
        onTransactionAdded(transactionWithId)
        onClose()
      }
    } catch (error) {
      console.error("Error adding payment transaction:", error)
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Record Payment
            <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Borrowing to Pay</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!selectedTransaction}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a borrowing" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {borrowTransactions.length > 0 ? (
                        borrowTransactions.map((transaction) => (
                          <SelectItem key={transaction.id.toString()} value={transaction.id.toString()}>
                            {transaction.contactName} -{" "}
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(transaction.amount)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-transactions" disabled>
                          No pending borrowing transactions available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentSelectedTransaction && (
              <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <p>
                  Remaining amount to pay:{" "}
                  <span className="font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(remainingAmount)}
                  </span>
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Type</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="full" />
                        </FormControl>
                        <FormLabel className="font-normal">Full</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="partial" />
                        </FormControl>
                        <FormLabel className="font-normal">Partial</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      disabled={paymentType === "full" && !!currentSelectedTransaction}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bKash">bKash</SelectItem>
                      <SelectItem value="Nogod">Nogod</SelectItem>
                      <SelectItem value="rocket">Rocket</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !currentSelectedTransaction}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
