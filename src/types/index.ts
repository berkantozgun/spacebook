// =============================================
// SPACEBOOK — Type Definitions
// =============================================

export interface Profile {
  id:            string
  full_name:     string
  email:         string
  is_superadmin: boolean
  created_at:    string
}

export interface Company {
  id:         string
  name:       string
  slug:       string
  is_active:  boolean
  created_at: string
}

export interface AllowedDomain {
  id:         string
  company_id: string
  domain:     string
  created_at: string
}

export interface Room {
  id:               string
  company_id:       string
  name:             string
  location:         string | null
  capacity:         number
  work_start_hour:  number
  work_end_hour:    number
  is_active:        boolean
  created_at:       string
}

export type CompanyRole = 'member' | 'admin' | 'display'

export interface CompanyMember {
  id:         string
  user_id:    string
  company_id: string
  role:       CompanyRole
  created_at: string
}

export interface CompanyWithRole {
  company:    Company
  role:       CompanyRole
  memberId:   string
}

export interface RoomDisplayAccess {
  id:         string
  user_id:    string
  room_id:    string
  created_at: string
}

export interface Reservation {
  id:              string
  room_id:         string
  user_id:         string
  full_name:       string
  email:           string
  start_time:      string
  end_time:        string
  attendee_count:  number
  purpose?:        string
  status:          'active' | 'cancelled'
  created_at:      string
}

export interface BlockedSlot {
  id:          string
  room_id:     string
  start_time:  string
  end_time:    string
  reason?:     string
  created_by?: string
  created_at:  string
}

export interface DisplayReservation {
  room_id:        string
  full_name:      string
  start_time:     string
  end_time:       string
  attendee_count: number
  slot_day:       string
}
