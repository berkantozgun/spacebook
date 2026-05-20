import type { Slot } from '../lib/slots'

interface Props {
  slots:         Slot[]
  selectedSlots: Slot[]
  onSlotClick:   (slot: Slot) => void
  loading?:      boolean
}

export default function SlotGrid({ slots, selectedSlots, onSlotClick, loading = false }: Props) {
  if (loading) return (
    <div style={{ padding:'3rem', textAlign:'center', color:'#9D9D9D', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif" }}>
      Slotlar yukleniyor...
    </div>
  )
  if (slots.length === 0) return (
    <div style={{ padding:'3rem', textAlign:'center', color:'#9D9D9D', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif" }}>
      Bu gun icin slot bulunamadi.
    </div>
  )

  const isSelected = (slot: Slot) => selectedSlots.some(s => s.start.getTime() === slot.start.getTime())
  const clickable  = (slot: Slot) => slot.status === 'available' || isSelected(slot)

  function getSlotStyle(slot: Slot): React.CSSProperties {
    const base: React.CSSProperties = {
      display:'flex', flexDirection:'column', alignItems:'flex-start', justifyContent:'center',
      padding:'0.6rem 0.75rem', borderRadius:'0.375rem', fontSize:'0.75rem',
      fontFamily:"'Montserrat', sans-serif", fontWeight:600, cursor:'pointer',
      transition:'all 0.15s ease', border:'1.5px solid', minHeight:'56px', width:'100%', textAlign:'left',
    }
    if (isSelected(slot))     return { ...base, background:'#E45A80', borderColor:'#E45A80', color:'#ffffff' }
    switch (slot.status) {
      case 'available': return { ...base, background:'#ffffff', borderColor:'#DDDDDD', color:'#0F0F0F' }
      case 'booked':    return { ...base, background:'#FCEEF2', borderColor:'#E45A80', color:'#E45A80', cursor:'not-allowed', opacity:0.8 }
      case 'blocked':   return { ...base, background:'#f5f5f5', borderColor:'#DDDDDD', color:'#9D9D9D', cursor:'not-allowed' }
      case 'past':      return { ...base, background:'#fafafa', borderColor:'#EEEEEE', color:'#CCCCCC', cursor:'not-allowed' }
      default:          return base
    }
  }

  function getStatusLabel(slot: Slot): string | null {
    if (slot.status === 'booked')  return slot.bookedBy ?? 'Dolu'
    if (slot.status === 'blocked') return 'Bloklu'
    if (slot.status === 'past')    return 'Gecti'
    return null
  }

  return (
    <div>
      {/* Lejant */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        {[
          { color:'#ffffff', border:'#DDDDDD', text:'Musait'  },
          { color:'#E45A80', border:'#E45A80', text:'Secili'  },
          { color:'#FCEEF2', border:'#E45A80', text:'Dolu'    },
          { color:'#f5f5f5', border:'#DDDDDD', text:'Bloklu'  },
        ].map(item => (
          <div key={item.text} style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.7rem', color:'#9D9D9D', fontFamily:"'Montserrat', sans-serif" }}>
            <div style={{ width:'12px', height:'12px', borderRadius:'3px', background:item.color, border:`1.5px solid ${item.border}`, flexShrink:0 }} />
            {item.text}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'0.5rem' }}>
        {slots.map(slot => (
          <button
            key={slot.start.toISOString()}
            onClick={() => clickable(slot) && onSlotClick(slot)}
            style={getSlotStyle(slot)}
            disabled={!clickable(slot)}
            title={slot.bookedBy ? `Rezervasyon: ${slot.bookedBy}` : undefined}
          >
            <span style={{ fontSize:'0.8rem', fontWeight:700 }}>{slot.label}</span>
            {getStatusLabel(slot) && (
              <span style={{ fontSize:'0.65rem', fontWeight:500, marginTop:'2px', opacity:0.8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>
                {getStatusLabel(slot)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Secim ozeti */}
      {selectedSlots.length > 0 && (
        <div style={{
          marginTop:'1rem', padding:'0.75rem 1rem',
          background:'#FCEEF2', borderRadius:'0.5rem', border:'1px solid #E45A80',
          fontSize:'0.78rem', color:'#E45A80', fontWeight:600, fontFamily:"'Montserrat', sans-serif",
        }}>
          {selectedSlots.length === 1
            ? `Secili: ${selectedSlots[0].label}`
            : `Secili: ${selectedSlots[0].label.split('-')[0].trim()} - ${selectedSlots[selectedSlots.length-1].label.split('-')[1].trim()} (${selectedSlots.length * 30} dk)`
          }
        </div>
      )}
    </div>
  )
}
