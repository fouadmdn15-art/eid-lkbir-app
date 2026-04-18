import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

const LIMITE_GRATUITE = 5

function AddListing({ session, onBack, onNavigate }) {
  const [titre, setTitre] = useState('')
  const [race, setRace] = useState('')
  const [poids, setPoids] = useState('')
  const [age, setAge] = useState('')
  const [region, setRegion] = useState('')
  const [prix, setPrix] = useState('')
  const [livraison, setLivraison] = useState(false)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [nbAnnonces, setNbAnnonces] = useState(0)
  const [abonnement, setAbonnement] = useState(false)
  const [checkingLimit, setCheckingLimit] = useState(true)

  useEffect(() => {
    const checkLimit = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('abonnement')
        .eq('id', session.user.id)
        .single()

      const { count } = await supabase
        .from('annonces')
        .select('*', { count: 'exact' })
        .eq('vendeur_id', session.user.id)

      setAbonnement(profile?.abonnement || false)
      setNbAnnonces(count || 0)
      setCheckingLimit(false)
    }
    checkLimit()
  }, [session])

  const handleSubmit = async () => {
    if (!titre || !race || !poids || !age || !region || !prix || !photo) {
      setMessage('⚠️ جميع الحقول إجبارية!')
      return
    }
    setLoading(true)

    let photoPath = null
    if (photo) {
      const fileName = `${session.user.id}-${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, photo)
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName)
        photoPath = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('annonces').insert({
      vendeur_id: session.user.id,
      titre, race,
      poids: parseFloat(poids),
      age_mois: parseInt(age),
      region,
      prix: parseFloat(prix),
      livraison,
      description,
      photos: photoPath ? [photoPath] : [],
      disponible: true
    })

    if (error) {
      setMessage('خطأ: ' + error.message)
    } else {
      setMessage('✅ تم إضافة الحولي بنجاح!')
      setNbAnnonces(prev => prev + 1)
      setTitre(''); setRace(''); setPoids('')
      setAge(''); setRegion(''); setPrix('')
      setLivraison(false)
      setDescription(''); setPhoto(null); setPhotoUrl('')
    }
    setLoading(false)
  }

  if (checkingLimit) {
    return (
      <div style={{ textAlign:'center', padding:'50px', fontFamily:'Arial' }}>
        <p>جاري التحميل...</p>
      </div>
    )
  }

  if (nbAnnonces >= LIMITE_GRATUITE && !abonnement) {
    return (
      <div style={{ fontFamily:'Arial', direction:'rtl', minHeight:'100vh', background:'#f5f5f5' }}>
        <div style={{ background:'#1a6b3c', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ color:'white', margin:0, fontSize:'20px' }}>🐑 إضافة حولي</h2>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer' }}>رجوع</button>
        </div>
        <div style={{ padding:'30px 20px', maxWidth:'500px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:'60px', marginBottom:'20px' }}>🔒</div>
          <div style={{ background:'white', borderRadius:'15px', padding:'25px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color:'#1a6b3c', marginBottom:'10px' }}>وصلتي للحد المجاني!</h2>
            <p style={{ color:'#666', marginBottom:'5px' }}>عندك <strong>{nbAnnonces} حوالا</strong> منشورة</p>
            <p style={{ color:'#666', marginBottom:'20px' }}>الحساب المجاني كيسمح بـ <strong>{LIMITE_GRATUITE} حوالا</strong> فقط</p>
            <div style={{ background:'#f9f9f9', borderRadius:'10px', padding:'15px', marginBottom:'20px', textAlign:'right' }}>
              <p style={{ fontWeight:'bold', color:'#333', marginBottom:'10px' }}>🌟 مع الاشتراك (99 درهم/شهر):</p>
              <p style={{ color:'#555', margin:'5px 0' }}>✅ إضافة حوالا بلا حد</p>
              <p style={{ color:'#555', margin:'5px 0' }}>✅ ظهور أكثر فالبحث</p>
              <p style={{ color:'#555', margin:'5px 0' }}>✅ شارة البائع الموثق ✓</p>
              <p style={{ color:'#555', margin:'5px 0' }}>✅ دعم مباشر ومستمر</p>
            </div>
            <button
              onClick={() => onNavigate('support')}
              style={{ width:'100%', padding:'15px', background:'#1a6b3c', color:'white', border:'none', borderRadius:'10px', fontSize:'18px', cursor:'pointer', fontWeight:'bold', marginBottom:'10px' }}
            >
              💬 تواصل معنا للاشتراك
            </button>
            <p style={{ color:'#999', fontSize:'13px' }}>سيتم تفعيل حسابك خلال أقل من ساعة إن شاء الله</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily:'Arial', direction:'rtl', minHeight:'100vh', background:'#f5f5f5' }}>

      <div style={{ background:'#1a6b3c', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ color:'white', margin:0, fontSize:'20px' }}>🐑 إضافة حولي</h2>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer' }}>رجوع</button>
      </div>

      {!abonnement && (
        <div style={{ background:'#fff3cd', padding:'10px 20px', textAlign:'center', fontSize:'14px', color:'#856404' }}>
          🐑 استعملتي <strong>{nbAnnonces}</strong> من <strong>{LIMITE_GRATUITE}</strong> إعلانات مجانية
        </div>
      )}
      {abonnement && (
        <div style={{ background:'#d4edda', padding:'10px 20px', textAlign:'center', fontSize:'14px', color:'#155724' }}>
          ✅ حسابك مشترك — إضافة بلا حد!
        </div>
      )}

      <div style={{ padding:'20px', maxWidth:'500px', margin:'0 auto' }}>

        {/* وصف الحولي */}
        <div style={{ marginBottom:'15px' }}>
          <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>وصف الحولي *</label>
          <input style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', boxSizing:'border-box' }} placeholder="مثال: حولي بلدي سمين" value={titre} onChange={e => setTitre(e.target.value)} />
        </div>

        {/* السلالة */}
        <div style={{ marginBottom:'15px' }}>
          <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>السلالة *</label>
          <input style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', boxSizing:'border-box' }} placeholder="مثال: بلدي، تيمحضيت، سردي..." value={race} onChange={e => setRace(e.target.value)} />
        </div>

        {/* الوزن والسن */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'15px' }}>
          <div style={{ flex:1 }}>
            <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>الوزن (كيلو) *</label>
            <input style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', boxSizing:'border-box' }} placeholder="40" type="number" value={poids} onChange={e => setPoids(e.target.value)} />
          </div>
          <div style={{ flex:1 }}>
            <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>السن (شهر) *</label>
            <input style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', boxSizing:'border-box' }} placeholder="12" type="number" value={age} onChange={e => setAge(e.target.value)} />
          </div>
        </div>

        {/* المرقد */}
        <div style={{ marginBottom:'15px' }}>
          <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>المرقد *</label>
          <input style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', boxSizing:'border-box' }} placeholder="مثال: الرباط، مراكش، فاس..." value={region} onChange={e => setRegion(e.target.value)} />
        </div>

        {/* الثمن */}
        <div style={{ marginBottom:'15px' }}>
          <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>الثمن (درهم) *</label>
          <input style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', boxSizing:'border-box' }} placeholder="2000" type="number" value={prix} onChange={e => setPrix(e.target.value)} />
        </div>

        {/* إمكانية التوصيل */}
        <div style={{ marginBottom:'15px', background:'white', borderRadius:'10px', padding:'15px', border:'1px solid #ddd' }}>
          <label style={{ display:'block', marginBottom:'10px', fontWeight:'bold', color:'#333' }}>🚚 إمكانية التوصيل *</label>
          <div style={{ display:'flex', gap:'10px' }}>
            <button
              type="button"
              onClick={() => setLivraison(true)}
              style={{
                flex:1, padding:'12px',
                background: livraison ? '#1a6b3c' : '#f0f0f0',
                color: livraison ? 'white' : '#333',
                border: livraison ? '2px solid #1a6b3c' : '2px solid #ddd',
                borderRadius:'8px', fontSize:'16px',
                cursor:'pointer', fontWeight:'bold'
              }}
            >
              ✅ نعم
            </button>
            <button
              type="button"
              onClick={() => setLivraison(false)}
              style={{
                flex:1, padding:'12px',
                background: !livraison ? '#f44336' : '#f0f0f0',
                color: !livraison ? 'white' : '#333',
                border: !livraison ? '2px solid #f44336' : '2px solid #ddd',
                borderRadius:'8px', fontSize:'16px',
                cursor:'pointer', fontWeight:'bold'
              }}
            >
              ❌ لا
            </button>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div style={{ marginBottom:'15px' }}>
          <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>معلومات إضافية</label>
          <textarea style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', minHeight:'100px', boxSizing:'border-box', resize:'vertical' }} placeholder="أي معلومات إضافية عن الحولي..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* الصورة */}
        <div style={{ marginBottom:'20px' }}>
          <label style={{ display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333' }}>صورة الحولي *</label>
          {photoUrl && (
            <img src={photoUrl} alt="الحولي" style={{ width:'100%', height:'200px', objectFit:'cover', borderRadius:'10px', marginBottom:'10px' }} />
          )}
          <input type="file" accept="image/*" onChange={e => { const file = e.target.files[0]; if (file) { setPhoto(file); setPhotoUrl(URL.createObjectURL(file)) } }} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'2px dashed #1a6b3c', fontSize:'16px', cursor:'pointer', boxSizing:'border-box' }} />
          <p style={{ color:'#999', fontSize:'12px', textAlign:'center', margin:'5px 0 0 0' }}>⚠️ الصور المخالفة للآداب ممنوعة وسيتم حذف الحساب</p>
        </div>

        {message && (
          <p style={{ textAlign:'center', color: message.includes('✅') ? 'green' : 'red', fontWeight:'bold' }}>{message}</p>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', padding:'15px', background:'#1a6b3c', color:'white', border:'none', borderRadius:'10px', fontSize:'18px', cursor:'pointer', fontWeight:'bold', marginBottom:'20px' }}>
          {loading ? '...' : '🐑 إضافة الحولي'}
        </button>

      </div>
    </div>
  )
}

export default AddListing