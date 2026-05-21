import type { Slot, Room, Reservation, BlockedSlot } from '../types'
import { APP_CONFIG } from '../config/app'

export function generateSlots(
  date: Date,
  room: Room,
  reservations: Reservation[],
  blockedSlots: BlockedSlot[]
): Slot[] {
  const slots: Slot[] = []
  const now = new Date()
  const dateStart = new Date(date)
  dateStart.setHours(0, 0, 0, 0)

  for (let hour = room.work_start_hour; hour < room.work_end_hour; hour++) {
    for (let minute = 0; minute < 60; minute += APP_CONFIG.slotMinutes) {
      const slotStart = new Date(dateStart)
      slotStart.setHours(hour, minute, 0, 0)

      const slotEnd = new Date(slotStart)
      slotEnd.setMinutes(slotEnd.getMinutes() + APP_CONFIG.slotMinutes)

      let status: Slot['status'] = 'available'
      let reservationId: string | undefined
      let bookedBy: string | undefined

      // Check if past
      if (slotEnd <= now) {
        status = 'past'
      }
      // Check if blocked
      else if (
        blockedSlots.some(
          (bs) =>
            new Date(bs.start_time) <= slotStart &&
            new Date(bs.end_time) > slotStart
        )
      ) {
        status = 'blocked'
      }
      // Check if booked
      else {
        const booking = reservations.find(
          (r) =>
            r.status === 'active' &&
            new Date(r.start_time) <= slotStart &&
            new Date(r.end_time) > slotStart
        )
        if (booking) {
          status = 'booked'
          reservationId = booking.id
          bookedBy = booking.full_name
        }
      }

      slots.push({
        start: slotStart,
        end: slotEnd,
        label: `${formatTime(slotStart)} - ${formatTime(slotEnd)}`,
        status,
        reservationId,
        bookedBy,
      })
    }
  }

  return slots
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function getUpcomingDays(count: number): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < count; i++) {
    const day = new Date(today)
    day.setDate(day.getDate() + i)
    days.push(day)
  }

  return days
}

export function mergeSlots(slots: Slot[]): Slot[] {
  if (slots.length === 0) return []

  const merged: Slot[] = []
  let current = slots[0]

  for (let i = 1; i < slots.length; i++) {
    const next = slots[i]
    if (
      current.status === next.status &&
      current.reservationId === next.reservationId &&
      current.bookedBy === next.bookedBy &&
      current.end.getTime() === next.start.getTime()
    ) {
      current = {
        ...current,
        end: next.end,
        label: `${formatTime(current.start)} - ${formatTime(next.end)}`,
      }
    } else {
      merged.push(current)
      current = next
    }
  }
  merged.push(current)

  return merged
}
