"use server"

import { db } from "@/lib/db/index"
import { contacts, transactions, activities, users } from "@/lib/db/schema"
import { eq, desc, and, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { Contact, Transaction, Activity, DeviceInfo } from "@/lib/types"

// Helper function to ensure we have a Date object
function ensureDate(dateValue: Date | string | undefined | null): Date | null {
  if (!dateValue) return null

  // If it's already a Date object, return it
  if (dateValue instanceof Date) return dateValue

  // If it's a string (like an ISO string), convert it to a Date
  try {
    return new Date(dateValue)
  } catch (error) {
    console.error("Invalid date value:", dateValue)
    return null
  }
}

// User Management
export async function createOrUpdateUser(
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null,
  deviceInfo?: DeviceInfo,
  locationInfo?: string,
) {
  try {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, uid),
    })

    const now = new Date()

    if (!existingUser) {
      // Create new user
      await db.insert(users).values({
        id: uid,
        email: email || "",
        displayName: displayName || "",
        photoURL: photoURL || "",
        createdAt: now,
        lastLogin: now,
      })

      // Wait for the user to be created before logging activity
      // Add a small delay to ensure the database has time to process the user creation
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Log activity
      await logActivity(uid, {
        type: "auth",
        action: "signup",
        details: "User created account",
        timestamp: now.toISOString(),
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : undefined,
        location: locationInfo,
      })

      return { success: true, message: "User created" }
    } else {
      // Update last login
      await db.update(users).set({ lastLogin: now }).where(eq(users.id, uid))

      // Log activity
      await logActivity(uid, {
        type: "auth",
        action: "login",
        details: "User logged in",
        timestamp: now.toISOString(),
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : undefined,
        location: locationInfo,
      })

      return { success: true, message: "User login updated" }
    }
  } catch (error) {
    console.error("Error creating/updating user:", error)
    return { success: false, message: "Failed to process user" }
  }
}

// User Photo Update
export async function updateUserPhoto(userId: string, photoURL: string): Promise<boolean> {
  try {
    // Update user record in the database
    await db.update(users).set({ photoURL }).where(eq(users.id, userId))

    // Log activity
    await logActivity(userId, {
      type: "user",
      action: "update_photo",
      details: "Updated profile photo",
      timestamp: new Date().toISOString(),
    })

    revalidatePath("/")
    return true
  } catch (error) {
    console.error("Error updating user photo:", error)
    return false
  }
}

// Contacts
export async function fetchContacts(userId: string, includeDeleted = false): Promise<Contact[]> {
  try {
    let query = db.select().from(contacts).where(eq(contacts.userId, userId))

    if (!includeDeleted) {
      query = query.where(eq(contacts.isDeleted, false))
    }

    const result = await query.orderBy(contacts.name)

    return result.map((contact) => ({
      id: contact.id.toString(),
      name: contact.name,
      phone: contact.phone,
      userId: contact.userId,
      isDeleted: contact.isDeleted,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return []
  }
}

export async function addContact(
  userId: string,
  contact: Omit<Contact, "id" | "userId" | "isDeleted" | "updatedAt">,
): Promise<Contact | null> {
  try {
    const now = new Date()

    const [result] = await db
      .insert(contacts)
      .values({
        userId,
        name: contact.name,
        phone: contact.phone,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
console.log(result)
    if (!result) return null

    // Log activity
    await logActivity(userId, {
      type: "contact",
      action: "add",
      details: `Added contact: ${contact.name}`,
      relatedId: result.id.toString(),
      timestamp: now.toISOString(),
    })

    revalidatePath("/")

    return {
      id: result.id.toString(),
      userId,
      name: result.name,
      phone: result.phone,
      isDeleted: result.isDeleted,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error("Error adding contact:", error)
    return null
  }
}

export async function updateContact(
  userId: string,
  contact: Omit<Contact, "userId" | "createdAt" | "updatedAt"> & { id: string | number },
): Promise<Contact | null> {
  try {
    // Convert id to number if it's a string that contains only digits
    const contactId =
      typeof contact.id === "string" && /^\d+$/.test(contact.id) ? Number.parseInt(contact.id) : contact.id

    const now = new Date()

    const [result] = await db
      .update(contacts)
      .set({
        name: contact.name,
        phone: contact.phone,
        updatedAt: now,
      })
      .where(
        and(
          typeof contactId === "number" ? eq(contacts.id, contactId) : eq(contacts.id, Number(contactId)),
          eq(contacts.userId, userId),
        ),
      )
      .returning()

    if (!result) return null

    // Log activity
    await logActivity(userId, {
      type: "contact",
      action: "update",
      details: `Updated contact: ${contact.name}`,
      relatedId: result.id.toString(),
      timestamp: now.toISOString(),
    })

    revalidatePath("/")

    return {
      id: result.id.toString(),
      userId,
      name: result.name,
      phone: result.phone,
      isDeleted: result.isDeleted,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error("Error updating contact:", error)
    return null
  }
}

export async function deleteContact(
  userId: string,
  contactId: string | number,
  contactName: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Convert id to number if it's a string that contains only digits
    const id = typeof contactId === "string" && /^\d+$/.test(contactId) ? Number.parseInt(contactId) : contactId

    // Check if contact has any outstanding transactions
    const outstandingTransactions = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId),
        typeof id === "number" ? eq(transactions.contactId, id) : eq(transactions.contactId, Number(id)),
        eq(transactions.type, "lend"),
      ),
    })

    // Calculate if all lending transactions are fully recovered
    let hasOutstandingLending = false
    for (const lendingTx of outstandingTransactions) {
      const recoveryTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          eq(transactions.contactId, lendingTx.contactId),
          eq(transactions.type, "recover"),
        ),
      })

      const totalRecovered = recoveryTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
      if (totalRecovered < Number(lendingTx.amount)) {
        hasOutstandingLending = true
        break
      }
    }

    // Check for outstanding borrowings
    const outstandingBorrowings = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId),
        typeof id === "number" ? eq(transactions.contactId, id) : eq(transactions.contactId, Number(id)),
        eq(transactions.type, "borrow"),
      ),
    })

    let hasOutstandingBorrowing = false
    for (const borrowingTx of outstandingBorrowings) {
      const paymentTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          eq(transactions.contactId, borrowingTx.contactId),
          eq(transactions.type, "payment"),
        ),
      })

      const totalPaid = paymentTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
      if (totalPaid < Number(borrowingTx.amount)) {
        hasOutstandingBorrowing = true
        break
      }
    }

    if (hasOutstandingLending || hasOutstandingBorrowing) {
      return {
        success: false,
        message: "Cannot delete contact with outstanding transactions. Please settle all transactions first.",
      }
    }

    // Soft delete the contact
    await db
      .update(contacts)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(
        and(typeof id === "number" ? eq(contacts.id, id) : eq(contacts.id, Number(id)), eq(contacts.userId, userId)),
      )

    // Log activity
    await logActivity(userId, {
      type: "contact",
      action: "delete",
      details: `Archived contact: ${contactName}`,
      relatedId: contactId.toString(),
      timestamp: new Date().toISOString(),
    })

    revalidatePath("/")
    return { success: true, message: "Contact archived successfully" }
  } catch (error) {
    console.error("Error deleting contact:", error)
    return { success: false, message: "Failed to archive contact" }
  }
}

// Transactions
export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  try {
    const result = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
      orderBy: desc(transactions.createdAt),
      with: {
        contact: true, // Changed from 'contacts' to 'contact'
      },
    });

    return result.map((transaction) => ({
      id: transaction.id.toString(),
      type: transaction.type as "lend" | "borrow" | "recover" | "payment",
      contactId: transaction.contactId.toString(),
      contactName: transaction.contact?.name ?? "Unknown",
      personPhone: transaction.contact?.phone ?? "",
      personDeleted: transaction.contact?.isDeleted ?? false,
      amount: Number(transaction.amount),
      date: transaction.date.toISOString(),
      returnDate: transaction.returnDate?.toISOString(),
      method: transaction.method || undefined,
      notes: transaction.notes || undefined,
      userId: transaction.userId,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
}

export async function addTransaction(
  userId: string,
  transaction: Omit<Transaction, "id" | "userId" | "updatedAt" | "contactName" | "personPhone" | "personDeleted">,
): Promise<Transaction | null> {
  try {
    const now = new Date()

    // Convert string dates to Date objects
    const transactionDate = ensureDate(transaction.date) || now
    const returnDate = transaction.returnDate ? ensureDate(transaction.returnDate) : null

    // Get contact information
    const contactInfo = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, Number(transaction.contactId)), eq(contacts.userId, userId)),
    })

    if (!contactInfo) {
      throw new Error("Contact not found")
    }

    const [result] = await db
      .insert(transactions)
      .values({
        userId,
        type: transaction.type,
        contactId: Number(transaction.contactId),
        amount: transaction.amount,
        date: transactionDate,
        returnDate: returnDate,
        method: transaction.method || null,
        notes: transaction.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    if (!result) return null

    // Log activity
    await logActivity(userId, {
      type: "transaction",
      action: `add_${transaction.type}`,
      details: `Added ${transaction.type} transaction of ${transaction.amount} with ${contactInfo.name}`,
      relatedId: result.id.toString(),
      amount: transaction.amount,
      timestamp: now.toISOString(),
    })

    revalidatePath("/")

    return {
      id: result.id.toString(),
      type: result.type as "lend" | "borrow" | "recover" | "payment",
      contactId: result.contactId.toString(),
      contactName: contactInfo.name,
      personPhone: contactInfo.phone,
      personDeleted: contactInfo.isDeleted,
      amount: Number(result.amount),
      date: result.date.toISOString(),
      returnDate: result.returnDate?.toISOString(),
      method: result.method || undefined,
      notes: result.notes || undefined,
      userId: result.userId,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error("Error adding transaction:", error)
    return null
  }
}

// Activities
export async function logActivity(
  userId: string,
  activity: {
    type: string
    action: string
    details: string
    relatedId?: string
    amount?: number
    timestamp: string
    deviceInfo?: string
    location?: string
  },
): Promise<string | null> {
  try {
    // First check if the user exists
    const userExists = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true },
    })

    if (!userExists) {
      console.error(`Cannot log activity: User ${userId} does not exist in database`)
      return null
    }

    // Convert string timestamp to Date object
    const timestamp = ensureDate(activity.timestamp) || new Date()

    const [result] = await db
      .insert(activities)
      .values({
        userId,
        type: activity.type,
        action: activity.action,
        details: activity.details,
        relatedId: activity.relatedId || null,
        amount: activity.amount || null,
        timestamp: timestamp,
        deviceInfo: activity.deviceInfo || null,
        location: activity.location || null,
      })
      .returning({ id: activities.id })

    return result?.id.toString() || null
  } catch (error) {
    console.error("Error logging activity:", error)
    return null
  }
}

export async function fetchActivities(
  userId: string,
  filters: {
    startDate?: Date
    endDate?: Date
    type?: string
    action?: string
    relatedId?: string
  } = {},
  page = 1,
  pageSize = 20,
): Promise<{ activities: Activity[]; hasMore: boolean }> {
  try {
    // Build query conditions
    const conditions = [eq(activities.userId, userId)]

    if (filters.startDate) {
      conditions.push(gte(activities.timestamp, ensureDate(filters.startDate) || new Date()))
    } else {
      // Default to 3 months ago
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      conditions.push(gte(activities.timestamp, threeMonthsAgo))
    }

    if (filters.endDate) {
      conditions.push(lte(activities.timestamp, ensureDate(filters.endDate) || new Date()))
    }

    if (filters.type) {
      conditions.push(eq(activities.type, filters.type))
    }

    if (filters.action) {
      conditions.push(eq(activities.action, filters.action))
    }

    if (filters.relatedId) {
      conditions.push(eq(activities.relatedId, filters.relatedId))
    }

    // Calculate offset
    const offset = (page - 1) * pageSize

    // Execute query
    
    const result = await db.query.activities.findMany({
      where: eq(activities.userId, userId),
      orderBy: desc(activities.timestamp),
      limit: pageSize + 1, // Get one extra to check if there are more
      offset,
    })

    // Check if there are more results
    const hasMore = result.length > pageSize
    const activitiesData = hasMore ? result.slice(0, pageSize) : result

    return {
      activities: activitiesData.map((activity) => ({
        id: activity.id.toString(),
        userId: activity.userId,
        type: activity.type as "auth" | "transaction" | "contact",
        action: activity.action,
        details: activity.details,
        relatedId: activity.relatedId || undefined,
        amount: activity.amount ? Number(activity.amount) : undefined,
        timestamp: activity.timestamp.toISOString(),
        deviceInfo: activity.deviceInfo ? JSON.parse(activity.deviceInfo) : undefined,
        location: activity.location || undefined,
      })),
      hasMore,
    }
  } catch (error) {
    console.error("Error fetching activities:", error)
    return { activities: [], hasMore: false }
  }
}
