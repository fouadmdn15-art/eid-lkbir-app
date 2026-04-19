import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
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
        // ملي المستخدم يدخل أو يسجل، رجعو أوتوماتيكياً للصفحة الرئيسية
        if (session && _event === 'SIGNED_IN') {
          setPage('home')
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const renderPage = () => {
    if (page === 'auth') {
      return <Auth onBack={() => setPage('home')} />
    }

    if (page === 'addListing') {
      if (!session) return <Auth onBack={() => setPage('home')} />
      return <AddListing session={session} onBack={() => setPage('home')} onNavigate={setPage} />
    }

    if (page === 'profile') {
      if (!session) return <Auth onBack={() => setPage('home')} />
      return <Profile session={session} onBack={() => setPage('home')} onNavigate={setPage} />
    }

    if (page === 'support') {
      if (!session) return <Auth onBack={() => setPage('home')} />
      return <Support session={session} onBack={() => setPage('home')} />
    }

    if (page === 'admin') {
      if (!session) return <Auth onBack={() => setPage('home')} />
      return <Admin session={session} onBack={() => setPage('home')} />
    }

    return <Home session={session} onNavigate={setPage} />
  }

  return (
    <>
      {renderPage()}
      <Analytics />
    </>
  )
}

export default App