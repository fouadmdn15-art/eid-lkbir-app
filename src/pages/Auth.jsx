import { useState } from 'react'
import { supabase } from '../config/supabase'

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [ville, setVille] = useState('')
  const [typeCompte, setTypeCompte] = useState('acheteur')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('⚠️ البريد الإلكتروني وكلمة السر إجباريين!')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setMessage('⚠️ خاصك تأكد الإيميل ديالك أولاً! شوف صندوق الوارد')
      } else {
        setMessage('⚠️ البريد أو كلمة السر غلط!')
      }
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    if (!nom || !telephone || !ville || !email || !password) {
      setMessage('⚠️ جميع الحقول إجبارية!')
      return
    }
    if (password.length < 6) {
      setMessage('⚠️ كلمة السر خاصها تكون 6 أحرف على الأقل!')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage('خطأ: ' + error.message)
      setLoading(false)
      return
    }
    // حفظ البروفيل
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        nom, telephone, ville,
        type_compte: typeCompte
      })
    }
    // إظهار رسالة التأكيد
    setEmailSent(true)
    setLoading(false)
  }

  // شاشة تأكيد الإيميل
  if (emailSent) {
    return (
      <div style={{
        minHeight:'100vh',
        backgroundImage:'url(/background.PNG)',
        backgroundSize:'cover',
        backgroundPosition:'center',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        padding:'20px',
        fontFamily:'Arial',
        direction:'rtl',
        position:'relative'
      }}>
        <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(26,107,60,0.45)' }} />
        <div style={{ position:'relative', zIndex:1, background:'white', borderRadius:'15px', padding:'35px', maxWidth:'400px', width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize:'60px', marginBottom:'15px' }}>📧</div>
          <h2 style={{ color:'#1a6b3c', marginBottom:'10px' }}>تأكد الإيميل ديالك!</h2>
          <p style={{ color:'#666', marginBottom:'5px', fontSize:'15px' }}>
            وصلك إيميل على:
          </p>
          <p style={{ color:'#1a6b3c', fontWeight:'bold', fontSize:'16px', marginBottom:'15px' }}>
            {email}
          </p>
          <p style={{ color:'#666', fontSize:'14px', marginBottom:'20px' }}>
            كليكي على اللينك فالإيميل باش تكمل التسجيل
          </p>
          <div style={{ background:'#f9f9f9', borderRadius:'10px', padding:'15px', marginBottom:'20px', textAlign:'right' }}>
            <p style={{ margin:'5px 0', color:'#555', fontSize:'13px' }}>📌 شوف صندوق الوارد (Inbox)</p>
            <p style={{ margin:'5px 0', color:'#555', fontSize:'13px' }}>📌 إلا ما لقيتيوش شوف Spam</p>
            <p style={{ margin:'5px 0', color:'#555', fontSize:'13px' }}>📌 الإيميل كيجي من Supabase</p>
          </div>
          <button
            onClick={() => { setEmailSent(false); setIsLogin(true) }}
            style={{ width:'100%', padding:'14px', background:'#1a6b3c', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', cursor:'pointer', fontWeight:'bold' }}
          >
            🚪 دخول بعد التأكيد
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:'100vh',
      backgroundImage:'url(/background.PNG)',
      backgroundSize:'cover',
      backgroundPosition:'center',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      padding:'20px',
      fontFamily:'Arial',
      direction:'rtl',
      position:'relative'
    }}>
      <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(26,107,60,0.45)' }} />

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'400px' }}>

        {/* اللوغو */}
        <div style={{ textAlign:'center', marginBottom:'25px' }}>
          <h1 style={{ color:'white', fontSize:'32px', margin:'5px 0', textShadow:'2px 2px 4px rgba(0,0,0,0.5)' }}>
            عيد الكبير مبارك سعيد
          </h1>
          <p style={{ color:'#c8f5d8', margin:'15px 0 0 0', fontSize:'16px', fontStyle:'italic' }}>
            🌟 الرحبة جات حتى بين يديك 🌟
          </p>
        </div>

        {/* تابات */}
        <div style={{ display:'flex', marginBottom:'20px', background:'rgba(255,255,255,0.2)', borderRadius:'10px', padding:'4px' }}>
          <button
            onClick={() => { setIsLogin(true); setMessage('') }}
            style={{ flex:1, padding:'10px', border:'none', background: isLogin ? 'white' : 'transparent', color: isLogin ? '#1a6b3c' : 'white', borderRadius:'8px', cursor:'pointer', fontSize:'16px', fontWeight: isLogin ? 'bold' : 'normal' }}
          >
            دخول
          </button>
          <button
            onClick={() => { setIsLogin(false); setMessage('') }}
            style={{ flex:1, padding:'10px', border:'none', background: !isLogin ? 'white' : 'transparent', color: !isLogin ? '#1a6b3c' : 'white', borderRadius:'8px', cursor:'pointer', fontSize:'16px', fontWeight: !isLogin ? 'bold' : 'normal' }}
          >
            حساب جديد
          </button>
        </div>

        {/* الفورم */}
        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:'15px', padding:'25px', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>

          {!isLogin && <>
            <input
              style={{ padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right' }}
              placeholder="الاسم الكامل *"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
            <input
              style={{ padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right' }}
              placeholder="رقم الهاتف *"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
            />
            <input
              style={{ padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right' }}
              placeholder="المدينة *"
              value={ville}
              onChange={e => setVille(e.target.value)}
            />
            <select
              style={{ padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px' }}
              value={typeCompte}
              onChange={e => setTypeCompte(e.target.value)}
            >
              <option value="acheteur">مشتري</option>
              <option value="vendeur">بائع</option>
            </select>
          </>}

          <input
            style={{ padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right' }}
            placeholder="البريد الإلكتروني *"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            style={{ padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right' }}
            placeholder="كلمة السر *"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {message && (
            <p style={{ color: message.includes('✅') ? 'green' : 'red', textAlign:'center', fontWeight:'bold', margin:0 }}>
              {message}
            </p>
          )}

          <button
            onClick={isLogin ? handleLogin : handleSignup}
            disabled={loading}
            style={{ padding:'14px', background:'linear-gradient(135deg,#1a6b3c,#2d9e5f)', color:'white', border:'none', borderRadius:'8px', fontSize:'18px', cursor:'pointer', fontWeight:'bold', boxShadow:'0 4px 15px rgba(26,107,60,0.4)' }}
          >
            {loading ? '...' : isLogin ? '🚪 دخول' : '✨ إنشاء حساب'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth