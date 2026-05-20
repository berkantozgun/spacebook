import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useDisplayData } from '../hooks/useDisplayData'
import type { DisplayReservation, Room } from '../types'
import { APP_CONFIG } from '../config/app'

export default function DisplayPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { profile, loading: authLoading } = useAuth()
  const [room,         setRoom]         = useState<Room | null>(null)
  const [hasAccess,    setHasAccess]    = useState<boolean | null>(null)
  const [currentTime,  setCurrentTime]  = useState(new Date())

  const { groups, loading, lastUpdated } = useDisplayData(roomId ?? '')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!profile || !roomId) return

    async function checkAccess() {
      // Oda bilgisini al
      const { data: roomData } = await supabase
        .from('rooms').select('*').eq('id', roomId!).single()
      if (roomData) setRoom(roomData as Room)

      // Superadmin veya firmanin admin'i her odaya erisebilir
      if (profile!.is_superadmin) { setHasAccess(true); return }

      // room_display_access kontrol
      const { data: access } = await supabase
        .from('room_display_access')
        .select('id')
        .eq('user_id', profile!.id)
        .eq('room_id', roomId!)
        .single()

      if (access) { setHasAccess(true); return }

      // Firmanin admin'i de erisebilir
      if (roomData) {
        const { data: membership } = await supabase
          .from('company_members')
          .select('role')
          .eq('user_id', profile!.id)
          .eq('company_id', (roomData as Room).company_id)
          .single()

        if (membership?.role === 'admin') { setHasAccess(true); return }
      }

      setHasAccess(false)
    }

    checkAccess()
  }, [profile, roomId])

  if (authLoading || hasAccess === null) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg, #1a0a0f 0%, #2d0f1a 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Montserrat', sans-serif", color:'rgba(255,255,255,0.4)', fontSize:'0.875rem' }}>
      Yukleniyor...
    </div>
  )

  if (!profile) return <Navigate to="/login" replace />
  if (!hasAccess) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg, #1a0a0f 0%, #2d0f1a 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Montserrat', sans-serif" }}>
      <div style={{ textAlign:'center', color:'rgba(255,255,255,0.5)' }}>
        <div style={{ fontSize:'2rem', marginBottom:'1rem' }}>🔒</div>
        <p style={{ fontSize:'0.875rem' }}>Bu oda icin erisim yetkiniz yok.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg, #1a0a0f 0%, #2d0f1a 100%)', fontFamily:"'Montserrat', sans-serif", display:'flex', flexDirection:'column', padding:'2rem', boxSizing:'border-box' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem', borderBottom:'1px solid rgba(228,90,128,0.3)', paddingBottom:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ background:'#E45A80', padding:'8px 18px', borderRadius:'4px', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <span style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', letterSpacing:'3px' }}>{APP_CONFIG.appName.toUpperCase()}</span>
          </div>
          <div>
            <div style={{ color:'#ffffff', fontWeight:700, fontSize:'1rem' }}>{room?.name ?? 'Toplanti Odasi'}</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.7rem', marginTop:'2px' }}>
              {room?.location && `${room.location} · `}Maks. {room?.capacity ?? '-'} Kisi
            </div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ color:'#E45A80', fontWeight:800, fontSize:'2.5rem', lineHeight:1, letterSpacing:'-1px' }}>
            {format(currentTime,'HH:mm')}
            <span style={{ fontSize:'1.5rem', opacity:0.6 }}>:{format(currentTime,'ss')}</span>
          </div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.75rem', marginTop:'4px' }}>
            {format(currentTime,'EEEE, d MMMM yyyy', { locale: tr })}
          </div>
        </div>
      </div>

      {/* Kolonlar */}
      {loading ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:'0.875rem' }}>
          Yukleniyor...
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr 1fr', gap:'1.25rem', flex:1 }}>
          {groups.map((group, idx) => {
            const isMiddle = idx === 1
            return (
              <div key={group.label} style={{
                background:   isMiddle ? 'rgba(228,90,128,0.12)' : 'rgba(255,255,255,0.04)',
                border:       isMiddle ? '1px solid rgba(228,90,128,0.4)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.875rem', padding:'1.25rem',
                display:'flex', flexDirection:'column', gap:'0.75rem',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'0.75rem', borderBottom: isMiddle ? '1px solid rgba(228,90,128,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <div style={{ color: isMiddle ? '#E45A80' : 'rgba(255,255,255,0.5)', fontWeight:800, fontSize: isMiddle ? '1rem' : '0.85rem' }}>
                      {group.label}
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.65rem', marginTop:'2px' }}>
                      {format(group.date,'d MMMM yyyy', { locale: tr })}
                    </div>
                  </div>
                  <span style={{ background: isMiddle ? '#E45A80' : 'rgba(255,255,255,0.1)', color:'#ffffff', fontSize:'0.65rem', fontWeight:700, padding:'3px 8px', borderRadius:'999px' }}>
                    {group.reservations.length} rezervasyon
                  </span>
                </div>

                {group.reservations.length === 0 ? (
                  <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.2)', fontSize:'0.75rem', textAlign:'center', padding:'2rem 0' }}>
                    Rezervasyon yok
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', overflowY:'auto' }}>
                    {group.reservations.map((r: DisplayReservation, i: number) => {
                      const start = parseISO(r.start_time)
                      const end   = parseISO(r.end_time)
                      return (
                        <div key={i} style={{
                          background: isMiddle ? 'rgba(228,90,128,0.15)' : 'rgba(255,255,255,0.06)',
                          border:     isMiddle ? '1px solid rgba(228,90,128,0.25)' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius:'0.5rem', padding:'0.625rem 0.875rem',
                          display:'flex', justifyContent:'space-between', alignItems:'center', gap:'0.75rem',
                        }}>
                          <div style={{ color:'#ffffff', fontWeight:600, fontSize: isMiddle ? '0.875rem' : '0.775rem', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {r.full_name}
                          </div>
                          <div style={{ color: isMiddle ? '#E45A80' : 'rgba(255,255,255,0.5)', fontWeight:700, fontSize: isMiddle ? '0.875rem' : '0.75rem', whiteSpace:'nowrap', flexShrink:0 }}>
                            {format(start,'HH:mm')}-{format(end,'HH:mm')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'1.25rem', paddingTop:'0.875rem', borderTop:'1px solid rgba(228,90,128,0.2)' }}>
        <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.65rem' }}>{APP_CONFIG.appName} · {room?.name}</span>
        <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.65rem' }}>Son guncelleme: {format(lastUpdated,'HH:mm:ss')}</span>
      </div>
    </div>
  )
}
