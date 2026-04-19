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
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const renderPage = () => {
    // صفحة التسجيل/الدخول — تبان غير ملي يطلبها المستخدم
    if (page === 'auth') {
      return <Auth onBack={() => setPage('home')} />
    }

    // الصفحات اللي كتطلب تسجيل إجباري
    if (page === 'addListing') {
      if (!session) return <Auth onBack={() => setPage('home')} />
      return <AddListing session={session} onBack={() => setPage('home')} />
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

    // الصفحة الرئيسية — تبان للجميع (مسجل أو لا)
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