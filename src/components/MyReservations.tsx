import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import type { Profile, Reservation, Room } from '../types'

interface Props {
  profile:    Profile
  rooms:      Room[]
  onRefresh?: () => void
}

export default function MyReservations({ profile, rooms, onRefresh }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading,      setLoading]      = useState(true)
  const [cancelling,   setCancelling]   = useState<string | null>(null)

  useEffect(() => { fetchReservations() }, [profile.id])

  async function fetchReservations() {
    setLoading(true)
    const roomIds = rooms.map(r => r.id)
    if (roomIds.length === 0) { setLoading(false); return }

    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .in('room_id', roomIds)
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    if (data) setReservations(data as Reservation[])
    setLoading(false)
  }

  async function handleCancel(id: string) {
    setCancelling(id)
    const { error } = await supabase
      .from('reservations').update({ status: 'cancelled' })
      .eq('id', id).eq('user_id', profile.id)
    setCancelling(null)
    if (!error) {
      setReservations(prev => prev.filter(r => r.id !== id))
      onRefresh?.()
    }
  }

  if (loading) return (
    <div style={{ padding:'2rem', textAlign:'center', color:'#9D9D9D', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif" }}>
      Yukleniyor...
    </div>
  )

  return (
    <div style={{ fontFamily:"'Montserrat', sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#0F0F0F' }}>Rezervasyonlarim</h3>
        <span style={{ background:'#FCEEF2', color:'#E45A80', fontSize:'0.7rem', fontWeight:700, padding:'3px 10px', borderRadius:'999px' }}>
          {reservations.length} aktif
        </span>
      </div>

      {reservations.length === 0 ? (
        <div style={{ padding:'2rem', textAlign:'center', background:'#fafafa', borderRadius:'0.75rem', border:'1px dashed #DDDDDD', color:'#9D9D9D', fontSize:'0.8rem' }}>
          Aktif rezervasyonunuz yok.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
          {reservations.map(r => {
            const start = parseISO(r.start_time)
            const end   = parseISO(r.end_time)
            const mins  = (end.getTime() - start.getTime()) / 60000
            const room  = rooms.find(rm => rm.id === r.room_id)
            return (
              <div key={r.id} style={{
                background:'#ffffff', border:'1px solid #DDDDDD', borderRadius:'0.625rem',
                padding:'0.875rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem',
              }}>
                <div style={{ flex:1 }}>
                  {room && (
                    <div style={{ fontSize:'0.65rem', color:'#E45A80', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'2px' }}>
                      {room.name}
                    </div>
                  )}
                  <div style={{ fontSize:'0.7rem', color:'#9D9D9D', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'3px' }}>
                    {format(start, 'EEEE, d MMMM yyyy', { locale: tr })}
                  </div>
                  <div style={{ fontSize:'1rem', fontWeight:800, color:'#E45A80', lineHeight:1.2 }}>
                    {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                  </div>
                  <div style={{ display:'flex', gap:'0.75rem', marginTop:'4px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.7rem', color:'#9D9D9D' }}>{mins} dk</span>
                    <span style={{ fontSize:'0.7rem', color:'#9D9D9D' }}>{r.attendee_count} kisi</span>
                    {r.purpose && (
                      <span style={{ fontSize:'0.7rem', color:'#9D9D9D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'200px' }}>
                        {r.purpose}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(r.id)}
                  disabled={cancelling === r.id}
                  style={{
                    background:'transparent', border:'1.5px solid #DDDDDD', borderRadius:'0.25rem',
                    padding:'0.375rem 0.75rem', fontSize:'0.7rem',
                    fontFamily:"'Montserrat', sans-serif", fontWeight:600,
                    color:'#9D9D9D', cursor: cancelling === r.id ? 'not-allowed' : 'pointer', whiteSpace:'nowrap', transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { if (cancelling !== r.id) { (e.target as HTMLButtonElement).style.borderColor='#D72B01'; (e.target as HTMLButtonElement).style.color='#D72B01' }}}
                  onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor='#DDDDDD'; (e.target as HTMLButtonElement).style.color='#9D9D9D' }}
                >
                  {cancelling === r.id ? '...' : 'Iptal Et'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
