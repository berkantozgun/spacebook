import type { Slot } from '../types'

interface SlotGridProps {
  slots: Slot[]
  selected: string[]
  onSelect: (slotStart: string) => void
}

export function SlotGrid({ slots, selected, onSelect }: SlotGridProps) {
  const getSlotStyle = (slot: Slot) => {
    let bgColor = 'white'
    let textColor = 'var(--color-black)'
    let borderColor = 'var(--color-border)'
    let cursor = 'pointer'
    let opacity = 1

    if (slot.status === 'available') {
      bgColor = 'white'
      borderColor = 'var(--color-border)'
    } else if (slot.status === 'booked') {
      bgColor = 'var(--color-primary-light)'
      borderColor = 'var(--color-primary)'
      cursor = 'not-allowed'
      opacity = 0.6
    } else if (slot.status === 'blocked') {
      bgColor = '#f5f5f5'
      borderColor = 'var(--color-grey)'
      cursor = 'not-allowed'
      opacity = 0.5
    } else if (slot.status === 'past') {
      bgColor = '#f5f5f5'
      borderColor = 'var(--color-grey)'
      cursor = 'not-allowed'
      opacity = 0.4
    }

    const isSelected = selected.includes(slot.start.toISOString())
    if (isSelected) {
      bgColor = 'var(--color-primary)'
      textColor = 'white'
      borderColor = 'var(--color-primary)'
    }

    return {
      backgroundColor: bgColor,
      color: textColor,
      borderColor: borderColor,
      cursor: cursor,
      opacity: opacity,
    }
  }

  const isClickable = (slot: Slot) =>
    slot.status === 'available' || slot.status === 'past'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '0.5rem',
        marginBottom: '1.5rem',
      }}
    >
      {slots.map((slot) => (
        <button
          key={slot.start.toISOString()}
          onClick={() => {
            if (isClickable(slot)) {
              onSelect(slot.start.toISOString())
            }
          }}
          disabled={!isClickable(slot)}
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid',
            borderColor: getSlotStyle(slot).borderColor,
            backgroundColor: getSlotStyle(slot).backgroundColor,
            color: getSlotStyle(slot).color,
            cursor: getSlotStyle(slot).cursor,
            opacity: getSlotStyle(slot).opacity,
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
          }}
        >
          <div>{slot.label}</div>
          {slot.bookedBy && (
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {slot.bookedBy}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
