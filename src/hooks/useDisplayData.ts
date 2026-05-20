import { useState, useEffect, useCallback } from 'react'
import { startOfDay, addDays, subDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { DisplayReservation } from '../types'

export interface DayGroup {
  label:        string
  date:         Date
  reservations: DisplayReservation[]
}

export function useDisplayData(roomId: string) {
  const [groups,      setGroups]      = useState<DayGroup[]>([])
  const [loading,     setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchData = useCallback(async () => {
    const today     = startOfDay(new Date())
    const yesterday = subDays(today, 1)
    const tomorrow  = addDays(today, 1)

    const { data, error } = await supabase
      .from('display_reservations_view')
      .select('*')
      .eq('room_id', roomId)
      .order('start_time', { ascending: true })

    if (error || !data) { setLoading(false); return }

    const reservations = data as DisplayReservation[]
    const toDate = (d: DisplayReservation) => startOfDay(new Date(d.start_time))
    const filterDay = (target: Date) =>
      reservations.filter(r => toDate(r).getTime() === target.getTime())

    setGroups([
      { label: 'Dun',   date: yesterday, reservations: filterDay(yesterday) },
      { label: 'Bugün', date: today,     reservations: filterDay(today)     },
      { label: 'Yarin', date: tomorrow,  reservations: filterDay(tomorrow)  },
    ])
    setLastUpdated(new Date())
    setLoading(false)
  }, [roomId])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel(`display-${roomId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'reservations',
        filter: `room_id=eq.${roomId}`,
      }, () => fetchData())
      .subscribe()

    const dataInterval    = setInterval(fetchData, 60000)
    const sessionInterval = setInterval(async () => {
      const { error } = await supabase.auth.refreshSession()
      if (error) window.location.reload()
    }, 10 * 60 * 1000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.href = '/login'
    })

    return () => {
      supabase.removeChannel(channel)
      clearInterval(dataInterval)
      clearInterval(sessionInterval)
      subscription.unsubscribe()
    }
  }, [fetchData, roomId])

  return { groups, loading, lastUpdated, refresh: fetchData }
}
