import { useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { mergeSlots } from '../lib/slots'
import type { Slot } from '../lib/slots'
import type { Profile, Room } from '../types'

interface Props {
  selectedSlots: Slot[]
  selectedDate:  Date
  profile:       Profile
  room:          Room
  onSuccess:     () => void
  onCancel:      () => void
}

export default function BookingForm({ selectedSlots, selectedDate, profile, room, onSuccess, onCancel }: Props) {
  const [attendeeCount, setAttendeeCount] = useState(1)
  const [purpose,       setPurpose]       = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')

  const merged = mergeSlots(selectedSlots)
  if (!merged) return null

  const totalMinutes = selectedSlots.length * 30

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.from('reservations').insert({
      room_id:        room.id,
      user_id:        profile.id,
      full_name:      profile.full_name,
      email:          profile.email,
      start_time:     merged!.start.toISOString(),
      end_time:       merged!.end.toISOString(),
      attendee_count: attendeeCount,
      purpose:        purpose.trim() || null,
      status:         'active',
    })

    setLoading(false)
    if (error) {
      setError(error.code === '23P01'
        ? 'Bu saatlerde cakisan bir rezervasyon var. Lutfen farkli saat sec.'
        : 'Rezervasyon olusturulamadi. Tekrar dene.')
      return
    }
    onSuccess()
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.35)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:100, padding:'1rem', fontFamily:"'Montserrat', sans-serif",
    }}>
      <div style={{ background:'#ffffff', borderRadius:'0.75rem', width:'100%', maxWidth:'460px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'#E45A80', padding:'1.25rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'#ffffff', fontWeight:800, fontSize:'0.9rem' }}>Rezervasyon Onayi</div>
            <div style={{ color:'#FCEEF2', fontSize:'0.72rem', marginTop:'2px' }}>{room.name}</div>
          </div>
          <button onClick={onCancel} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'28px', height:'28px', color:'#ffffff', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* Ozet */}
        <div style={{ background:'#FCEEF2', padding:'1rem 1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          {[
            { l:'Tarih',        v: format(selectedDate, 'd MMMM yyyy', { locale: tr }) },
            { l:'Saat',         v: `${format(merged.start,'HH:mm')} - ${format(merged.end,'HH:mm')}` },
            { l:'Sure',         v: `${totalMinutes} dakika` },
            { l:'Rezerve Eden', v: profile.full_name },
          ].map(({ l, v }) => (
            <div key={l}>
              <div style={{ fontSize:'0.65rem', color:'#9D9D9D', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' }}>{l}</div>
              <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#0F0F0F', marginTop:'2px' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding:'1.5rem' }}>
          {/* Kisi sayisi */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'#0F0F0F', marginBottom:'0.5rem' }}>
              Katilimci Sayisi <span style={{ color:'#E45A80' }}>*</span>
            </label>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              {[
                { op: () => setAttendeeCount(v => Math.max(1, v-1)), label: '−' },
                { op: () => setAttendeeCount(v => Math.min(room.capacity, v+1)), label: '+' },
              ].map(({ op, label }, i) => i === 0 ? (
                <button key={label} type="button" onClick={op} style={{ width:'36px', height:'36px', borderRadius:'50%', border:'1.5px solid #DDDDDD', background:'#ffffff', fontSize:'1.1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#0F0F0F', fontFamily:"'Montserrat', sans-serif" }}>{label}</button>
              ) : (
                <span key="count" style={{ display:'contents' }}>
                  <span style={{ fontSize:'1.25rem', fontWeight:700, minWidth:'2rem', textAlign:'center', color:'#E45A80' }}>{attendeeCount}</span>
                  <button type="button" onClick={op} style={{ width:'36px', height:'36px', borderRadius:'50%', border:'1.5px solid #DDDDDD', background:'#ffffff', fontSize:'1.1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#0F0F0F', fontFamily:"'Montserrat', sans-serif" }}>{label}</button>
                  <span style={{ fontSize:'0.7rem', color:'#9D9D9D' }}>maks. {room.capacity}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Amac */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'#0F0F0F', marginBottom:'0.5rem' }}>
              Amac <span style={{ color:'#9D9D9D', fontWeight:400 }}>(opsiyonel)</span>
            </label>
            <textarea
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="Toplantı, workshop, prova..."
              maxLength={200} rows={3}
              style={{ width:'100%', padding:'0.75rem 1rem', border:'1.5px solid #DDDDDD', borderRadius:'0.25rem', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif", color:'#0F0F0F', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.6 }}
              onFocus={e => e.target.style.borderColor='#E45A80'}
              onBlur={e  => e.target.style.borderColor='#DDDDDD'}
            />
            <div style={{ textAlign:'right', fontSize:'0.65rem', color:'#9D9D9D', marginTop:'2px' }}>{purpose.length}/200</div>
          </div>

          {error && (
            <div style={{ background:'#fff5f5', border:'1px solid #D72B01', borderRadius:'0.25rem', padding:'0.625rem 0.875rem', fontSize:'0.75rem', color:'#D72B01', marginBottom:'1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex:1 }}>Vazgec</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex:2 }}>
              {loading ? 'Kaydediliyor...' : 'Rezervasyonu Onayla →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
