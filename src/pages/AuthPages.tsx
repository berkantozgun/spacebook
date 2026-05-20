// =============================================
// SPACEBOOK — CallbackPage
// =============================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_CONFIG } from '../config/app'

export function CallbackPage() {
  const navigate  = useNavigate()
  const [message, setMessage] = useState('Giris dogrulanıyor...')

  useEffect(() => {
    async function handle() {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setMessage('Giris basarisiz. Lutfen tekrar dene.')
        setTimeout(() => navigate('/login'), 2500)
        return
      }

      if (session) {
        await redirect(session.user.id)
        return
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
            subscription.unsubscribe()
            await redirect(session.user.id)
          }
        }
      )

      setTimeout(() => {
        subscription.unsubscribe()
        setMessage('Zaman asimina ugradi. Tekrar giris yap.')
        setTimeout(() => navigate('/login'), 2000)
      }, 10000)
    }

    async function redirect(userId: string) {
      // Profili kontrol et
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_superadmin')
        .eq('id', userId)
        .single()

      if (!profile) {
        // Profil olusturulmadiysa — domain kayitli degil
        setMessage('Erisim yetkiniz yok.')
        setTimeout(() => navigate('/unauthorized'), 2000)
        return
      }

      if (profile.is_superadmin) {
        navigate('/superadmin')
        return
      }

      // Firma sayisini kontrol et
      const { data: memberships } = await supabase
        .from('company_members')
        .select('id')
        .eq('user_id', userId)

      if (!memberships || memberships.length === 0) {
        navigate('/unauthorized')
        return
      }

      if (memberships.length === 1) {
        navigate('/')
      } else {
        navigate('/select-company')
      }
    }

    handle()
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FCEEF2 0%, #ffffff 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '3px solid #FCEEF2', borderTop: '3px solid #E45A80',
          borderRadius: '50%', margin: '0 auto 1.5rem',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
          background: '#E45A80', padding: '8px 20px', borderRadius: '4px', marginBottom: '1rem',
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '2px' }}>
            {APP_CONFIG.appName.toUpperCase()}
          </span>
        </div>
        <p style={{ color: '#9D9D9D', fontSize: '0.8rem' }}>{message}</p>
      </div>
    </div>
  )
}

// =============================================
// SPACEBOOK — CompanySelectPage
// =============================================
import { useAuth } from '../contexts/AuthContext'
import { useNavigate as useNavigate2 } from 'react-router-dom'

export function CompanySelectPage() {
  const { companies, selectCompany, signOut } = useAuth()
  const navigate = useNavigate2()

  function handleSelect(idx: number) {
    selectCompany(companies[idx].company)
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FCEEF2 0%, #ffffff 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            background: '#E45A80', padding: '10px 24px', borderRadius: '4px', marginBottom: '1rem',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '3px' }}>
              {APP_CONFIG.appName.toUpperCase()}
            </span>
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F0F0F', marginBottom: '0.4rem' }}>
            Firma Sec
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#9D9D9D' }}>
            Birden fazla firmaya uyesiniz. Devam etmek icin firma secin.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {companies.map((cm, i) => (
            <button
              key={cm.company.id}
              onClick={() => handleSelect(i)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 1.25rem',
                background: '#ffffff', border: '1.5px solid #DDDDDD',
                borderRadius: '0.75rem', cursor: 'pointer',
                fontFamily: "'Montserrat', sans-serif",
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E45A80'
                ;(e.currentTarget as HTMLButtonElement).style.background = '#FCEEF2'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#DDDDDD'
                ;(e.currentTarget as HTMLButtonElement).style.background = '#ffffff'
              }}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F0F0F' }}>
                  {cm.company.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9D9D9D', marginTop: '2px' }}>
                  {cm.role === 'admin' ? 'Yonetici' : cm.role === 'display' ? 'Display' : 'Uye'}
                </div>
              </div>
              <span style={{ color: '#E45A80', fontSize: '1.1rem' }}>→</span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={signOut}
            style={{
              background: 'transparent', border: 'none',
              fontSize: '0.75rem', color: '#9D9D9D', cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Cikis Yap
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// SPACEBOOK — UnauthorizedPage
// =============================================
export function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
        <div style={{
          width: '64px', height: '64px', background: '#fff5f5',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.75rem',
        }}>
          🔒
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F0F0F', marginBottom: '0.75rem' }}>
          Erisim Yetkiniz Yok
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#9D9D9D', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Bu sisteme erisim icin kurum tarafindan yetkilendirilmis
          olmalisiniz. Lutfen sistem yoneticinizle iletisime gecin.
        </p>
        <a
          href="/login"
          style={{
            display: 'inline-block',
            background: '#E45A80', color: '#ffffff',
            padding: '0.75rem 1.5rem', borderRadius: '0.25rem',
            fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none',
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Giris Sayfasina Don
        </a>
      </div>
    </div>
  )
}
