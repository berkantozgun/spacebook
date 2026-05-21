import { useState } from 'react'

interface BookingFormProps {
  onSubmit: (data: { attendeeCount: number; purpose: string }) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function BookingForm({
  onSubmit,
  onCancel,
  isLoading,
}: BookingFormProps) {
  const [attendeeCount, setAttendeeCount] = useState(1)
  const [purpose, setPurpose] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      await onSubmit({ attendeeCount, purpose })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
          Rezervasyon Yap
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
              }}
            >
              Katılımcı Sayısı
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setAttendeeCount(Math.max(1, attendeeCount - 1))}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border)',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                -
              </button>
              <input
                type="number"
                value={attendeeCount}
                onChange={(e) =>
                  setAttendeeCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                style={{
                  width: '60px',
                  textAlign: 'center',
                  border: '1.5px solid var(--color-border)',
                }}
              />
              <button
                type="button"
                onClick={() => setAttendeeCount(attendeeCount + 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border)',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
              }}
            >
              Toplantı Konusu (İsteğe Bağlı)
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Toplantı konusunu yazın..."
              style={{
                width: '100%',
                minHeight: '80px',
                resize: 'vertical',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#ffebee',
                color: 'var(--color-error)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : 'Rezervasyon Yap'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
