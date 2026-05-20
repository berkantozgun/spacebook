import {
  createContext, useContext, useState, useEffect,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, Company, CompanyWithRole } from '../types'

const SELECTED_COMPANY_KEY = 'spacebook_selected_company_id'

interface AuthContextType {
  profile:          Profile | null
  companies:        CompanyWithRole[]
  selectedCompany:  Company | null
  selectedRole:     'member' | 'admin' | 'display' | null
  loading:          boolean
  isSuperAdmin:     boolean
  isAdmin:          boolean
  selectCompany:    (company: Company) => void
  signInWithMagicLink: (email: string) => Promise<{ error: any }>
  signOut:          () => Promise<void>
  refreshProfile:   () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [companies, setCompanies] = useState<CompanyWithRole[]>([])
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null)
  const [loading,   setLoading]   = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!prof) { setLoading(false); return }
    setProfile(prof as Profile)

    // Firma üyeliklerini çek
    const { data: memberships } = await supabase
      .from('company_members')
      .select('id, role, company_id, companies(*)')
      .eq('user_id', userId)

    if (memberships) {
      const mapped: CompanyWithRole[] = memberships.map((m: any) => ({
        company:  m.companies as Company,
        role:     m.role,
        memberId: m.id,
      }))
      setCompanies(mapped)

      // Önceden seçili firma var mı?
      const savedId = sessionStorage.getItem(SELECTED_COMPANY_KEY)
      if (savedId) {
        const found = mapped.find(m => m.company.id === savedId)
        if (found) setSelectedCompanyState(found.company)
        else if (mapped.length === 1) setSelectedCompanyState(mapped[0].company)
      } else if (mapped.length === 1) {
        setSelectedCompanyState(mapped[0].company)
        sessionStorage.setItem(SELECTED_COMPANY_KEY, mapped[0].company.id)
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) fetchProfile(session.user.id)
        else {
          setProfile(null)
          setCompanies([])
          setSelectedCompanyState(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  function selectCompany(company: Company) {
    setSelectedCompanyState(company)
    sessionStorage.setItem(SELECTED_COMPANY_KEY, company.id)
  }

  async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }

  async function signOut() {
    sessionStorage.removeItem(SELECTED_COMPANY_KEY)
    await supabase.auth.signOut()
    setProfile(null)
    setCompanies([])
    setSelectedCompanyState(null)
  }

  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await fetchProfile(session.user.id)
  }

  const selectedMembership = companies.find(
    c => c.company.id === selectedCompany?.id
  )

  const value: AuthContextType = {
    profile,
    companies,
    selectedCompany,
    selectedRole: selectedMembership?.role ?? null,
    loading,
    isSuperAdmin: profile?.is_superadmin ?? false,
    isAdmin:      selectedMembership?.role === 'admin',
    selectCompany,
    signInWithMagicLink,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
