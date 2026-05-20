import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setUser(session?.user ?? null)
                if (session?.user) {
                    fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                }
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()  // won't throw error if row doesn't exist

        if (!error && data) setProfile(data)
    }

    async function login(email, password) {
        return await supabase.auth.signInWithPassword({ email, password })
    }

    async function register(email, password, fullName) {
        return await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        })
    }

    async function logout() {
        await supabase.auth.signOut()
        setProfile(null)
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, register, logout, fetchProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}