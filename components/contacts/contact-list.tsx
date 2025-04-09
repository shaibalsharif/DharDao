"use client"

import { useState } from "react"
import { Plus, Pencil, X, Eye, Archive } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import type { Contact, Transaction } from "@/lib/types"
import ContactForm from "@/components/contacts/contact-form"
import { deleteContact } from "@/app/actions"
import PersonTransactions from "@/components/person/person-transactions"
import { useToast } from "@/components/ui/use-toast"

interface ContactListProps {
  onClose: () => void
  contacts: Contact[]
  onContactsUpdated: (contacts: Contact[]) => void
  userId: string
  transactions?: Transaction[]
  onRecoverTransaction?: (transaction: Transaction) => void
  onPayTransaction?: (transaction: Transaction) => void
  onViewActivity?: (transaction: Transaction) => void
}

export default function ContactList({
  onClose,
  contacts,
  onContactsUpdated,
  userId,
  transactions = [],
  onRecoverTransaction,
  onPayTransaction,
  onViewActivity,
}: ContactListProps) {
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string } | null>(null)
  const { toast } = useToast()

  const handleDeleteContact = async () => {
    if (!deletingContact) return

    setIsDeleting(true)
    try {
      const result = await deleteContact(userId, deletingContact.id, deletingContact.name)
      if (result.success) {
        // Update the contact in the list to show as deleted
        const updatedContacts = contacts.map((c) =>
          c.id.toString() === deletingContact.id.toString() ? { ...c, isDeleted: true } : c,
        )
        onContactsUpdated(updatedContacts)
        toast({
          title: "Contact archived",
          description: "The contact has been archived successfully.",
        })
      } else {
        toast({
          title: "Cannot archive contact",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast({
        title: "Error",
        description: "Failed to archive contact. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeletingContact(null)
    }
  }

  const handleViewTransactions = (contact: Contact) => {
    setSelectedPerson({
      id: contact.id.toString(),
      name: contact.name,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Manage Contacts
            <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button onClick={() => setIsAddingContact(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
        </div>

        <div className="rounded-md border overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <TableRow key={contact.id.toString()} className={contact.isDeleted ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>
                      {contact.isDeleted && (
                        <Badge variant="outline" className="bg-gray-200 text-gray-700">
                          Archived
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewTransactions(contact)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!contact.isDeleted && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => setEditingContact(contact)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingContact(contact)}>
                              <Archive className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No contacts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {(isAddingContact || editingContact) && (
          <ContactForm
            onClose={() => {
              setIsAddingContact(false)
              setEditingContact(null)
            }}
            onContactSaved={(updatedContacts) => {
              onContactsUpdated(updatedContacts)
              setIsAddingContact(false)
              setEditingContact(null)
            }}
            contacts={contacts}
            contactToEdit={editingContact}
            userId={userId}
          />
        )}

        <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive this contact?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive the contact. The contact will still be visible in transactions but will be marked as
                archived.
                {deletingContact?.name && <p className="font-medium mt-2">Contact: {deletingContact.name}</p>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteContact} disabled={isDeleting}>
                {isDeleting ? "Archiving..." : "Archive"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedPerson && (
          <PersonTransactions
            contactId={selectedPerson.id}
            contactName={selectedPerson.name}
            transactions={transactions}
            onClose={() => setSelectedPerson(null)}
            onRecoverTransaction={onRecoverTransaction}
            onPayTransaction={onPayTransaction}
            onViewActivity={onViewActivity}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
