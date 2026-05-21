import { useEffect, useState } from 'react'
import type { Reservation } from '../types'
import { supabase } from '../lib/supabase'

export function useDisplayData(roomId: string) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const now = new Date()
        const threeDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

        const { data, error: err } = await supabase
          .from('reservations')
          .select('*')
          .eq('room_id', roomId)
          .eq('status', 'active')
          .gte('start_time', threeDaysAgo.toISOString())
          .lt('start_time', threeDaysLater.toISOString())
          .order('start_time', { ascending: true })

        if (err) throw err
        setReservations(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reservations')
      } finally {
        setLoading(false)
      }
    }

    loadReservations()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`reservations:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadReservations()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  return { reservations, loading, error }
}
