import { useState, useEffect, useRef } from 'react'
import { supabase } from '../config/supabase'

function Home({ session, onNavigate }) {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [profile, setProfile] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // جيب البروفيل مع type_compte
  useEffect(() => {
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

  // جيب عدد الرسائل الجديدة
  useEffect(() => {
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

  // جيب الحوالا
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

  // سكر المنيو فاش تكليكي برا
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
    <div style={{ fontFamily:'Arial', direction:'rtl', minHeight:'100vh', background:'#f5f5f5' }}>

      {/* الهيدر */}
      <div style={{ background:'#1a6b3c', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ color:'white', margin:0, fontSize:'20px' }}>🐑 سوق العيد</h2>

        {/* دروب داون */}
        <div ref={menuRef} style={{ position:'relative' }}>
          <div
            onClick={() => setShowMenu(!showMenu)}
            style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', background:'rgba(255,255,255,0.15)', padding:'6px 12px', borderRadius:'25px' }}
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

          {/* قائمة الدروب داون */}
          {showMenu && (
            <div style={{ position:'absolute', top:'50px', left:'0', background:'white', borderRadius:'12px', boxShadow:'0 8px 25px rgba(0,0,0,0.15)', minWidth:'200px', zIndex:100, overflow:'hidden' }}>

              {/* معلومات المستخدم */}
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

                {/* إضافة حولي — غير للبائع */}
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

                {/* البروفيل */}
                <div
                  onClick={() => { onNavigate('profile'); setShowMenu(false) }}
                  style={{ padding:'12px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', color:'#333' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>👤</span>
                  <span>البروفيل</span>
                </div>

                {/* تواصل معنا */}
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

                {/* خروج */}
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
      </div>

      {/* popup الصورة المكبرة */}
      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, cursor:'pointer' }}>
          <img src={selectedPhoto} alt="صورة الحولي" style={{ maxWidth:'95%', maxHeight:'95%', objectFit:'contain', borderRadius:'10px' }} />
          <div style={{ position:'absolute', top:'20px', left:'20px', color:'white', fontSize:'30px' }}>✕</div>
        </div>
      )}

      <div style={{ padding:'15px', maxWidth:'600px', margin:'0 auto' }}>

        {/* زر إضافة حولي — غير للبائع */}
        {profile?.type_compte === 'vendeur' && (
          <button
            onClick={() => onNavigate('addListing')}
            style={{ width:'100%', padding:'15px', background:'#1a6b3c', color:'white', border:'none', borderRadius:'10px', fontSize:'18px', cursor:'pointer', fontWeight:'bold', marginBottom:'20px' }}
          >
            🐑 إضافة حولي
          </button>
        )}

        {/* قائمة الحوالا */}
        {loading ? (
          <p style={{ textAlign:'center', color:'#999' }}>جاري التحميل...</p>
        ) : annonces.length === 0 ? (
          <p style={{ textAlign:'center', color:'#999' }}>ما كاين حتى حولي دابا</p>
        ) : (
          annonces.map(annonce => (
            <div key={annonce.id} style={{ background:'white', borderRadius:'12px', marginBottom:'15px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflow:'hidden' }}>

              {annonce.photos && annonce.photos[0] && (
                <div style={{ position:'relative' }}>
                  <img
                    src={annonce.photos[0]}
                    alt={annonce.titre}
                    onClick={() => setSelectedPhoto(annonce.photos[0])}
                    style={{ width:'100%', height:'220px', objectFit:'cover', cursor:'zoom-in', display:'block' }}
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

                <a
                  href={`https://wa.me/212${annonce.profiles?.telephone?.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display:'block', width:'100%', padding:'10px', background:'#25D366', color:'white', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold', textAlign:'center', textDecoration:'none', boxSizing:'border-box' }}
                >
                  💬 تواصل عبر واتساب
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Home