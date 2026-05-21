import { useEffect, useRef } from 'react'
import { formatDate } from '../lib/slots'

interface DayPickerProps {
  days: Date[]
  selected: Date | null
  onSelect: (day: Date) => void
}

export function DayPicker({ days, selected, onSelect }: DayPickerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedRef.current && scrollContainerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [selected])

  return (
    <div
      ref={scrollContainerRef}
      style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '1.5rem',
      }}
    >
      {days.map((day) => {
        const isSelected =
          selected &&
          day.toDateString() === selected.toDateString()
        const isToday = new Date().toDateString() === day.toDateString()

        return (
          <button
            key={day.toISOString()}
            ref={isSelected ? selectedRef : null}
            onClick={() => onSelect(day)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: isSelected ? 'none' : '1.5px solid var(--color-border)',
              backgroundColor: isSelected ? 'var(--color-primary)' : 'white',
              color: isSelected ? 'white' : 'var(--color-black)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            <div>{formatDate(day)}</div>
            {isToday && (
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Today
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
