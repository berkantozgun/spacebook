import {
  startOfDay,
  addMinutes,
  format,
  isBefore,
  isAfter,
  parseISO,
  isWithinInterval,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Reservation, BlockedSlot, Room } from '../types'
import { APP_CONFIG } from '../config/app'

export const SLOT_MINUTES = APP_CONFIG.slotMinutes

export interface Slot {
  start:          Date
  end:            Date
  label:          string
  status:         'available' | 'booked' | 'blocked' | 'past'
  reservationId?: string
  bookedBy?:      string
}

export function generateSlots(
  date:         Date,
  room:         Room,
  reservations: Reservation[],
  blockedSlots: BlockedSlot[]
): Slot[] {
  const slots: Slot[] = []
  const now = new Date()

  let current = setMilliseconds(setSeconds(setMinutes(
    setHours(startOfDay(date), room.work_start_hour), 0), 0), 0)
  const dayEnd = setMilliseconds(setSeconds(setMinutes(
    setHours(startOfDay(date), room.work_end_hour), 0), 0), 0)

  while (isBefore(current, dayEnd)) {
    const slotStart = new Date(current)
    const slotEnd   = addMinutes(current, SLOT_MINUTES)

    let status: Slot['status'] = 'available'
    let reservationId: string | undefined
    let bookedBy:      string | undefined

    if (isBefore(slotEnd, now)) {
      status = 'past'
    }

    if (status === 'available') {
      const isBlocked = blockedSlots.some(b => {
        const bStart = parseISO(b.start_time)
        const bEnd   = parseISO(b.end_time)
        return (
          isWithinInterval(slotStart, { start: bStart, end: bEnd }) ||
          (isAfter(slotStart, bStart) && isBefore(slotEnd, bEnd))
        )
      })
      if (isBlocked) status = 'blocked'
    }

    if (status === 'available') {
      const booking = reservations.find(r => {
        if (r.status !== 'active') return false
        const rStart = parseISO(r.start_time)
        const rEnd   = parseISO(r.end_time)
        return (
          slotStart.getTime() === rStart.getTime() ||
          isWithinInterval(slotStart, { start: rStart, end: rEnd }) ||
          (isAfter(slotStart, rStart) && isBefore(slotEnd, rEnd))
        )
      })
      if (booking) {
        status        = 'booked'
        reservationId = booking.id
        bookedBy      = booking.full_name
      }
    }

    slots.push({
      start: slotStart,
      end:   slotEnd,
      label: `${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`,
      status,
      reservationId,
      bookedBy,
    })

    current = slotEnd
  }

  return slots
}

export function formatDayLabel(date: Date): string {
  return format(date, 'EEEE, d MMMM', { locale: tr })
}

export function formatShortDate(date: Date): string {
  return format(date, 'd MMM', { locale: tr })
}

export function mergeSlots(slots: Slot[]): { start: Date; end: Date } | null {
  if (slots.length === 0) return null
  const sorted = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime())
  return { start: sorted[0].start, end: sorted[sorted.length - 1].end }
}

export function getUpcomingDays(count: number): Date[] {
  const days: Date[] = []
  const today = startOfDay(new Date())
  for (let i = 0; i < count; i++) {
    days.push(addMinutes(today, i * 24 * 60))
  }
  return days
}
