import { useState, useEffect, useRef } from 'react'
import { supabase } from '../config/supabase'

const ADMIN_EMAIL = 'fouadmdn15@gmail.com'

// قائمة الدول مع الأعلام والأكواد
const COUNTRIES = [
  { code: '+212', flag: '🇲🇦', name: 'المغرب' },
  { code: '+34', flag: '🇪🇸', name: 'إسبانيا' },
  { code: '+33', flag: '🇫🇷', name: 'فرنسا' },
  { code: '+39', flag: '🇮🇹', name: 'إيطاليا' },
  { code: '+32', flag: '🇧🇪', name: 'بلجيكا' },
  { code: '+31', flag: '🇳🇱', name: 'هولندا' },
  { code: '+49', flag: '🇩🇪', name: 'ألمانيا' },
  { code: '+44', flag: '🇬🇧', name: 'بريطانيا' },
  { code: '+46', flag: '🇸🇪', name: 'السويد' },
  { code: '+47', flag: '🇳🇴', name: 'النرويج' },
  { code: '+41', flag: '🇨🇭', name: 'سويسرا' },
  { code: '+43', flag: '🇦🇹', name: 'النمسا' },
  { code: '+45', flag: '🇩🇰', name: 'الدنمارك' },
  { code: '+1', flag: '🇺🇸', name: 'أمريكا / كندا' },
  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+974', flag: '🇶🇦', name: 'قطر' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت' },
  { code: '+213', flag: '🇩🇿', name: 'الجزائر' },
  { code: '+216', flag: '🇹🇳', name: 'تونس' },
]

function Profile({ session, onBack, onNavigate }) {
  const [profile, setProfile] = useState(null)
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const fileInputRef = useRef(null)

  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [countryCode, setCountryCode] = useState('+212')
  const [ville, setVille] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setNom(profileData.nom || '')
        setTelephone(profileData.telephone || '')
        setCountryCode(profileData.country_code || '+212')
        setVille(profileData.ville || '')
      }

      const { data: annoncesData } = await supabase
        .from('annonces')
        .select('*')
        .eq('vendeur_id', session.user.id)
        .order('created_at', { ascending: false })

      if (annoncesData) setAnnonces(annoncesData)
      setLoading(false)
    }
    fetchData()
  }, [session])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    setShowAvatarMenu(false)
    const fileName = `avatar-${session.user.id}-${Date.now()}`
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, file, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)
      await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', session.user.id)
      setProfile({ ...profile, avatar_url: urlData.publicUrl })
      setMessage('✅ تم تحديث الصورة!')
    } else {
      setMessage('⚠️ خطأ فرفع الصورة')
    }
    setUploadingAvatar(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAvatarDelete = async () => {
    if (!window.confirm('واش بغيتي تحذف صورة البروفيل؟')) return
    setShowAvatarMenu(false)
    setUploadingAvatar(true)
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', session.user.id)
    if (!error) {
      setProfile({ ...profile, avatar_url: null })
      setMessage('✅ تم حذف الصورة!')
    } else {
      setMessage('⚠️ خطأ فحذف الصورة')
    }
    setUploadingAvatar(false)
  }

  const handleAvatarClick = () => {
    if (profile?.avatar_url) {
      setShowAvatarMenu(true)
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleSave = async () => {
    // نظف الرقم من أي رموز
    const cleanPhone = telephone.replace(/[^0-9]/g, '').replace(/^0+/, '')
    if (cleanPhone.length < 6) {
      setMessage('⚠️ رقم الهاتف غير صحيح!')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        nom,
        telephone: cleanPhone,
        country_code: countryCode,
        ville
      })
      .eq('id', session.user.id)

    if (error) {
      setMessage('خطأ: ' + error.message)
    } else {
      setMessage('✅ تم حفظ التعديلات!')
      setProfile({ ...profile, nom, telephone: cleanPhone, country_code: countryCode, ville })
      setEditing(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('واش بغيتي تحذف هاد الإعلان؟')) return
    const { error } = await supabase.from('annonces').delete().eq('id', id)
    if (!error) {
      setAnnonces(annonces.filter(a => a.id !== id))
      setMessage('✅ تم حذف الإعلان!')
    }
  }

  const handleSold = async (id, currentStatus) => {
    const { error } = await supabase
      .from('annonces')
      .update({ disponible: !currentStatus })
      .eq('id', id)
    if (!error) {
      setAnnonces(annonces.map(a =>
        a.id === id ? { ...a, disponible: !currentStatus } : a
      ))
    }
  }

  if (loading) return <div style={{ textAlign:'center', padding:'50px' }}>جاري التحميل...</div>

  // نبان الرقم مع country_code
  const displayPhone = profile?.telephone
    ? `${profile.country_code || '+212'} ${profile.telephone}`
    : 'غير محدد'

  return (
    <div style={{ fontFamily:'Arial', direction:'rtl', minHeight:'100vh', background:'#f5f5f5' }}>

      <div style={{ background:'#1a6b3c', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ color:'white', margin:0, fontSize:'20px' }}>👤 البروفيل</h2>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer' }}>
          رجوع
        </button>
      </div>

      {showAvatarMenu && (
        <div onClick={() => setShowAvatarMenu(false)} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'15px', padding:'25px', maxWidth:'350px', width:'100%', boxShadow:'0 10px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color:'#1a6b3c', margin:'0 0 20px 0', textAlign:'center' }}>صورة البروفيل</h3>

            <button
              onClick={() => { setShowAvatarMenu(false); fileInputRef.current?.click() }}
              style={{ width:'100%', padding:'14px', background:'#1a6b3c', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold', marginBottom:'10px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
            >
              <span>📷</span>
              <span>تغيير الصورة</span>
            </button>

            <button
              onClick={handleAvatarDelete}
              style={{ width:'100%', padding:'14px', background:'#f44336', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold', marginBottom:'10px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
            >
              <span>🗑️</span>
              <span>حذف الصورة</span>
            </button>

            <button
              onClick={() => setShowAvatarMenu(false)}
              style={{ width:'100%', padding:'12px', background:'transparent', color:'#999', border:'1px solid #ddd', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div style={{ padding:'15px', maxWidth:'600px', margin:'0 auto' }}>

        <div style={{ background:'white', borderRadius:'12px', padding:'20px', marginBottom:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>

          <div style={{ textAlign:'center', marginBottom:'15px' }}>
            <div style={{ position:'relative', display:'inline-block' }}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="البروفيل"
                  onClick={handleAvatarClick}
                  style={{ width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', border:'3px solid #1a6b3c', cursor:'pointer' }}
                />
              ) : (
                <div
                  onClick={handleAvatarClick}
                  style={{ width:'100px', height:'100px', borderRadius:'50%', background:'#e8f5e9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'50px', margin:'0 auto', border:'3px solid #1a6b3c', cursor:'pointer' }}
                >👤</div>
              )}
              <div
                onClick={handleAvatarClick}
                style={{ position:'absolute', bottom:'0', left:'0', background:'#1a6b3c', color:'white', borderRadius:'50%', width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'14px', border:'2px solid white' }}
              >
                {uploadingAvatar ? '...' : '📷'}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display:'none' }}
              />
            </div>
            <p style={{ color:'#999', margin:'8px 0 0 0', fontSize:'13px' }}>{session.user.email}</p>
            <p style={{ color:'#bbb', margin:'3px 0 0 0', fontSize:'12px' }}>اضغط على الصورة لتعديلها</p>
          </div>

          {!editing ? (
            <>
              <div style={{ marginBottom:'10px', padding:'10px', background:'#f9f9f9', borderRadius:'8px' }}>
                <span style={{ color:'#999', fontSize:'14px' }}>الاسم: </span>
                <span style={{ fontWeight:'bold' }}>{profile?.nom || 'غير محدد'}</span>
              </div>
              <div style={{ marginBottom:'10px', padding:'10px', background:'#f9f9f9', borderRadius:'8px' }}>
                <span style={{ color:'#999', fontSize:'14px' }}>الهاتف: </span>
                <span style={{ fontWeight:'bold', direction:'ltr', display:'inline-block' }}>{displayPhone}</span>
              </div>
              <div style={{ marginBottom:'15px', padding:'10px', background:'#f9f9f9', borderRadius:'8px' }}>
                <span style={{ color:'#999', fontSize:'14px' }}>المدينة: </span>
                <span style={{ fontWeight:'bold' }}>{profile?.ville || 'غير محدد'}</span>
              </div>

              {session?.user?.email === ADMIN_EMAIL && (
                <button
                  onClick={() => onNavigate('admin')}
                  style={{ width:'100%', padding:'12px', background:'#1a3a6b', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold', marginBottom:'10px' }}
                >
                  🛠️ لوحة التحكم
                </button>
              )}

              <button
                onClick={() => setEditing(true)}
                style={{ width:'100%', padding:'12px', background:'#1a6b3c', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold' }}
              >
                ✏️ تعديل المعلومات
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom:'12px' }}>
                <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>الاسم</label>
                <input style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', boxSizing:'border-box' }} value={nom} onChange={e => setNom(e.target.value)} />
              </div>

              {/* رقم الهاتف مع البلد */}
              <div style={{ marginBottom:'12px' }}>
                <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>📱 رقم الهاتف</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  <select
                    style={{ padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'15px', background:'white', cursor:'pointer', minWidth:'130px' }}
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    style={{ flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', direction:'ltr', boxSizing:'border-box' }}
                    placeholder="612345678"
                    type="tel"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                  />
                </div>
                <p style={{ fontSize:'11px', color:'#999', margin:'5px 0 0 0', textAlign:'right' }}>
                  💡 اكتب الرقم بلا الصفر والرمز ديال البلد
                </p>
              </div>

              <div style={{ marginBottom:'15px' }}>
                <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>المدينة</label>
                <input style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', boxSizing:'border-box' }} value={ville} onChange={e => setVille(e.target.value)} />
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={handleSave} style={{ flex:1, padding:'12px', background:'#1a6b3c', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold' }}>💾 حفظ</button>
                <button onClick={() => setEditing(false)} style={{ flex:1, padding:'12px', background:'#ddd', color:'#333', border:'none', borderRadius:'8px', fontSize:'16px', cursor:'pointer' }}>إلغاء</button>
              </div>
            </>
          )}

          {message && (
            <p style={{ textAlign:'center', color: message.includes('✅') ? 'green' : 'red', marginTop:'10px', fontWeight:'bold' }}>{message}</p>
          )}
        </div>

        <h3 style={{ marginBottom:'15px', color:'#333' }}>🐑 إعلاناتي ({annonces.length})</h3>

        {annonces.length === 0 ? (
          <p style={{ textAlign:'center', color:'#999', background:'white', padding:'30px', borderRadius:'12px' }}>ما عندكش حتى إعلان دابا</p>
        ) : (
          annonces.map(annonce => (
            <div key={annonce.id} style={{ background:'white', borderRadius:'12px', padding:'15px', marginBottom:'15px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
              {annonce.photos && annonce.photos[0] && (
                <img src={annonce.photos[0]} alt={annonce.titre} style={{ width:'100%', height:'200px', objectFit:'contain', borderRadius:'8px', marginBottom:'10px', background:'#f5f5f5' }} />
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <h4 style={{ margin:0, color:'#1a6b3c' }}>{annonce.titre}</h4>
                <span style={{ background:'#1a6b3c', color:'white', padding:'4px 10px', borderRadius:'15px', fontSize:'14px' }}>{annonce.prix} درهم</span>
              </div>
              <div style={{ marginBottom:'10px' }}>
                <span style={{ background: annonce.disponible ? '#e8f5e9' : '#ffeeba', color: annonce.disponible ? '#1a6b3c' : '#856404', padding:'4px 10px', borderRadius:'15px', fontSize:'13px', fontWeight:'bold' }}>
                  {annonce.disponible ? '🟢 متاح' : '🔴 تباع'}
                </span>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => handleSold(annonce.id, annonce.disponible)} style={{ flex:1, padding:'10px', background: annonce.disponible ? '#ff9800' : '#4caf50', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', cursor:'pointer', fontWeight:'bold' }}>
                  {annonce.disponible ? '✓ تباع' : '↩ متاح'}
                </button>
                <button onClick={() => handleDelete(annonce.id)} style={{ flex:1, padding:'10px', background:'#f44336', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', cursor:'pointer', fontWeight:'bold' }}>
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Profile