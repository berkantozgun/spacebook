import { useState, useEffect, useCallback } from 'react'
import { startOfDay } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import DayPicker      from '../components/DayPicker'
import SlotGrid       from '../components/SlotGrid'
import BookingForm    from '../components/BookingForm'
import MyReservations from '../components/MyReservations'
import RoomSelector   from '../components/RoomSelector'
import { generateSlots } from '../lib/slots'
import type { Slot } from '../lib/slots'
import type { Reservation, BlockedSlot, Room } from '../types'
import { APP_CONFIG } from '../config/app'

export default function BookingPage() {
  const { profile, selectedCompany, companies, selectCompany, signOut, isAdmin, isSuperAdmin } = useAuth()

  const [rooms,         setRooms]         = useState<Room[]>([])
  const [selectedRoom,  setSelectedRoom]  = useState<Room | null>(null)
  const [selectedDate,  setSelectedDate]  = useState(startOfDay(new Date()))
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([])
  const [showForm,      setShowForm]      = useState(false)
  const [reservations,  setReservations]  = useState<Reservation[]>([])
  const [blockedSlots,  setBlockedSlots]  = useState<BlockedSlot[]>([])
  const [loadingSlots,  setLoadingSlots]  = useState(false)
  const [activeTab,     setActiveTab]     = useState<'book' | 'mine'>('book')
  const [successMsg,    setSuccessMsg]    = useState('')

  // Firma odalarini cek
  useEffect(() => {
    if (!selectedCompany) return
    supabase.from('rooms').select('*')
      .eq('company_id', selectedCompany.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setRooms(data as Room[])
          if (data.length === 1) setSelectedRoom(data[0] as Room)
        }
      })
  }, [selectedCompany])

  const fetchSlotData = useCallback(async () => {
    if (!selectedRoom) return
    setLoadingSlots(true)
    const dayStart = startOfDay(selectedDate).toISOString()
    const dayEnd   = new Date(startOfDay(selectedDate).getTime() + 86400000).toISOString()

    const [resResult, blkResult] = await Promise.all([
      supabase.from('reservations').select('*').eq('status','active').eq('room_id', selectedRoom.id).gte('start_time', dayStart).lt('start_time', dayEnd),
      supabase.from('blocked_slots').select('*').eq('room_id', selectedRoom.id).gte('start_time', dayStart).lt('start_time', dayEnd),
    ])

    if (resResult.data) setReservations(resResult.data as Reservation[])
    if (blkResult.data) setBlockedSlots(blkResult.data as BlockedSlot[])
    setLoadingSlots(false)
  }, [selectedDate, selectedRoom])

  useEffect(() => { fetchSlotData() }, [fetchSlotData])

  const slots = selectedRoom
    ? generateSlots(selectedDate, selectedRoom, reservations, blockedSlots)
    : []

  function handleSlotClick(slot: Slot) {
    setSelectedSlots(prev => {
      const exists = prev.some(s => s.start.getTime() === slot.start.getTime())
      if (exists) return prev.filter(s => s.start.getTime() !== slot.start.getTime())
      return [...prev, slot].sort((a, b) => a.start.getTime() - b.start.getTime())
    })
  }

  function handleDayChange(date: Date) {
    setSelectedDate(date)
    setSelectedSlots([])
    setShowForm(false)
  }

  async function handleBookingSuccess() {
    setShowForm(false)
    setSelectedSlots([])
    setSuccessMsg('Rezervasyonunuz basariyla olusturuldu.')
    await fetchSlotData()
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  if (!profile) return null

  const canSwitchCompany = companies.length > 1

  return (
    <div style={{ minHeight:'100vh', background:'#fafafa', fontFamily:"'Montserrat', sans-serif" }}>

      {/* Header */}
      <div style={{
        background:'#ffffff', borderBottom:'1px solid #DDDDDD',
        padding:'0 1.5rem', height:'56px', display:'flex',
        alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ background:'#E45A80', padding:'4px 12px', borderRadius:'3px', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <span style={{ color:'#fff', fontWeight:800, fontSize:'0.75rem', letterSpacing:'2px' }}>{APP_CONFIG.appName.toUpperCase()}</span>
          </div>
          {selectedCompany && (
            <span style={{ fontSize:'0.75rem', color:'#9D9D9D', fontWeight:500 }}>
              {selectedCompany.name}
            </span>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {(isAdmin || isSuperAdmin) && (
            <a href="/admin" style={{ fontSize:'0.72rem', color:'#9D9D9D', textDecoration:'none', fontWeight:600 }}>
              Yonetim
            </a>
          )}
          {isSuperAdmin && (
            <a href="/superadmin" style={{ fontSize:'0.72rem', color:'#9D9D9D', textDecoration:'none', fontWeight:600 }}>
              Superadmin
            </a>
          )}
          {canSwitchCompany && (
            <button
              onClick={() => { const el = document.getElementById('company-switcher'); if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none' }}
              style={{ background:'transparent', border:'1px solid #DDDDDD', borderRadius:'0.25rem', padding:'4px 10px', fontSize:'0.7rem', fontFamily:"'Montserrat', sans-serif", color:'#9D9D9D', cursor:'pointer' }}
            >
              Firma Degistir
            </button>
          )}
          <span style={{ fontSize:'0.75rem', color:'#0F0F0F', fontWeight:600 }}>{profile.full_name}</span>
          <button onClick={signOut} style={{ background:'transparent', border:'1px solid #DDDDDD', borderRadius:'0.25rem', padding:'4px 12px', fontSize:'0.7rem', fontFamily:"'Montserrat', sans-serif", color:'#9D9D9D', cursor:'pointer' }}>
            Cikis
          </button>
        </div>
      </div>

      {/* Firma switcher dropdown */}
      {canSwitchCompany && (
        <div id="company-switcher" style={{ display:'none', position:'fixed', top:'56px', right:'1rem', background:'#ffffff', border:'1px solid #DDDDDD', borderRadius:'0.625rem', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:200, minWidth:'200px', padding:'0.5rem' }}>
          {companies.map(cm => (
            <button
              key={cm.company.id}
              onClick={() => { selectCompany(cm.company); setSelectedRoom(null); setSelectedSlots([]); document.getElementById('company-switcher')!.style.display='none' }}
              style={{ display:'block', width:'100%', padding:'0.625rem 0.875rem', background: selectedCompany?.id === cm.company.id ? '#FCEEF2' : 'transparent', border:'none', borderRadius:'0.375rem', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif", fontWeight: selectedCompany?.id === cm.company.id ? 700 : 400, color: selectedCompany?.id === cm.company.id ? '#E45A80' : '#0F0F0F', cursor:'pointer', textAlign:'left' }}
            >
              {cm.company.name}
            </button>
          ))}
        </div>
      )}

      {/* Basarı mesajı */}
      {successMsg && (
        <div style={{ background:'#7B9D76', color:'#ffffff', padding:'0.75rem 1.5rem', fontSize:'0.8rem', fontWeight:600, textAlign:'center' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Tab Bar */}
      <div style={{ background:'#ffffff', borderBottom:'1px solid #DDDDDD', display:'flex', padding:'0 1.5rem' }}>
        {(['book','mine'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background:'transparent', border:'none',
              borderBottom: activeTab===tab ? '2.5px solid #E45A80' : '2.5px solid transparent',
              padding:'0.875rem 1rem', fontSize:'0.8rem',
              fontFamily:"'Montserrat', sans-serif",
              fontWeight: activeTab===tab ? 700 : 500,
              color: activeTab===tab ? '#E45A80' : '#9D9D9D',
              cursor:'pointer', marginBottom:'-1px', transition:'all 0.15s',
            }}
          >
            {tab === 'book' ? 'Rezervasyon Yap' : 'Rezervasyonlarim'}
          </button>
        ))}
      </div>

      {/* İçerik */}
      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'1.5rem' }}>

        {activeTab === 'book' && (
          <>
            {/* Oda Seçimi */}
            {rooms.length > 1 && (
              <div style={{ marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'0.7rem', fontWeight:700, color:'#9D9D9D', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'0.75rem' }}>
                  Oda Sec
                </h2>
                <RoomSelector rooms={rooms} selectedRoom={selectedRoom} onSelectRoom={r => { setSelectedRoom(r); setSelectedSlots([]) }} />
              </div>
            )}

            {selectedRoom && (
              <>
                <div style={{ marginBottom:'1.5rem' }}>
                  <h2 style={{ fontSize:'0.7rem', fontWeight:700, color:'#9D9D9D', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'0.75rem' }}>
                    Gun Sec
                  </h2>
                  <DayPicker selectedDate={selectedDate} onSelectDate={handleDayChange} />
                </div>

                <div>
                  <h2 style={{ fontSize:'0.7rem', fontWeight:700, color:'#9D9D9D', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'0.75rem' }}>
                    Saat Sec
                  </h2>
                  <SlotGrid slots={slots} selectedSlots={selectedSlots} onSlotClick={handleSlotClick} loading={loadingSlots} />
                </div>

                {selectedSlots.length > 0 && !showForm && (
                  <button className="btn-primary" style={{ marginTop:'1.5rem', width:'100%' }} onClick={() => setShowForm(true)}>
                    Rezervasyon Yap →
                  </button>
                )}
              </>
            )}

            {rooms.length === 0 && (
              <div style={{ padding:'3rem', textAlign:'center', background:'#fafafa', borderRadius:'0.75rem', border:'1px dashed #DDDDDD', color:'#9D9D9D', fontSize:'0.8rem' }}>
                Bu firmaya ait aktif toplanti odasi bulunamadi.
              </div>
            )}
          </>
        )}

        {activeTab === 'mine' && (
          <MyReservations profile={profile} rooms={rooms} onRefresh={fetchSlotData} />
        )}
      </div>

      {showForm && profile && selectedRoom && (
        <BookingForm
          selectedSlots={selectedSlots}
          selectedDate={selectedDate}
          profile={profile}
          room={selectedRoom}
          onSuccess={handleBookingSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
