import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Company } from '../types'
import { APP_CONFIG } from '../config/app'

export default function SuperAdminPage() {
  const { profile, signOut } = useAuth()
  const [companies,   setCompanies]   = useState<Company[]>([])
  const [loading,     setLoading]     = useState(true)
  const [successMsg,  setSuccessMsg]  = useState('')
  const [newName,     setNewName]     = useState('')
  const [newSlug,     setNewSlug]     = useState('')
  const [newDomain,   setNewDomain]   = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  function ok(msg: string) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500) }

  async function fetchCompanies() {
    setLoading(true)
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
    if (data) setCompanies(data as Company[])
    setLoading(false)
  }

  useEffect(() => { fetchCompanies() }, [])

  async function handleAddCompany(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    // Firma ekle
    const { data: company, error } = await supabase
      .from('companies')
      .insert({ name: newName.trim(), slug: newSlug.trim().toLowerCase() })
      .select().single()

    if (error || !company) {
      setSubmitting(false)
      ok('Hata: ' + (error?.message ?? 'Bilinmeyen hata'))
      return
    }

    // Domain varsa ekle
    if (newDomain.trim()) {
      await supabase.from('allowed_domains').insert({
        company_id: company.id,
        domain: newDomain.trim().toLowerCase(),
      })
    }

    setNewName(''); setNewSlug(''); setNewDomain('')
    setSubmitting(false)
    ok('Firma basariyla olusturuldu.')
    fetchCompanies()
  }

  async function toggleCompany(id: string, is_active: boolean) {
    await supabase.from('companies').update({ is_active }).eq('id', id)
    ok(is_active ? 'Firma aktif edildi.' : 'Firma devre disi birakildi.')
    fetchCompanies()
  }

  if (!profile) return null

  return (
    <div style={{ minHeight:'100vh', background:'#fafafa', fontFamily:"'Montserrat', sans-serif" }}>

      {/* Header */}
      <div style={{ background:'#0F0F0F', padding:'0 1.5rem', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ background:'#E45A80', padding:'4px 12px', borderRadius:'3px' }}>
            <span style={{ color:'#fff', fontWeight:800, fontSize:'0.75rem', letterSpacing:'2px' }}>{APP_CONFIG.appName.toUpperCase()}</span>
          </div>
          <span style={{ background:'#E45A80', color:'#ffffff', fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:'3px', letterSpacing:'1px' }}>SUPERADMIN</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.6)', fontWeight:500 }}>{profile.full_name}</span>
          <button onClick={signOut} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'0.25rem', padding:'4px 12px', fontSize:'0.7rem', fontFamily:"'Montserrat', sans-serif", color:'rgba(255,255,255,0.6)', cursor:'pointer' }}>
            Cikis
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background:'#7B9D76', color:'#ffffff', padding:'0.625rem 1.5rem', fontSize:'0.8rem', fontWeight:600, textAlign:'center' }}>
          ✓ {successMsg}
        </div>
      )}

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'1.5rem' }}>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:'1.5rem' }}>

          {/* Yeni Firma Formu */}
          <div>
            <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F0F0F', marginBottom:'1.25rem' }}>Yeni Firma Olustur</h3>
            <div style={{ background:'#ffffff', border:'1px solid #DDDDDD', borderRadius:'0.75rem', padding:'1.25rem' }}>
              <form onSubmit={handleAddCompany} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#0F0F0F', marginBottom:'0.35rem' }}>Firma Adi *</label>
                  <input
                    type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Ornek Firma A.S." required
                    style={{ width:'100%', height:'2.5rem', padding:'0 0.75rem', border:'1.5px solid #DDDDDD', borderRadius:'0.25rem', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif", outline:'none', boxSizing:'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#0F0F0F', marginBottom:'0.35rem' }}>Slug * (benzersiz, URL'de kullanilir)</label>
                  <input
                    type="text" value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
                    placeholder="ornek-firma" required
                    style={{ width:'100%', height:'2.5rem', padding:'0 0.75rem', border:'1.5px solid #DDDDDD', borderRadius:'0.25rem', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif", outline:'none', boxSizing:'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#0F0F0F', marginBottom:'0.35rem' }}>Ilk Domain (opsiyonel)</label>
                  <input
                    type="text" value={newDomain} onChange={e => setNewDomain(e.target.value)}
                    placeholder="ornekfirma.com"
                    style={{ width:'100%', height:'2.5rem', padding:'0 0.75rem', border:'1.5px solid #DDDDDD', borderRadius:'0.25rem', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif", outline:'none', boxSizing:'border-box' }}
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Olusturuluyor...' : 'Firma Olustur'}
                </button>
              </form>
            </div>
          </div>

          {/* Firma Listesi */}
          <div>
            <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F0F0F', marginBottom:'1.25rem' }}>
              Firmalar ({companies.length})
            </h3>
            {loading ? (
              <div style={{ textAlign:'center', color:'#9D9D9D', fontSize:'0.8rem', padding:'2rem' }}>Yukleniyor...</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                {companies.map(c => (
                  <div key={c.id} style={{ background:'#ffffff', border:'1px solid #DDDDDD', borderRadius:'0.625rem', padding:'1rem 1.125rem', opacity: c.is_active ? 1 : 0.55 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontSize:'0.875rem', fontWeight:700, color:'#0F0F0F' }}>{c.name}</div>
                        <div style={{ fontSize:'0.7rem', color:'#9D9D9D', marginTop:'2px' }}>/{c.slug}</div>
                        <div style={{ fontSize:'0.65rem', color:'#9D9D9D', marginTop:'2px' }}>
                          {new Date(c.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.375rem' }}>
                        <span style={{ background: c.is_active ? '#FCEEF2' : '#f0f0f0', color: c.is_active ? '#E45A80' : '#9D9D9D', fontSize:'0.62rem', fontWeight:700, padding:'2px 8px', borderRadius:'999px' }}>
                          {c.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                        <button
                          onClick={() => toggleCompany(c.id, !c.is_active)}
                          style={{ background:'transparent', border:'1px solid #DDDDDD', borderRadius:'0.25rem', padding:'3px 8px', fontSize:'0.67rem', fontFamily:"'Montserrat', sans-serif", color: c.is_active ? '#D72B01' : '#7B9D76', cursor:'pointer' }}
                        >
                          {c.is_active ? 'Deaktif Et' : 'Aktif Et'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
