import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  limit,
  startAfter,
} from "firebase/firestore"
import type { User } from "firebase/auth"
import { db } from "@/lib/firebase"
import type { Activity, Contact, Transaction, UserProfile, DeviceInfo } from "@/lib/types"

// User Management
export async function createUserIfNotExists(
  user: User,
  deviceInfo?: DeviceInfo,
  locationInfo?: string,
): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    // Create new user document
    const userData: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }

    await setDoc(userRef, userData)

    // Log activity with device info
    await logActivity(user.uid, {
      type: "auth",
      action: "signup",
      details: "User created account",
      timestamp: new Date().toISOString(),
      deviceInfo,
      location: locationInfo,
    })

    return userData
  } else {
    // Update last login
    const userData = userSnap.data() as UserProfile
    await updateDoc(userRef, {
      lastLogin: new Date().toISOString(),
    })

    // Log activity with device info
    await logActivity(user.uid, {
      type: "auth",
      action: "login",
      details: "User logged in",
      timestamp: new Date().toISOString(),
      deviceInfo,
      location: locationInfo,
    })

    return userData
  }
}

// Activity Logging
export async function logActivity(userId: string, activity: Omit<Activity, "id" | "userId">): Promise<Activity> {
  const activitiesRef = collection(db, "users", userId, "activities")
  const docRef = await addDoc(activitiesRef, activity)

  return {
    id: docRef.id,
    userId,
    ...activity,
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
  pageSize = 20,
  lastDoc?: any,
): Promise<{ activities: Activity[]; lastDoc: any }> {
  // Calculate date 3 months ago as default
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  // Build query
  let q = query(collection(db, "users", userId, "activities"), orderBy("timestamp", "desc"))

  // Apply filters
  if (filters.startDate || filters.endDate) {
    const startDate = filters.startDate || threeMonthsAgo
    const endDate = filters.endDate || new Date()

    q = query(q, where("timestamp", ">=", startDate.toISOString()), where("timestamp", "<=", endDate.toISOString()))
  } else {
    // Default to last 3 months
    q = query(q, where("timestamp", ">=", threeMonthsAgo.toISOString()))
  }

  if (filters.type) {
    q = query(q, where("type", "==", filters.type))
  }

  if (filters.action) {
    q = query(q, where("action", "==", filters.action))
  }

  if (filters.relatedId) {
    q = query(q, where("relatedId", "==", filters.relatedId))
  }

  // Apply pagination
  q = query(q, limit(pageSize))

  if (lastDoc) {
    q = query(q, startAfter(lastDoc))
  }

  const querySnapshot = await getDocs(q)
  const activities: Activity[] = []
  let lastVisible = null

  querySnapshot.forEach((doc) => {
    activities.push({
      id: doc.id,
      userId,
      ...doc.data(),
    } as Activity)
    lastVisible = doc
  })

  return { activities, lastDoc: lastVisible }
}

// Transactions
export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const q = query(collection(db, "users", userId, "transactions"), orderBy("createdAt", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    userId,
    ...doc.data(),
  })) as Transaction[]
}

export async function addTransaction(
  userId: string,
  transaction: Omit<Transaction, "id" | "userId">,
): Promise<Transaction> {
  const transactionsRef = collection(db, "users", userId, "transactions")
  const docRef = await addDoc(transactionsRef, transaction)

  // Log activity
  await logActivity(userId, {
    type: "transaction",
    action: `add_${transaction.type}`,
    details: `Added ${transaction.type} transaction of ${transaction.amount} with ${transaction.personName}`,
    relatedId: docRef.id,
    amount: transaction.amount,
    timestamp: new Date().toISOString(),
  })

  return {
    id: docRef.id,
    userId,
    ...transaction,
  }
}

// Contacts
export async function fetchContacts(userId: string): Promise<Contact[]> {
  const q = query(collection(db, "users", userId, "contacts"), orderBy("name", "asc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    userId,
    ...doc.data(),
  })) as Contact[]
}

export async function addContact(userId: string, contact: Omit<Contact, "id" | "userId">): Promise<Contact> {
  const contactsRef = collection(db, "users", userId, "contacts")
  const docRef = await addDoc(contactsRef, contact)

  // Log activity
  await logActivity(userId, {
    type: "contact",
    action: "add",
    details: `Added contact: ${contact.name}`,
    relatedId: docRef.id,
    timestamp: new Date().toISOString(),
  })

  return {
    id: docRef.id,
    userId,
    ...contact,
  }
}

export async function updateContact(
  userId: string,
  contact: Omit<Contact, "userId"> & { id: string },
): Promise<Contact> {
  const contactRef = doc(db, "users", userId, "contacts", contact.id)

  // Remove id from the data to be updated
  const { id, ...contactData } = contact
  await updateDoc(contactRef, contactData)

  // Log activity
  await logActivity(userId, {
    type: "contact",
    action: "update",
    details: `Updated contact: ${contact.name}`,
    relatedId: contact.id,
    timestamp: new Date().toISOString(),
  })

  return {
    ...contact,
    userId,
  }
}

export async function deleteContact(userId: string, contactId: string, contactName: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "contacts", contactId))

  // Log activity
  await logActivity(userId, {
    type: "contact",
    action: "delete",
    details: `Deleted contact: ${contactName}`,
    relatedId: contactId,
    timestamp: new Date().toISOString(),
  })
}

