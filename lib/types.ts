export interface Transaction {
  id: string | number // Can be string from Firebase or number from DB
  type: "lend" | "borrow" | "recover" | "payment"
  contactId: string // Reference to the contact
  contactName?: string // Populated from the contact when fetched
  personPhone?: string // Populated from the contact when fetched
  personDeleted?: boolean // Indicates if the contact is deleted
  amount: number // This will be in dollars in the UI
  date: string // ISO string
  returnDate?: string // ISO string
  notes?: string
  method?: "cash" | "bKash" | "Nogod" | "rocket" | "bank" | string
  userId: string
  createdAt: string // ISO string
  updatedAt?: string // ISO string
}

export interface Contact {
  id: string | number // Can be string or number
  name: string
  phone: string
  userId: string
  isDeleted?: boolean // For soft delete
  createdAt: string // ISO string
  updatedAt?: string // ISO string
}

export interface UserProfile {
  userId: string
  email: string
  name: string
  image: string
  createdAt: string // ISO string
  lastLogin: string // ISO string
}

export interface DeviceInfo {
  userAgent: string
  browser?: string
  os?: string
  device?: string
  language: string
  timeZone: string
}

export interface Activity {
  id: string | number // Can be string or number
  userId: string
  type: "auth" | "transaction" | "contact"
  action: string
  details: string
  relatedId?: string
  amount?: number
  timestamp: string // ISO string
  deviceInfo?: DeviceInfo | string // Can be object or JSON string
  location?: string
}

export interface LocationInfo {
  country?: string
  region?: string
  city?: string
}
