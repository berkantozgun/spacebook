import { useCallback, useEffect, useState } from 'react'
import type {
  Room,
  Reservation,
  BlockedSlot,
  AllowedDomain,
  CompanyWithRole,
} from '../types'
import { supabase } from '../lib/supabase'

export function useAdminData(companyId: string | null) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [domains, setDomains] = useState<AllowedDomain[]>([])
  const [members, setMembers] = useState<CompanyWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return

    const loadData = async () => {
      try {
        setLoading(true)

        const [roomsRes, domainsRes, blockedRes, reservationsRes] =
          await Promise.all([
            supabase.from('rooms').select('*').eq('company_id', companyId),
            supabase
              .from('allowed_domains')
              .select('*')
              .eq('company_id', companyId),
            supabase
              .from('blocked_slots')
              .select('*')
              .in(
                'room_id',
                (await supabase
                  .from('rooms')
                  .select('id')
                  .eq('company_id', companyId)).data?.map((r) => r.id) || []
              ),
            supabase
              .from('reservations')
              .select('*')
              .in(
                'room_id',
                (await supabase
                  .from('rooms')
                  .select('id')
                  .eq('company_id', companyId)).data?.map((r) => r.id) || []
              ),
          ])

        if (roomsRes.error) throw roomsRes.error
        if (domainsRes.error) throw domainsRes.error
        if (blockedRes.error) throw blockedRes.error
        if (reservationsRes.error) throw reservationsRes.error

        setRooms(roomsRes.data || [])
        setDomains(domainsRes.data || [])
        setBlockedSlots(blockedRes.data || [])
        setReservations(reservationsRes.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [companyId])

  const addRoom = useCallback(
    async (room: Omit<Room, 'id' | 'created_at'>) => {
      if (!companyId) return
      const { data, error: err } = await supabase
        .from('rooms')
        .insert([{ ...room, company_id: companyId }])
        .select()
        .single()
      if (err) throw err
      setRooms((prev) => [...prev, data])
      return data
    },
    [companyId]
  )

  const updateRoom = useCallback(async (id: string, updates: Partial<Room>) => {
    const { data, error: err } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setRooms((prev) => prev.map((r) => (r.id === id ? data : r)))
    return data
  }, [])

  const addBlockedSlot = useCallback(
    async (slot: Omit<BlockedSlot, 'id' | 'created_at'>) => {
      const { data, error: err } = await supabase
        .from('blocked_slots')
        .insert([slot])
        .select()
        .single()
      if (err) throw err
      setBlockedSlots((prev) => [...prev, data])
      return data
    },
    []
  )

  const removeBlockedSlot = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('blocked_slots')
      .delete()
      .eq('id', id)
    if (err) throw err
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const addDomain = useCallback(
    async (domain: string) => {
      if (!companyId) return
      const { data, error: err } = await supabase
        .from('allowed_domains')
        .insert([{ company_id: companyId, domain }])
        .select()
        .single()
      if (err) throw err
      setDomains((prev) => [...prev, data])
      return data
    },
    [companyId]
  )

  const removeDomain = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('allowed_domains')
      .delete()
      .eq('id', id)
    if (err) throw err
    setDomains((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const cancelReservation = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (err) throw err
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
    )
  }, [])

  return {
    rooms,
    reservations,
    blockedSlots,
    domains,
    loading,
    error,
    addRoom,
    updateRoom,
    addBlockedSlot,
    removeBlockedSlot,
    addDomain,
    removeDomain,
    cancelReservation,
  }
}
