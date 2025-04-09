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
  recoveryType: z.enum(["full", "partial"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.date(),
  method: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface RecoveryFormProps {
  onClose: () => void
  onTransactionAdded: (transaction: Transaction) => void
  transactions: Transaction[]
  userId: string
  selectedTransaction?: Transaction | null
}

export default function RecoveryForm({
  onClose,
  onTransactionAdded,
  transactions,
  userId,
  selectedTransaction,
}: RecoveryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Helper function to check if a lending transaction has been fully recovered
  const isFullyRecovered = (transaction: Transaction): boolean => {
    if (transaction.type !== "lend") return false

    // Find all recovery transactions for this person
    const recoveries = transactions.filter((t) => t.type === "recover" && t.contactId === transaction.contactId)

    // Calculate total recovered amount
    const totalRecovered = recoveries.reduce((sum, t) => sum + t.amount, 0)

    // Return true if fully recovered
    return totalRecovered >= transaction.amount
  }

  // Filter only lend transactions that haven't been fully recovered
  const lendTransactions = transactions.filter((t) => t.type === "lend" && !isFullyRecovered(t))

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionId: selectedTransaction?.id?.toString() || "",
      recoveryType: "full",
      date: new Date(),
      method: "cash",
      notes: "",
    },
  })

  const selectedTransactionId = form.watch("transactionId")
  const recoveryType = form.watch("recoveryType")
  const amount = form.watch("amount")

  const currentSelectedTransaction = lendTransactions.find((t) => t.id.toString() === selectedTransactionId)

  // Calculate remaining amount to be recovered
  const getRemainingAmount = (): number => {
    if (!currentSelectedTransaction) return 0

    const recoveries = transactions.filter(
      (t) => t.type === "recover" && t.contactId === currentSelectedTransaction.contactId,
    )

    const totalRecovered = recoveries.reduce((sum, t) => sum + t.amount, 0)
    return Math.max(0, currentSelectedTransaction.amount - totalRecovered)
  }

  const remainingAmount = getRemainingAmount()

  // Set default amount when transaction or recovery type changes
  useEffect(() => {
    if (currentSelectedTransaction && recoveryType === "full") {
      form.setValue("amount", remainingAmount)
    }
  }, [selectedTransactionId, recoveryType, form, currentSelectedTransaction, remainingAmount])

  // Set the selected transaction when it changes
  useEffect(() => {
    if (selectedTransaction && selectedTransaction.type === "lend" && !isFullyRecovered(selectedTransaction)) {
      form.setValue("transactionId", selectedTransaction.id.toString())
      if (recoveryType === "full") {
        const remaining = getRemainingAmount()
        form.setValue("amount", remaining)
      }
    }
  }, [selectedTransaction, form, recoveryType])

  // Validate amount doesn't exceed remaining amount
  useEffect(() => {
    if (recoveryType === "partial" && amount > remainingAmount && remainingAmount > 0) {
      form.setError("amount", {
        type: "manual",
        message: `Amount cannot exceed the remaining amount of ${remainingAmount.toFixed(2)}`,
      })
    } else {
      form.clearErrors("amount")
    }
  }, [amount, recoveryType, remainingAmount, form])

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
        type: "recover",
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
          title: "Recovery recorded",
          description: `Successfully recorded recovery of ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(values.amount)}`,
        })
        onTransactionAdded(transactionWithId)
        onClose()
      }
    } catch (error) {
      console.error("Error adding recovery transaction:", error)
      toast({
        title: "Error",
        description: "Failed to record recovery. Please try again.",
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
            Record Recovery
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
                  <FormLabel>Select Lending to Recover</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!selectedTransaction}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lending" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lendTransactions.length > 0 ? (
                        lendTransactions.map((transaction) => (
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
                          No pending lending transactions available
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
                  Remaining amount to recover:{" "}
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
              name="recoveryType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Recovery Type</FormLabel>
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
                      disabled={recoveryType === "full" && !!currentSelectedTransaction}
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
