import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { APP_CONFIG } from '../config/app'
import { supabase } from '../lib/supabase'

type Step = 'form' | 'sent'

export default function LoginPage() {
  const { signInWithMagicLink } = useAuth()
  const [email,   setEmail]   = useState('')
  const [step,    setStep]    = useState<Step>('form')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) { setError('Gecerli bir e-posta adresi girin.'); return }

    setLoading(true)

    // Domain kayitli mi kontrol et (superadmin icin bypass)
    const { data: domainCheck } = await supabase
      .from('allowed_domains')
      .select('id')
      .eq('domain', domain)
      .limit(1)

    // Domain bulunamadiysa uyar — ama magic link gondermekten ayni mesaji goster
    // (Guvenlik: kim hangi domainin kayitli oldugunu bilmesin)
    if (!domainCheck || domainCheck.length === 0) {
      // Yine de deneyebilirler — superadmin baska domainle girebilir
      // Sessizce devam et, callback sayfasi unauthorized'a yonlendirir
    }

    const { error } = await signInWithMagicLink(email)
    setLoading(false)

    if (error) { setError('Bir hata olustu. Lutfen tekrar dene.'); return }
    setStep('sent')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FCEEF2 0%, #ffffff 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            background: '#E45A80', padding: '14px 32px', borderRadius: '4px',
            marginBottom: '0.75rem',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '3px' }}>
              {APP_CONFIG.appName.toUpperCase()}
            </span>
            <span style={{ color: '#FCEEF2', fontWeight: 400, fontSize: '0.65rem', letterSpacing: '4px', marginTop: '2px' }}>
              {APP_CONFIG.appTagline.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Kart */}
        <div style={{
          background: '#ffffff', border: '1px solid #DDDDDD',
          borderRadius: '0.75rem', padding: '2rem',
          boxShadow: '0 4px 24px rgba(228,90,128,0.08)',
        }}>
          {step === 'form' ? (
            <>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F0F0F', marginBottom: '0.5rem' }}>
                Giris Yap
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#9D9D9D', marginBottom: '1.75rem', lineHeight: 1.6 }}>
                Kurumsal e-posta adresinle giris yap.
                Sana bir baglanti gondereceğiz.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block', fontSize: '0.75rem', fontWeight: 600,
                    color: '#0F0F0F', marginBottom: '0.5rem',
                  }}>
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ad.soyad@sirketadi.com"
                    required
                    style={{
                      width: '100%', height: '2.875rem', padding: '0 1rem',
                      border: error ? '1.5px solid #D72B01' : '1.5px solid #DDDDDD',
                      borderRadius: '0.25rem', fontSize: '0.875rem',
                      fontFamily: "'Montserrat', sans-serif", color: '#0F0F0F',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => { if (!error) e.target.style.borderColor = '#E45A80' }}
                    onBlur={e  => { if (!error) e.target.style.borderColor = '#DDDDDD' }}
                  />
                  {error && (
                    <p style={{ color: '#D72B01', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                      {error}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  {loading ? 'Gonderiliyor...' : 'Giris Baglantisi Gonder'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '56px', height: '56px', background: '#FCEEF2',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem',
              }}>
                ✉️
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F0F0F', marginBottom: '0.75rem' }}>
                Baglanti Gonderildi
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#9D9D9D', lineHeight: 1.7 }}>
                <strong style={{ color: '#E45A80' }}>{email}</strong> adresine
                giris baglantisi gonderdik. E-postani kontrol et.
              </p>
              <button
                onClick={() => { setStep('form'); setEmail(''); setError('') }}
                className="btn-secondary"
                style={{ marginTop: '1.5rem', width: '100%' }}
              >
                Farkli e-posta dene
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#9D9D9D', marginTop: '1.5rem' }}>
          {APP_CONFIG.appName} · {APP_CONFIG.appTagline}
        </p>
      </div>
    </div>
  )
}
