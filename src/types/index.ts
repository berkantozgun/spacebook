export interface Profile {
  id: string
  email: string
  full_name: string | null
  is_superadmin: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
}

export interface CompanyWithRole extends Company {
  role: 'member' | 'admin' | 'display'
}

export interface AllowedDomain {
  id: string
  company_id: string
  domain: string
  created_at: string
}

export interface Room {
  id: string
  company_id: string
  name: string
  location: string
  capacity: number
  work_start_hour: number
  work_end_hour: number
  is_active: boolean
  created_at: string
}

export interface Reservation {
  id: string
  room_id: string
  user_id: string
  full_name: string
  email: string
  start_time: string
  end_time: string
  attendee_count: number
  purpose: string | null
  status: 'active' | 'cancelled'
  created_at: string
}

export interface BlockedSlot {
  id: string
  room_id: string
  start_time: string
  end_time: string
  reason: string
  created_by: string
  created_at: string
}

export interface RoomDisplayAccess {
  id: string
  user_id: string
  room_id: string
  created_at: string
}

export type SlotStatus = 'available' | 'booked' | 'blocked' | 'past'

export interface Slot {
  start: Date
  end: Date
  label: string
  status: SlotStatus
  reservationId?: string
  bookedBy?: string
}
