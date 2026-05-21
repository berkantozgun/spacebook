import type { Room } from '../types'

interface RoomSelectorProps {
  rooms: Room[]
  selected: Room | null
  onSelect: (room: Room) => void
}

export function RoomSelector({
  rooms,
  selected,
  onSelect,
}: RoomSelectorProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {rooms.map((room) => {
        const isSelected = selected?.id === room.id
        return (
          <button
            key={room.id}
            onClick={() => onSelect(room)}
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: isSelected
                ? '2px solid var(--color-primary)'
                : '1.5px solid var(--color-border)',
              backgroundColor: isSelected ? 'var(--color-primary-light)' : 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <h3
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.125rem',
                fontWeight: 700,
              }}
            >
              {room.name}
            </h3>
            <p
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.875rem',
                color: 'var(--color-grey)',
              }}
            >
              {room.location}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--color-grey)',
              }}
            >
              Capacity: {room.capacity}
            </p>
          </button>
        )
      })}
    </div>
  )
}
