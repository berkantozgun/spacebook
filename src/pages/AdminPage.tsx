import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import { useAdminData } from '../hooks/useAdminData'
import { APP_CONFIG } from '../config/app'
import type { Room } from '../types'

type Tab = 'rooms' | 'members' | 'domains' | 'reservations' | 'blocked'

export default function AdminPage() {
  const { profile, selectedCompany, signOut } = useAuth()
  const companyId = selectedCompany?.id ?? ''
  const {
    rooms, domains, members, reservations, blockedSlots,
    fetchAll, addRoom, updateRoom, toggleRoom,
    addDomain, removeDomain,
    updateMemberRole, removeMember,
    cancelReservation, addBlockedSlot, removeBlockedSlot,
    exportCSV,
  } = useAdminData(companyId)

  const [tab,         setTab]         = useState<Tab>('rooms')
  const [successMsg,  setSuccessMsg]  = useState('')
  const [filterText,  setFilterText]  = useState('')

  // Oda formu
  const [roomForm,    setRoomForm]    = useState({ name:'', location:'', capacity:12, work_start_hour:8, work_end_hour:19 })
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  // Domain formu
  const [newDomain,   setNewDomain]   = useState('')

  // Bloklu slot formu
  const [blkRoom,     setBlkRoom]     = useState('')
  const [blkDate,     setBlkDate]     = useState('')
  const [blkStart,    setBlkStart]    = useState('09:00')
  const [blkEnd,      setBlkEnd]      = useState('18:00')
  const [blkReason,   setBlkReason]   = useState('')

  useEffect(() => { if (companyId) fetchAll() }, [companyId])

  function ok(msg: string) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500) }

  async function handleRoomSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingRoom) {
      const success = await updateRoom(editingRoom.id, roomForm)
      if (success) { ok('Oda guncellendi.'); setEditingRoom(null); setRoomForm({ name:'', location:'', capacity:12, work_start_hour:8, work_end_hour:19 }) }
    } else {
      const success = await addRoom(roomForm)
      if (success) { ok('Oda eklendi.'); setRoomForm({ name:'', location:'', capacity:12, work_start_hour:8, work_end_hour:19 }) }
    }
  }

  async function handleBlkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!blkRoom || !blkDate || !profile) return
    const start = new Date(`${blkDate}T${blkStart}:00`)
    const end   = new Date(`${blkDate}T${blkEnd}:00`)
    const success = await addBlockedSlot(blkRoom, start, end, blkReason, profile.id)
    if (success) { ok('Blok eklendi.'); setBlkDate(''); setBlkReason('') }
  }

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#0F0F0F', marginBottom:'0.35rem' }}>
      {children}
    </label>
  )

  const Input = ({ value, onChange, placeholder, type = 'text', min, max }: any) => (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} max={max}
      style={{ width:'100%', height:'2.5rem', padding:'0 0.75rem', border:'1.5px solid #DDDDDD', borderRadius:'0.25rem', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif", color:'#0F0F0F', outline:'none', boxSizing:'border-box' }}
    />
  )

  if (!profile || !selectedCompany) return null

  const activeRes    = reservations.filter(r => r.status === 'active').length
  const cancelledRes = reservations.filter(r => r.status === 'cancelled').length

  const TABS: { key: Tab; label: string }[] = [
    { key:'rooms',        label:'Odalar'        },
    { key:'members',      label:'Uyeler'        },
    { key:'domains',      label:'Domainler'     },
    { key:'reservations', label:'Rezervasyonlar'},
    { key:'blocked',      label:'Bloklu Slotlar'},
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#fafafa', fontFamily:"'Montserrat', sans-serif" }}>

      {/* Header */}
      <div style={{ background:'#ffffff', borderBottom:'1px solid #DDDDDD', padding:'0 1.5rem', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ background:'#E45A80', padding:'4px 12px', borderRadius:'3px', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <span style={{ color:'#fff', fontWeight:800, fontSize:'0.75rem', letterSpacing:'2px' }}>{APP_CONFIG.appName.toUpperCase()}</span>
          </div>
          <span style={{ background:'#0F0F0F', color:'#ffffff', fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:'3px', letterSpacing:'1px' }}>ADMIN</span>
          <span style={{ fontSize:'0.75rem', color:'#9D9D9D' }}>{selectedCompany.name}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <a href="/" style={{ fontSize:'0.72rem', color:'#9D9D9D', textDecoration:'none' }}>← Ana Sayfa</a>
          <button onClick={signOut} style={{ background:'transparent', border:'1px solid #DDDDDD', borderRadius:'0.25rem', padding:'4px 12px', fontSize:'0.7rem', fontFamily:"'Montserrat', sans-serif", color:'#9D9D9D', cursor:'pointer' }}>Cikis</button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background:'#7B9D76', color:'#ffffff', padding:'0.625rem 1.5rem', fontSize:'0.8rem', fontWeight:600, textAlign:'center' }}>
          ✓ {successMsg}
        </div>
      )}

      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'1.5rem' }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.875rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Odalar',     value: rooms.length,   color:'#E45A80' },
            { label:'Uyeler',     value: members.length, color:'#0F0F0F' },
            { label:'Aktif Rez.', value: activeRes,      color:'#7B9D76' },
            { label:'Iptal',      value: cancelledRes,   color:'#D72B01' },
          ].map(s => (
            <div key={s.label} style={{ background:'#ffffff', border:'1px solid #DDDDDD', borderRadius:'0.625rem', padding:'1rem' }}>
              <div style={{ fontSize:'0.65rem', color:'#9D9D9D', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>{s.label}</div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ background:'#ffffff', borderRadius:'0.75rem 0.75rem 0 0', border:'1px solid #DDDDDD', borderBottom:'none', display:'flex', padding:'0 1rem' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background:'transparent', border:'none',
              borderBottom: tab===t.key ? '2.5px solid #E45A80' : '2.5px solid transparent',
              padding:'0.875rem 0.875rem', fontSize:'0.75rem',
              fontFamily:"'Montserrat', sans-serif",
              fontWeight: tab===t.key ? 700 : 500,
              color: tab===t.key ? '#E45A80' : '#9D9D9D',
              cursor:'pointer', marginBottom:'-1px',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ background:'#ffffff', border:'1px solid #DDDDDD', borderRadius:'0 0 0.75rem 0.75rem', padding:'1.25rem' }}>

          {/* ODALAR */}
          {tab === 'rooms' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
              {/* Form */}
              <div>
                <h4 style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:'1rem' }}>
                  {editingRoom ? 'Oda Duzenle' : 'Yeni Oda Ekle'}
                </h4>
                <form onSubmit={handleRoomSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  <div><Label>Oda Adi *</Label><Input value={roomForm.name} onChange={(e:any) => setRoomForm(p => ({...p, name:e.target.value}))} placeholder="Toplantı Odası 1" /></div>
                  <div><Label>Konum</Label><Input value={roomForm.location} onChange={(e:any) => setRoomForm(p => ({...p, location:e.target.value}))} placeholder="Kat 3, Bina A" /></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem' }}>
                    <div><Label>Kapasite</Label><Input type="number" value={roomForm.capacity} onChange={(e:any) => setRoomForm(p => ({...p, capacity:+e.target.value}))} min={1} max={500} /></div>
                    <div><Label>Acilis</Label><Input type="number" value={roomForm.work_start_hour} onChange={(e:any) => setRoomForm(p => ({...p, work_start_hour:+e.target.value}))} min={0} max={23} /></div>
                    <div><Label>Kapanis</Label><Input type="number" value={roomForm.work_end_hour} onChange={(e:any) => setRoomForm(p => ({...p, work_end_hour:+e.target.value}))} min={1} max={24} /></div>
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex:1 }}>{editingRoom ? 'Guncelle' : 'Ekle'}</button>
                    {editingRoom && <button type="button" className="btn-secondary" onClick={() => { setEditingRoom(null); setRoomForm({ name:'', location:'', capacity:12, work_start_hour:8, work_end_hour:19 }) }}>Iptal</button>}
                  </div>
                </form>
              </div>
              {/* Liste */}
              <div>
                <h4 style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:'1rem' }}>Mevcut Odalar ({rooms.length})</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {rooms.map(r => (
                    <div key={r.id} style={{ padding:'0.75rem 1rem', background: r.is_active ? '#ffffff' : '#fafafa', border:'1px solid #DDDDDD', borderRadius:'0.5rem', opacity: r.is_active ? 1 : 0.6 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#0F0F0F' }}>{r.name}</div>
                          <div style={{ fontSize:'0.7rem', color:'#9D9D9D' }}>{r.location} · Maks.{r.capacity} · {r.work_start_hour}:00-{r.work_end_hour}:00</div>
                        </div>
                        <div style={{ display:'flex', gap:'0.375rem' }}>
                          <button onClick={() => { setEditingRoom(r); setRoomForm({ name:r.name, location:r.location??'', capacity:r.capacity, work_start_hour:r.work_start_hour, work_end_hour:r.work_end_hour }) }} style={{ background:'transparent', border:'1px solid #DDDDDD', borderRadius:'0.25rem', padding:'3px 8px', fontSize:'0.68rem', fontFamily:"'Montserrat', sans-serif", cursor:'pointer', color:'#9D9D9D' }}>Duzenle</button>
                          <button onClick={() => toggleRoom(r.id, !r.is_active).then(() => ok(r.is_active ? 'Oda devre disi.' : 'Oda aktif.'))} style={{ background:'transparent', border:'1px solid #DDDDDD', borderRadius:'0.25rem', padding:'3px 8px', fontSize:'0.68rem', fontFamily:"'Montserrat', sans-serif", cursor:'pointer', color: r.is_active ? '#D72B01' : '#7B9D76' }}>
                            {r.is_active ? 'Deaktif' : 'Aktif'}
                          </button>
                        </div>
                      </div>
                      {r.is_active && (
                        <div style={{ marginTop:'6px' }}>
                          <a href={`/display/${r.id}`} target="_blank" rel="noreferrer" style={{ fontSize:'0.65rem', color:'#E45A80', fontWeight:600 }}>
                            Display Linki →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* UYELER */}
          {tab === 'members' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {members.map(m => (
                <div key={m.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1rem', background:'#ffffff', border:'1px solid #DDDDDD', borderRadius:'0.5rem', gap:'1rem' }}>
                  <div>
                    <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#0F0F0F' }}>{(m as any).profile?.full_name ?? '-'}</div>
                    <div style={{ fontSize:'0.7rem', color:'#9D9D9D' }}>{(m as any).profile?.email ?? '-'}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <select
                      value={m.role}
                      onChange={e => updateMemberRole(m.id, e.target.value).then(() => ok('Rol guncellendi.'))}
                      style={{ padding:'4px 8px', border:'1px solid #DDDDDD', borderRadius:'0.25rem', fontSize:'0.72rem', fontFamily:"'Montserrat', sans-serif", background:'#ffffff', cursor:'pointer' }}
                    >
                      <option value="member">Uye</option>
                      <option value="admin">Admin</option>
                      <option value="display">Display</option>
                    </select>
                    <button onClick={() => removeMember(m.id).then(() => ok('Uye kaldirildi.'))} style={{ background:'transparent', border:'1px solid #DDDDDD', borderRadius:'0.25rem', padding:'4px 8px', fontSize:'0.68rem', fontFamily:"'Montserrat', sans-serif", color:'#D72B01', cursor:'pointer' }}>
                      Kaldir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DOMAİNLER */}
          {tab === 'domains' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
              <div>
                <h4 style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:'1rem' }}>Domain Ekle</h4>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <input
                    type="text" value={newDomain} onChange={e => setNewDomain(e.target.value)}
                    placeholder="sirketadi.com"
                    style={{ flex:1, height:'2.5rem', padding:'0 0.75rem', border:'1.5px solid #DDDDDD', borderRadius:'0.25rem', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif", outline:'none' }}
                  />
                  <button className="btn-primary" onClick={() => addDomain(newDomain).then(ok => { if(ok) { setNewDomain(''); ok && setSuccessMsg('Domain eklendi.'); setTimeout(() => setSuccessMsg(''), 3000) } })}>
                    Ekle
                  </button>
                </div>
                <p style={{ fontSize:'0.7rem', color:'#9D9D9D', marginTop:'0.5rem' }}>
                  Bu domaine sahip kullanicilar sisteme ilk girislerinde otomatik firmaya atanir.
                </p>
              </div>
              <div>
                <h4 style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:'1rem' }}>Aktif Domainler ({domains.length})</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                  {domains.map(d => (
                    <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.625rem 0.875rem', background:'#fafafa', border:'1px solid #DDDDDD', borderRadius:'0.375rem' }}>
                      <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#0F0F0F' }}>@{d.domain}</span>
                      <button onClick={() => removeDomain(d.id).then(() => ok('Domain kaldirildi.'))} style={{ background:'transparent', border:'none', fontSize:'0.7rem', color:'#D72B01', cursor:'pointer', fontFamily:"'Montserrat', sans-serif" }}>Sil</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REZERVASYONLAR */}
          {tab === 'reservations' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <input type="text" placeholder="Ad veya e-posta ile ara..." value={filterText} onChange={e => setFilterText(e.target.value)}
                  style={{ height:'2.5rem', padding:'0 1rem', border:'1.5px solid #DDDDDD', borderRadius:'0.25rem', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif", outline:'none', width:'300px' }}
                />
                <button onClick={exportCSV} className="btn-secondary">CSV Indir</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {reservations.filter(r => filterText==='' || r.full_name.toLowerCase().includes(filterText.toLowerCase()) || r.email.toLowerCase().includes(filterText.toLowerCase())).map(r => {
                  const start = parseISO(r.start_time)
                  const end   = parseISO(r.end_time)
                  const mins  = (end.getTime()-start.getTime())/60000
                  const room  = rooms.find(rm => rm.id === r.room_id)
                  const isActive = r.status === 'active'
                  return (
                    <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1rem', background: isActive ? '#ffffff' : '#fafafa', border:`1px solid ${isActive ? '#DDDDDD' : '#EEEEEE'}`, borderRadius:'0.5rem', opacity: isActive ? 1 : 0.6, gap:'1rem' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#0F0F0F' }}>{r.full_name}</span>
                          <span style={{ background: isActive ? '#FCEEF2' : '#f0f0f0', color: isActive ? '#E45A80' : '#9D9D9D', fontSize:'0.6rem', fontWeight:700, padding:'2px 6px', borderRadius:'999px' }}>
                            {isActive ? 'Aktif' : 'Iptal'}
                          </span>
                        </div>
                        <div style={{ fontSize:'0.7rem', color:'#9D9D9D', marginTop:'2px' }}>
                          {room?.name} · {format(start,'d MMM yyyy',{locale:tr})} · {format(start,'HH:mm')}-{format(end,'HH:mm')} · {mins}dk · {r.attendee_count} kisi
                        </div>
                      </div>
                      {isActive && (
                        <button onClick={() => cancelReservation(r.id).then(() => ok('Rezervasyon iptal edildi.'))} style={{ background:'transparent', border:'1px solid #DDDDDD', borderRadius:'0.25rem', padding:'4px 10px', fontSize:'0.7rem', fontFamily:"'Montserrat', sans-serif", color:'#9D9D9D', cursor:'pointer' }}>
                          Iptal Et
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* BLOKLU SLOTLAR */}
          {tab === 'blocked' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
              <div>
                <h4 style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:'1rem' }}>Yeni Blok Ekle</h4>
                <form onSubmit={handleBlkSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  <div>
                    <Label>Oda *</Label>
                    <select value={blkRoom} onChange={e => setBlkRoom(e.target.value)} required style={{ width:'100%', height:'2.5rem', padding:'0 0.75rem', border:'1.5px solid #DDDDDD', borderRadius:'0.25rem', fontSize:'0.8rem', fontFamily:"'Montserrat', sans-serif", outline:'none' }}>
                      <option value="">Oda sec...</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div><Label>Tarih *</Label><Input type="date" value={blkDate} onChange={(e:any) => setBlkDate(e.target.value)} /></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                    <div><Label>Baslangic</Label><Input type="time" value={blkStart} onChange={(e:any) => setBlkStart(e.target.value)} /></div>
                    <div><Label>Bitis</Label><Input type="time" value={blkEnd} onChange={(e:any) => setBlkEnd(e.target.value)} /></div>
                  </div>
                  <div><Label>Aciklama</Label><Input value={blkReason} onChange={(e:any) => setBlkReason(e.target.value)} placeholder="Idari toplanti..." /></div>
                  <button type="submit" className="btn-primary">Blok Ekle</button>
                </form>
              </div>
              <div>
                <h4 style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:'1rem' }}>Aktif Bloklar ({blockedSlots.length})</h4>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                  {blockedSlots.map(b => {
                    const start = parseISO(b.start_time)
                    const end   = parseISO(b.end_time)
                    const room  = rooms.find(r => r.id === b.room_id)
                    return (
                      <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.625rem 0.875rem', background:'#f5f5f5', border:'1px solid #DDDDDD', borderRadius:'0.375rem', gap:'0.75rem' }}>
                        <div>
                          <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#0F0F0F' }}>{room?.name} · {format(start,'d MMM',{locale:tr})} · {format(start,'HH:mm')}-{format(end,'HH:mm')}</div>
                          {b.reason && <div style={{ fontSize:'0.68rem', color:'#9D9D9D' }}>{b.reason}</div>}
                        </div>
                        <button onClick={() => removeBlockedSlot(b.id).then(() => ok('Blok kaldirildi.'))} style={{ background:'transparent', border:'none', fontSize:'0.7rem', color:'#D72B01', cursor:'pointer', fontFamily:"'Montserrat', sans-serif", whiteSpace:'nowrap' }}>Sil</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
