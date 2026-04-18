import { useState, useEffect } from 'react'
import { supabase } from './config/supabase'
import Auth from './pages/Auth'
import Home from './pages/Home'
import AddListing from './pages/AddListing'
import Profile from './pages/Profile'
import Support from './pages/Support'
import Admin from './pages/Admin'

function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState('home')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Auth />

  if (page === 'addListing') {
    return <AddListing session={session} onBack={() => setPage('home')} />
  }

  if (page === 'profile') {
  return <Profile session={session} onBack={() => setPage('home')} onNavigate={setPage} />
}

  if (page === 'support') {
    return <Support session={session} onBack={() => setPage('home')} />
  }

  if (page === 'admin') {
    return <Admin session={session} onBack={() => setPage('home')} />
  }

  return <Home session={session} onNavigate={setPage} />
}

export default App