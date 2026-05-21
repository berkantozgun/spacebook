import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Profile, Company, CompanyWithRole } from '../types'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  profile: Profile | null
  companies: CompanyWithRole[]
  selectedCompany: Company | null
  selectedRole: 'member' | 'admin' | 'display' | null
  loading: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  selectCompany: (company: Company) => void
  signInWithMagicLink: (email: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [companies, setCompanies] = useState<CompanyWithRole[]>([])
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(
    null
  )
  const [selectedRole, setSelectedRole] = useState<
    'member' | 'admin' | 'display' | null
  >(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          await loadProfile(session.user.id)
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setCompanies([])
        setSelectedCompanyState(null)
        setSelectedRole(null)
        sessionStorage.removeItem('spacebook_selected_company_id')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)

      // Load companies with roles
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select('company_id, role')
        .eq('user_id', userId)

      if (memberError) throw memberError

      if (memberData && memberData.length > 0) {
        const companyIds = memberData.map((m) => m.company_id)
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds)
          .eq('is_active', true)

        if (companiesError) throw companiesError

        const companiesWithRoles: CompanyWithRole[] = (companiesData || []).map(
          (company) => {
            const member = memberData.find((m) => m.company_id === company.id)
            return {
              ...company,
              role: member?.role || 'member',
            }
          }
        )

        setCompanies(companiesWithRoles)

        // Restore selected company from session storage
        const savedCompanyId = sessionStorage.getItem(
          'spacebook_selected_company_id'
        )
        if (savedCompanyId) {
          const saved = companiesWithRoles.find((c) => c.id === savedCompanyId)
          if (saved) {
            setSelectedCompanyState(saved)
            setSelectedRole(saved.role)
          }
        }
      }
    } catch (error) {
      console.error('Load profile error:', error)
    }
  }

  const selectCompany = (company: Company) => {
    setSelectedCompanyState(company)
    const companyWithRole = companies.find((c) => c.id === company.id)
    setSelectedRole(companyWithRole?.role || null)
    sessionStorage.setItem('spacebook_selected_company_id', company.id)
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setCompanies([])
    setSelectedCompanyState(null)
    setSelectedRole(null)
    sessionStorage.removeItem('spacebook_selected_company_id')
  }

  const refreshProfile = async () => {
    if (profile) {
      await loadProfile(profile.id)
    }
  }

  const value: AuthContextType = {
    profile,
    companies,
    selectedCompany,
    selectedRole,
    loading,
    isSuperAdmin: profile?.is_superadmin || false,
    isAdmin: selectedRole === 'admin',
    selectCompany,
    signInWithMagicLink,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
