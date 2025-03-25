"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Contact } from "@/lib/types"
import { addContact, updateContact } from "@/lib/firebase-utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
})

type FormValues = z.infer<typeof formSchema>

interface ContactFormProps {
  onClose: () => void
  onContactSaved: (contacts: Contact[]) => void
  contacts: Contact[]
  contactToEdit: Contact | null
  userId: string
}

export default function ContactForm({ onClose, onContactSaved, contacts, contactToEdit, userId }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: contactToEdit?.name || "",
      phone: contactToEdit?.phone || "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      if (contactToEdit) {
        // Update existing contact
        const updatedContact = await updateContact(userId, {
          id: contactToEdit.id,
          name: values.name,
          phone: values.phone,
          createdAt: contactToEdit.createdAt,
        })

        const updatedContacts = contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c))
        onContactSaved(updatedContacts)
      } else {
        // Add new contact
        const newContact: Omit<Contact, "id" | "userId"> = {
          name: values.name,
          phone: values.phone,
          createdAt: new Date().toISOString(),
        }

        const contactWithId = await addContact(userId, newContact)
        onContactSaved([...contacts, contactWithId])
      }
    } catch (error) {
      console.error("Error saving contact:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {contactToEdit ? "Edit Contact" : "Add Contact"}
            <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

