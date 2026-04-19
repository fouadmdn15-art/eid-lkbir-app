import { useState, useEffect, useRef } from 'react'
import { supabase } from '../config/supabase'

function Home({ session, onNavigate }) {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [profile, setProfile] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const [authPopupMessage, setAuthPopupMessage] = useState('')
  const menuRef = useRef(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const requireAuth = (message, action) => {
    if (!session) {
      setAuthPopupMessage(message)
      setShowAuthPopup(true)
      return
    }
    action()
  }

  useEffect(() => {
    if (!session) return
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('nom, avatar_url, type_compte')
        .eq('id', session.user.id)
        .single()
      if (data) setProfile(data)
    }
    fetchProfile()
  }, [session])

  useEffect(() => {
    if (!session) return
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
        .eq('from_admin', true)
        .eq('read', false)
      setUnreadCount(count || 0)
    }
    fetchUnread()

    const channel = supabase
      .channel('unread-' + session.user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `user_id=eq.${session.user.id}`
      }, () => { fetchUnread() })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session])

  useEffect(() => {
    const fetchAnnonces = async () => {
      const { data, error } = await supabase
        .from('annonces')
        .select('*, profiles(telephone, nom)')
        .eq('disponible', true)
        .order('created_at', { ascending: false })
      if (!error) setAnnonces(data)
      setLoading(false)
    }
    fetchAnnonces()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div style={{
      fontFamily:'Arial',
      direction:'rtl',
      minHeight:'100vh',
      backgroundImage:'url(/background.PNG)',
      backgroundSize:'cover',
      backgroundPosition:'center',
      backgroundAttachment:'fixed',
      position:'relative'
    }}>
      <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(26,107,60,0.45)', zIndex:0, pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:1 }}>

        <div style={{ background:'rgba(26,107,60,0.95)', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', backdropFilter:'blur(10px)', boxShadow:'0 2px 10px rgba(0,0,0,0.2)' }}>
          <h2 style={{ color:'white', margin:0, fontSize:'20px' }}>🐑 سوق العيد</h2>

          {!session ? (
            <button
              onClick={() => onNavigate('auth')}
              style={{ background:'white', color:'#1a6b3c', border:'none', padding:'8px 18px', borderRadius:'25px', fontSize:'14px', fontWeight:'bold', cursor:'pointer' }}
            >
              🚪 دخول / تسجيل
            </button>
          ) : (
            <div ref={menuRef} style={{ position:'relative' }}>
              <div
                onClick={() => setShowMenu(!showMenu)}
                style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', background:'rgba(255,255,255,0.2)', padding:'6px 12px', borderRadius:'25px' }}
              >
                <div style={{ position:'relative' }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="بروفيل" style={{ width:'35px', height:'35px', borderRadius:'50%', objectFit:'cover', border:'2px solid white' }} />
                  ) : (
                    <div style={{ width:'35px', height:'35px', borderRadius:'50%', background:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>👤</div>
                  )}
                  {unreadCount > 0 && (
                    <span style={{ position:'absolute', top:'-3px', left:'-3px', background:'red', color:'white', borderRadius:'50%', width:'16px', height:'16px', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span style={{ color:'white', fontSize:'14px', fontWeight:'bold' }}>
                  {profile?.nom?.split(' ')[0] || 'مرحبا'}
                </span>
                <span style={{ color:'white', fontSize:'12px' }}>{showMenu ? '▲' : '▼'}</span>
              </div>

              {showMenu && (
                <div style={{ position:'absolute', top:'50px', left:'0', background:'white', borderRadius:'12px', boxShadow:'0 8px 25px rgba(0,0,0,0.25)', minWidth:'200px', zIndex:9999, overflow:'hidden' }}>

                  <div style={{ padding:'15px', background:'#f9f9f9', borderBottom:'1px solid #eee', textAlign:'center' }}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="بروفيل" style={{ width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', border:'2px solid #1a6b3c', marginBottom:'8px' }} />
                    ) : (
                      <div style={{ width:'50px', height:'50px', borderRadius:'50%', background:'#e8f5e9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'25px', margin:'0 auto 8px auto' }}>👤</div>
                    )}
                    <p style={{ margin:0, fontWeight:'bold', color:'#333', fontSize:'15px' }}>{profile?.nom || 'مستخدم'}</p>
                    <p style={{ margin:'3px 0 0 0', color:'#999', fontSize:'12px' }}>{session.user.email}</p>
                  </div>

                  <div style={{ padding:'8px 0' }}>

                    {profile?.type_compte === 'vendeur' && (
                      <div
                        onClick={() => { onNavigate('addListing'); setShowMenu(false) }}
                        style={{ padding:'12px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', color:'#333' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>🐑</span>
                        <span>إضافة حولي</span>
                      </div>
                    )}

                    <div
                      onClick={() => { onNavigate('profile'); setShowMenu(false) }}
                      style={{ padding:'12px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', color:'#333' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>👤</span>
                      <span>البروفيل</span>
                    </div>

                    <div
                      onClick={() => { onNavigate('support'); setShowMenu(false) }}
                      style={{ padding:'12px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', color:'#333', position:'relative' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>💬</span>
                      <span>تواصل مع الفريق</span>
                      {unreadCount > 0 && (
                        <span style={{ background:'red', color:'white', borderRadius:'50%', width:'18px', height:'18px', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', marginRight:'auto' }}>
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    <div style={{ height:'1px', background:'#eee', margin:'5px 0' }} />

                    <div
                      onClick={handleLogout}
                      style={{ padding:'12px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', color:'#f44336' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>🚪</span>
                      <span>خروج</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedPhoto && (
          <div onClick={() => setSelectedPhoto(null)} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, cursor:'pointer' }}>
            <img src={selectedPhoto} alt="صورة الحولي" style={{ maxWidth:'95%', maxHeight:'95%', objectFit:'contain', borderRadius:'10px' }} />
            <div style={{ position:'absolute', top:'20px', left:'20px', color:'white', fontSize:'30px' }}>✕</div>
          </div>
        )}

        {showAuthPopup && (
          <div onClick={() => setShowAuthPopup(false)} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'15px', padding:'30px', maxWidth:'400px', width:'100%', textAlign:'center', boxShadow:'0 10px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize:'55px', marginBottom:'10px' }}>🔒</div>
              <h2 style={{ color:'#1a6b3c', margin:'0 0 10px 0' }}>سجل دخولك أولاً</h2>
              <p style={{ color:'#666', fontSize:'15px', marginBottom:'25px' }}>
                {authPopupMessage}
              </p>
              <button
                onClick={() => { setShowAuthPopup(false); onNavigate('auth') }}
                style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#1a6b3c,#2d9e5f)', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold', marginBottom:'10px' }}
              >
                🚪 دخول / تسجيل
              </button>
              <button
                onClick={() => setShowAuthPopup(false)}
                style={{ width:'100%', padding:'12px', background:'transparent', color:'#999', border:'1px solid #ddd', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div style={{ padding:'15px', maxWidth:'600px', margin:'0 auto' }}>

          {(!session || profile?.type_compte === 'vendeur') && (
            <button
              onClick={() => requireAuth('باش تضيف حولي، خاصك تسجل حساب ديالك (بائع). الأمر ياخد أقل من دقيقة!', () => onNavigate('addListing'))}
              style={{ width:'100%', padding:'15px', background:'#1a6b3c', color:'white', border:'none', borderRadius:'10px', fontSize:'18px', cursor:'pointer', fontWeight:'bold', marginBottom:'20px', boxShadow:'0 4px 15px rgba(0,0,0,0.2)' }}
            >
              🐑 إضافة حولي
            </button>
          )}

          {!session && (
            <div style={{ background:'rgba(255,255,255,0.95)', color:'#1a6b3c', padding:'15px', borderRadius:'10px', marginBottom:'20px', textAlign:'center', boxShadow:'0 4px 15px rgba(0,0,0,0.15)' }}>
              <p style={{ margin:0, fontSize:'15px', fontWeight:'bold' }}>
                👋 مرحبا بك فـ <strong>سوق العيد</strong>! تصفح الحوالا بحرية، وسجل غير ملي تبغي تتواصل مع بائع.
              </p>
            </div>
          )}

          {loading ? (
            <p style={{ textAlign:'center', color:'white', fontSize:'16px', fontWeight:'bold', textShadow:'1px 1px 3px rgba(0,0,0,0.5)' }}>جاري التحميل...</p>
          ) : annonces.length === 0 ? (
            <div style={{ background:'rgba(255,255,255,0.95)', padding:'30px', borderRadius:'12px', textAlign:'center', boxShadow:'0 4px 15px rgba(0,0,0,0.15)' }}>
              <p style={{ color:'#666', margin:0, fontSize:'16px' }}>ما كاين حتى حولي دابا</p>
            </div>
          ) : (
            annonces.map(annonce => (
              <div key={annonce.id} style={{ background:'rgba(255,255,255,0.97)', borderRadius:'12px', marginBottom:'15px', boxShadow:'0 4px 15px rgba(0,0,0,0.2)', overflow:'hidden' }}>

                {annonce.photos && annonce.photos[0] && (
                  <div style={{ position:'relative' }}>
                    <img
                      src={annonce.photos[0]}
                      alt={annonce.titre}
                      onClick={() => setSelectedPhoto(annonce.photos[0])}
                      style={{ width:'100%', height:'280px', objectFit:'contain', cursor:'zoom-in', display:'block', background:'#f5f5f5' }}
                    />
                    <div style={{ position:'absolute', bottom:'10px', left:'10px', background:'rgba(0,0,0,0.5)', color:'white', padding:'4px 8px', borderRadius:'5px', fontSize:'12px' }}>
                      🔍 اضغط للتكبير
                    </div>
                  </div>
                )}

                <div style={{ padding:'15px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                    <h3 style={{ margin:0, fontSize:'18px', color:'#1a6b3c' }}>{annonce.titre}</h3>
                    <span style={{ background:'#1a6b3c', color:'white', padding:'5px 12px', borderRadius:'20px', fontWeight:'bold', fontSize:'16px' }}>
                      {annonce.prix} درهم
                    </span>
                  </div>

                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'10px' }}>
                    {annonce.race && <span style={{ background:'#f0f0f0', padding:'4px 10px', borderRadius:'15px', fontSize:'14px' }}>🐑 {annonce.race}</span>}
                    {annonce.poids && <span style={{ background:'#f0f0f0', padding:'4px 10px', borderRadius:'15px', fontSize:'14px' }}>⚖️ {annonce.poids} كيلو</span>}
                    {annonce.age_mois && <span style={{ background:'#f0f0f0', padding:'4px 10px', borderRadius:'15px', fontSize:'14px' }}>📅 {annonce.age_mois} شهر</span>}
                    {annonce.region && <span style={{ background:'#f0f0f0', padding:'4px 10px', borderRadius:'15px', fontSize:'14px' }}>📍 {annonce.region}</span>}
                    <span style={{ background: annonce.livraison ? '#e8f5e9' : '#ffeeba', color: annonce.livraison ? '#1a6b3c' : '#856404', padding:'4px 10px', borderRadius:'15px', fontSize:'14px', fontWeight:'bold' }}>
                      {annonce.livraison ? '🚚 توصيل متاح' : '📍 بدون توصيل'}
                    </span>
                  </div>

                  {annonce.description && (
                    <p style={{ color:'#666', fontSize:'14px', margin:'0 0 10px 0' }}>{annonce.description}</p>
                  )}

                  {annonce.profiles?.nom && (
                    <p style={{ color:'#999', fontSize:'13px', margin:'0 0 10px 0' }}>👤 {annonce.profiles.nom}</p>
                  )}

                  {session ? (
                    <a
                      href={`https://wa.me/212${annonce.profiles?.telephone?.replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display:'block', width:'100%', padding:'10px', background:'#25D366', color:'white', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold', textAlign:'center', textDecoration:'none', boxSizing:'border-box' }}
                    >
                      💬 تواصل عبر واتساب
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        setAuthPopupMessage('باش تتواصل مع البائع عبر واتساب، خاصك تسجل دخولك أولاً. التسجيل مجاني وياخد أقل من دقيقة!')
                        setShowAuthPopup(true)
                      }}
                      style={{ display:'block', width:'100%', padding:'10px', background:'#25D366', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold', textAlign:'center', boxSizing:'border-box' }}
                    >
                      💬 تواصل عبر واتساب
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Home