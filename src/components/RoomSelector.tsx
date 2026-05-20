import type { Room } from '../types'

interface Props {
  rooms:          Room[]
  selectedRoom:   Room | null
  onSelectRoom:   (room: Room) => void
}

export default function RoomSelector({ rooms, selectedRoom, onSelectRoom }: Props) {
  if (rooms.length === 0) return (
    <div style={{
      padding:'2rem', textAlign:'center',
      background:'#fafafa', borderRadius:'0.75rem', border:'1px dashed #DDDDDD',
      color:'#9D9D9D', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif",
    }}>
      Bu firmaya ait aktif toplanti odasi bulunamadi.
    </div>
  )

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '0.75rem',
    }}>
      {rooms.filter(r => r.is_active).map(room => {
        const isSelected = selectedRoom?.id === room.id
        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'flex-start',
              padding:        '1rem 1.125rem',
              background:     isSelected ? '#E45A80' : '#ffffff',
              border:         isSelected ? '2px solid #E45A80' : '1.5px solid #DDDDDD',
              borderRadius:   '0.75rem',
              cursor:         'pointer',
              fontFamily:     "'Montserrat', sans-serif",
              transition:     'all 0.15s',
              textAlign:      'left',
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget).style.borderColor = '#E45A80'
                ;(e.currentTarget).style.background = '#FCEEF2'
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget).style.borderColor = '#DDDDDD'
                ;(e.currentTarget).style.background = '#ffffff'
              }
            }}
          >
            {/* Oda adı */}
            <div style={{
              fontSize:   '0.875rem',
              fontWeight: 700,
              color:      isSelected ? '#ffffff' : '#0F0F0F',
              marginBottom: '4px',
            }}>
              {room.name}
            </div>

            {/* Konum */}
            {room.location && (
              <div style={{
                fontSize: '0.7rem',
                color:    isSelected ? 'rgba(255,255,255,0.8)' : '#9D9D9D',
                marginBottom: '8px',
              }}>
                {room.location}
              </div>
            )}

            {/* Kapasite + Saat */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                background:   isSelected ? 'rgba(255,255,255,0.2)' : '#FCEEF2',
                color:        isSelected ? '#ffffff' : '#E45A80',
                fontSize:     '0.65rem',
                fontWeight:   700,
                padding:      '2px 8px',
                borderRadius: '999px',
              }}>
                Maks. {room.capacity} kisi
              </span>
              <span style={{
                background:   isSelected ? 'rgba(255,255,255,0.2)' : '#f5f5f5',
                color:        isSelected ? '#ffffff' : '#9D9D9D',
                fontSize:     '0.65rem',
                fontWeight:   600,
                padding:      '2px 8px',
                borderRadius: '999px',
              }}>
                {String(room.work_start_hour).padStart(2,'0')}:00 - {String(room.work_end_hour).padStart(2,'0')}:00
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
