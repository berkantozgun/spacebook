import type { Reservation } from '../types'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

interface MyReservationsProps {
  reservations: Reservation[]
  onUpdate: () => void
}

export function MyReservations({
  reservations,
  onUpdate,
}: MyReservationsProps) {
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    try {
      setCancelingId(id)
      const { error: err } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
      if (err) throw err
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setCancelingId(null)
    }
  }

  if (reservations.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-grey)' }}>
        Aktif rezervasyonunuz yok
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#ffebee',
            color: 'var(--color-error)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            style={{
              padding: '1rem',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                  {new Date(reservation.start_time).toLocaleString()}
                </h4>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: '0.875rem',
                    color: 'var(--color-grey)',
                  }}
                >
                  {reservation.attendee_count} kişi
                </p>
              </div>
              <button
                onClick={() => handleCancel(reservation.id)}
                disabled={cancelingId === reservation.id}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--color-error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: cancelingId === reservation.id ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  opacity: cancelingId === reservation.id ? 0.6 : 1,
                }}
              >
                {cancelingId === reservation.id ? 'İptal ediliyor...' : 'İptal Et'}
              </button>
            </div>
            {reservation.purpose && (
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.875rem',
                  fontStyle: 'italic',
                }}
              >
                Konu: {reservation.purpose}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
