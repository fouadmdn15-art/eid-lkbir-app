import { useState } from 'react'
import { supabase } from '../config/supabase'

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

function Auth({ onBack }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [countryCode, setCountryCode] = useState('+212')
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
    // نحيدو أي رموز خاصة من الرقم (فراغات، شرطات، +)
    const cleanPhone = telephone.replace(/[^0-9]/g, '').replace(/^0+/, '')
    if (cleanPhone.length < 6) {
      setMessage('⚠️ رقم الهاتف غير صحيح!')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage('خطأ: ' + error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        nom,
        telephone: cleanPhone,
        country_code: countryCode,
        ville,
        type_compte: typeCompte
      })
    }
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

      {onBack && (
        <button
          onClick={onBack}
          style={{ position:'absolute', top:'20px', right:'20px', zIndex:10, background:'rgba(255,255,255,0.95)', color:'#1a6b3c', border:'none', padding:'10px 18px', borderRadius:'25px', fontSize:'14px', cursor:'pointer', fontWeight:'bold', boxShadow:'0 4px 12px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:'5px' }}
        >
          <span>→</span>
          <span>رجوع للرئيسية</span>
        </button>
      )}

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'400px' }}>

        <div style={{ textAlign:'center', marginBottom:'25px' }}>
          <h1 style={{ color:'white', fontSize:'32px', margin:'5px 0', textShadow:'2px 2px 4px rgba(0,0,0,0.5)' }}>
            عيد الكبير مبارك سعيد
          </h1>
          <p style={{ color:'#c8f5d8', margin:'15px 0 0 0', fontSize:'16px', fontStyle:'italic' }}>
            🌟 الرحبة جات حتى بين يديك 🌟
          </p>
        </div>

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

        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:'15px', padding:'25px', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>

          {!isLogin && <>
            <input
              style={{ padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right' }}
              placeholder="الاسم الكامل *"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />

            {/* اختيار البلد + الرقم */}
            <div>
              <label style={{ display:'block', marginBottom:'5px', fontSize:'13px', color:'#666', fontWeight:'bold' }}>
                📱 رقم الهاتف *
              </label>
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
                  style={{ flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', direction:'ltr' }}
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