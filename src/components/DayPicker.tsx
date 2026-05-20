import { startOfDay, isSameDay, isToday } from 'date-fns'
import { getUpcomingDays, formatShortDate } from '../lib/slots'

interface Props {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  daysToShow?:  number
}

export default function DayPicker({ selectedDate, onSelectDate, daysToShow = 14 }: Props) {
  const days = getUpcomingDays(daysToShow)

  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '0.5rem' }}>
      <div style={{
        display: 'flex', gap: '0.5rem',
        minWidth: 'max-content',
        padding: '0.75rem 0.125rem 0.25rem 0.125rem',
      }}>
        {days.map(day => {
          const isSelected = isSameDay(day, selectedDate)
          const today      = isToday(day)
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(startOfDay(day))}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                minWidth: '64px', height: '64px', borderRadius: '0.5rem',
                border:      isSelected ? '2px solid #E45A80' : '1.5px solid #DDDDDD',
                background:  isSelected ? '#E45A80' : '#ffffff',
                color:       isSelected ? '#ffffff' : '#0F0F0F',
                cursor: 'pointer', transition: 'all 0.15s ease',
                fontFamily: "'Montserrat', sans-serif",
                padding: '0', position: 'relative',
              }}
            >
              {today && !isSelected && (
                <span style={{
                  position: 'absolute', top: '-8px',
                  background: '#E45A80', color: '#ffffff',
                  fontSize: '0.55rem', fontWeight: 700,
                  padding: '1px 6px', borderRadius: '999px', letterSpacing: '0.5px',
                }}>BUGÜN</span>
              )}
              {today && isSelected && (
                <span style={{
                  position: 'absolute', top: '-8px',
                  background: '#ffffff', color: '#E45A80',
                  fontSize: '0.55rem', fontWeight: 700,
                  padding: '1px 6px', borderRadius: '999px', letterSpacing: '0.5px',
                }}>BUGÜN</span>
              )}
              <span style={{ fontSize: '1.1rem', fontWeight: isSelected ? 700 : 600, lineHeight: 1 }}>
                {day.getDate()}
              </span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 500, marginTop: '2px',
                opacity: isSelected ? 0.9 : 0.6,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {formatShortDate(day).split(' ')[1]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
