"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X } from "lucide-react"

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
import type { Contact } from "@/lib/types"
import ContactForm from "@/components/contacts/contact-form"
import { deleteContact } from "@/lib/firebase-utils"

interface ContactListProps {
  onClose: () => void
  contacts: Contact[]
  onContactsUpdated: (contacts: Contact[]) => void
  userId: string
}

export default function ContactList({ onClose, contacts, onContactsUpdated, userId }: ContactListProps) {
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteContact = async () => {
    if (!deletingContact) return

    setIsDeleting(true)
    try {
      await deleteContact(userId, deletingContact.id, deletingContact.name)
      onContactsUpdated(contacts.filter((c) => c.id !== deletingContact.id))
    } catch (error) {
      console.error("Error deleting contact:", error)
    } finally {
      setIsDeleting(false)
      setDeletingContact(null)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingContact(contact)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingContact(contact)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6">
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
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the contact. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteContact} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}

