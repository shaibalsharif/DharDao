import { db } from "@/lib/db";
import { activities, contacts, transactions, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { NewActivity, NewContact, NewTransaction } from "./db/schema";

// User Management
export async function getUserById(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.userId, userId),
  });
}

export async function logActivity({
  userId,
  type,
  action,
  details,
  timestamp,
  relatedId,
  amount,
  deviceInfo,
  location,
}: {
  userId: string;
  type: string;
  action: string;
  details: string;
  timestamp: Date;
  relatedId?: string;
  amount?: number;
  deviceInfo?: any;
  location?: string;
}) {
  try {
    await db.insert(activities).values({
      userId,
      type,
      action,
      details,
      timestamp,
      relatedId,
      amount,
      deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
      location,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

export async function fetchActivities(
  userId: string,
  filters: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    action?: string;
    relatedId?: string;
  } = {},
  pageSize = 20,
  offset = 0
) {
  let query = db
    .select()
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.timestamp))
    .limit(pageSize)
    .offset(offset);

  // Apply filters
  if (filters.startDate) {
    query = query.where(gte(activities.timestamp, filters.startDate));
  }

  if (filters.endDate) {
    query = query.where(lte(activities.timestamp, filters.endDate));
  }

  if (filters.type) {
    query = query.where(eq(activities.type, filters.type));
  }

  if (filters.action) {
    query = query.where(eq(activities.action, filters.action));
  }

  if (filters.relatedId) {
    query = query.where(eq(activities.relatedId, filters.relatedId));
  }

  const result = await query;
  
  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(eq(activities.userId, userId));
  
  const total = countResult[0]?.count || 0;

  return {
    activities: result,
    total,
    hasMore: offset + result.length < total,
  };
}

// Transactions
export async function fetchTransactions(userId: string) {
 
  
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.contactId, userId))
    .orderBy(desc(transactions.createdAt));
}

export async function addTransaction(
  userId: string,
  transaction: Omit<NewTransaction, "id" | "userId">
) {
  // Convert amount to cents for storage
  const amountInCents = Math.round(transaction.amount * 100);
  
  const [result] = await db
    .insert(transactions)
    .values({
      ...transaction,
      userId,
      amount: amountInCents,
    })
    .returning();

  // Log activity
  await logActivity({
    userId,
    type: "transaction",
    action: `add_${transaction.type}`,
    details: `Added ${transaction.type} transaction of ${transaction.amount} with ${transaction.personName}`,
    relatedId: result.id.toString(),
    amount: amountInCents,
    timestamp: new Date(),
  });

  // Convert amount back to dollars for the return value
  return {
    ...result,
    amount: result.amount / 100,
  };
}

// Contacts
export async function fetchContacts(userId: string) {
  return db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId))
    .orderBy(contacts.name);
}

export async function addContact(
  userId: string,
  contact: Omit<NewContact, "id" | "userId">
) {
  const [result] = await db
    .insert(contacts)
    .values({
      ...contact,
      userId,
    })
    .returning();

  // Log activity
  await logActivity({
    userId,
    type: "contact",
    action: "add",
    details: `Added contact: ${contact.name}`,
    relatedId: result.id.toString(),
    timestamp: new Date(),
  });

  return result;
}

export async function updateContact(
  userId: string,
  contactId: number,
  contactData: { name: string; phone: string }
) {
  const [result] = await db
    .update(contacts)
    .set(contactData)
    .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
    .returning();

  // Log activity
  await logActivity({
    userId,
    type: "contact",
    action: "update",
    details: `Updated contact: ${contactData.name}`,
    relatedId: contactId.toString(),
    timestamp: new Date(),
  });

  return result;
}

export async function deleteContact(
  userId: string,
  contactId: number,
  contactName: string
) {
  await db
    .delete(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));

  // Log activity
  await logActivity({
    userId,
    type: "contact",
    action: "delete",
    details: `Deleted contact: ${contactName}`,
    relatedId: contactId.toString(),
    timestamp: new Date(),
  });
}