export interface Transaction {
  id: string
  type: "lend" | "borrow" | "recover" | "payment"
  personId: string
  personName: string
  personPhone: string
  amount: number
  date: string
  returnDate?: string
  notes?: string
  method?: "cash" | "bKash" | "Nogod" | "rocket" | "bank" | string
  userId: string
  createdAt: string
}

export interface Contact {
  id: string
  name: string
  phone: string
  userId: string
  createdAt: string
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
  createdAt: string
  lastLogin: string
}

export interface DeviceInfo {
  userAgent: string
  browser: string
  os: string
  device: string
  language: string
  timeZone: string
}

export interface LocationInfo {
  country?: string
  region?: string
  city?: string
}

export interface Activity {
  id: string
  userId: string
  type: "auth" | "transaction" | "contact"
  action: string
  details: string
  relatedId?: string
  amount?: number
  timestamp: string
  deviceInfo?: DeviceInfo
  location?: string
}

