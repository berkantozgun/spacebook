import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  Room, AllowedDomain, CompanyMember,
  Reservation, BlockedSlot, Profile,
} from '../types'

export function useAdminData(companyId: string) {
  const [rooms,        setRooms]        = useState<Room[]>([])
  const [domains,      setDomains]      = useState<AllowedDomain[]>([])
  const [members,      setMembers]      = useState<(CompanyMember & { profile: Profile })[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [loading,      setLoading]      = useState(false)

  const fetchAll = useCallback(async () => {
    if (!companyId) return
    setLoading(true)

    const [rms, doms, mems, res, blk] = await Promise.all([
      supabase.from('rooms').select('*').eq('company_id', companyId).order('name'),
      supabase.from('allowed_domains').select('*').eq('company_id', companyId).order('domain'),
      supabase.from('company_members')
        .select('*, profile:profiles(*)')
        .eq('company_id', companyId)
        .order('created_at'),
      supabase.from('reservations')
        .select('*')
        .in('room_id',
          (await supabase.from('rooms').select('id').eq('company_id', companyId))
            .data?.map(r => r.id) ?? []
        )
        .gte('start_time', new Date().toISOString())
        .order('start_time'),
      supabase.from('blocked_slots')
        .select('*')
        .in('room_id',
          (await supabase.from('rooms').select('id').eq('company_id', companyId))
            .data?.map(r => r.id) ?? []
        )
        .gte('start_time', new Date().toISOString())
        .order('start_time'),
    ])

    if (rms.data)  setRooms(rms.data as Room[])
    if (doms.data) setDomains(doms.data as AllowedDomain[])
    if (mems.data) setMembers(mems.data as any)
    if (res.data)  setReservations(res.data as Reservation[])
    if (blk.data)  setBlockedSlots(blk.data as BlockedSlot[])

    setLoading(false)
  }, [companyId])

  // --- ROOMS ---
  async function addRoom(data: Partial<Room>) {
    const { error } = await supabase.from('rooms').insert({ ...data, company_id: companyId })
    if (!error) await fetchAll()
    return !error
  }

  async function updateRoom(id: string, data: Partial<Room>) {
    const { error } = await supabase.from('rooms').update(data).eq('id', id)
    if (!error) await fetchAll()
    return !error
  }

  async function toggleRoom(id: string, is_active: boolean) {
    return updateRoom(id, { is_active })
  }

  // --- DOMAINS ---
  async function addDomain(domain: string) {
    const { error } = await supabase.from('allowed_domains')
      .insert({ company_id: companyId, domain: domain.toLowerCase().trim() })
    if (!error) await fetchAll()
    return !error
  }

  async function removeDomain(id: string) {
    const { error } = await supabase.from('allowed_domains').delete().eq('id', id)
    if (!error) await fetchAll()
    return !error
  }

  // --- MEMBERS ---
  async function updateMemberRole(memberId: string, role: string) {
    const { error } = await supabase.from('company_members')
      .update({ role }).eq('id', memberId)
    if (!error) await fetchAll()
    return !error
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase.from('company_members').delete().eq('id', memberId)
    if (!error) await fetchAll()
    return !error
  }

  // --- DISPLAY ACCESS ---
  async function getDisplayAccess(roomId: string) {
    const { data } = await supabase.from('room_display_access')
      .select('*, profile:profiles(full_name, email)')
      .eq('room_id', roomId)
    return data ?? []
  }

  async function grantDisplayAccess(userId: string, roomId: string) {
    const { error } = await supabase.from('room_display_access')
      .insert({ user_id: userId, room_id: roomId })
    return !error
  }

  async function revokeDisplayAccess(accessId: string) {
    const { error } = await supabase.from('room_display_access').delete().eq('id', accessId)
    return !error
  }

  // --- RESERVATIONS ---
  async function cancelReservation(id: string) {
    const { error } = await supabase.from('reservations')
      .update({ status: 'cancelled' }).eq('id', id)
    if (!error) await fetchAll()
    return !error
  }

  // --- BLOCKED SLOTS ---
  async function addBlockedSlot(roomId: string, start: Date, end: Date, reason: string, userId: string) {
    const { error } = await supabase.from('blocked_slots').insert({
      room_id:    roomId,
      start_time: start.toISOString(),
      end_time:   end.toISOString(),
      reason:     reason.trim() || null,
      created_by: userId,
    })
    if (!error) await fetchAll()
    return !error
  }

  async function removeBlockedSlot(id: string) {
    const { error } = await supabase.from('blocked_slots').delete().eq('id', id)
    if (!error) await fetchAll()
    return !error
  }

  // --- CSV EXPORT ---
  function exportCSV() {
    const headers = ['Ad Soyad', 'E-posta', 'Oda', 'Tarih', 'Baslangic', 'Bitis', 'Sure(dk)', 'Katilimci', 'Amac', 'Durum']
    const rows = reservations.map(r => {
      const start = new Date(r.start_time)
      const end   = new Date(r.end_time)
      const mins  = (end.getTime() - start.getTime()) / 60000
      const room  = rooms.find(rm => rm.id === r.room_id)
      return [
        r.full_name, r.email, room?.name ?? '',
        start.toLocaleDateString('tr-TR'),
        start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        end.toLocaleTimeString('tr-TR',   { hour: '2-digit', minute: '2-digit' }),
        mins, r.attendee_count, r.purpose ?? '',
        r.status === 'active' ? 'Aktif' : 'Iptal',
      ]
    })
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `spacebook-rezervasyonlar-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    rooms, domains, members, reservations, blockedSlots, loading,
    fetchAll,
    addRoom, updateRoom, toggleRoom,
    addDomain, removeDomain,
    updateMemberRole, removeMember,
    getDisplayAccess, grantDisplayAccess, revokeDisplayAccess,
    cancelReservation,
    addBlockedSlot, removeBlockedSlot,
    exportCSV,
  }
}
