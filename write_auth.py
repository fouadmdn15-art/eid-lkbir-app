content = """\
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
  const [isError, setIsError] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage('\u062e\u0637\u0623: ' + error.message)
      setIsError(true)
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    if (!nom || !telephone || !ville) {
      setMessage('\u064a\u0631\u062c\u0649 \u0645\u0644\u0621 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644')
      setIsError(true)
      return
    }
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage('\u062e\u0637\u0623: ' + error.message)
      setIsError(true)
      setLoading(false)
      return
    }
    await supabase.from('profiles').insert({
      id: data.user.id,
      nom,
      telephone,
      ville,
      type_compte: typeCompte
    })
    setMessage('\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062d\u0633\u0627\u0628 \u0628\u0646\u062c\u0627\u062d\u060c \u062a\u062d\u0642\u0642 \u0645\u0646 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a')
    setIsError(false)
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.logo}>
        <span style={styles.logoEmoji}>\U0001f411</span>
        <h1 style={styles.logoText}>\u0639\u064a\u062f \u0627\u0644\u0643\u0628\u064a\u0631</h1>
        <p style={styles.logoSub}>\u0633\u0648\u0642 \u0627\u0644\u062d\u0648\u0627\u0644\u064a</p>
      </div>

      <div style={styles.tabs}>
        <button
          style={isLogin ? styles.tabActive : styles.tab}
          onClick={() => { setIsLogin(true); setMessage('') }}
        >
          \u062f\u062e\u0648\u0644
        </button>
        <button
          style={!isLogin ? styles.tabActive : styles.tab}
          onClick={() => { setIsLogin(false); setMessage('') }}
        >
          \u062d\u0633\u0627\u0628 \u062c\u062f\u064a\u062f
        </button>
      </div>

      <div style={styles.form}>
        {!isLogin && (
          <>
            <input
              style={styles.input}
              placeholder="\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="\u0627\u0644\u0645\u062f\u064a\u0646\u0629"
              value={ville}
              onChange={e => setVille(e.target.value)}
            />
            <select
              style={styles.input}
              value={typeCompte}
              onChange={e => setTypeCompte(e.target.value)}
            >
              <option value="acheteur">\U0001f6d2 \u0645\u0634\u062a\u0631\u064a</option>
              <option value="vendeur">\U0001f411 \u0628\u0627\u0626\u0639</option>
            </select>
          </>
        )}

        <input
          style={styles.input}
          placeholder="\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="\u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {message && (
          <p style={{ ...styles.message, color: isError ? '#e53e3e' : '#276749' }}>
            {message}
          </p>
        )}

        <button
          style={loading ? styles.buttonDisabled : styles.button}
          onClick={isLogin ? handleLogin : handleSignup}
          disabled={loading}
        >
          {loading ? '...' : isLogin ? '\u062f\u062e\u0648\u0644' : '\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a6b3c, #2d9e5f)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    direction: 'rtl'
  },
  logo: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  logoEmoji: { fontSize: '70px' },
  logoText: {
    color: 'white',
    fontSize: '32px',
    margin: '8px 0',
    fontWeight: 'bold'
  },
  logoSub: {
    color: '#c8f5d8',
    fontSize: '18px',
    margin: 0
  },
  tabs: {
    display: 'flex',
    marginBottom: '20px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '12px',
    padding: '4px'
  },
  tab: {
    padding: '10px 35px',
    border: 'none',
    background: 'transparent',
    color: 'white',
    cursor: 'pointer',
    borderRadius: '10px',
    fontSize: '16px'
  },
  tabActive: {
    padding: '10px 35px',
    border: 'none',
    background: 'white',
    color: '#1a6b3c',
    cursor: 'pointer',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  form: {
    background: 'white',
    borderRadius: '18px',
    padding: '28px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  input: {
    padding: '13px 15px',
    borderRadius: '10px',
    border: '1.5px solid #ddd',
    fontSize: '16px',
    textAlign: 'right',
    direction: 'rtl',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  button: {
    padding: '14px',
    background: 'linear-gradient(135deg, #1a6b3c, #2d9e5f)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '4px'
  },
  buttonDisabled: {
    padding: '14px',
    background: '#aaa',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    cursor: 'not-allowed',
    fontWeight: 'bold',
    marginTop: '4px'
  },
  message: {
    textAlign: 'center',
    fontSize: '14px',
    margin: '0'
  }
}

export default Auth
"""

with open('c:/Users/Fouad/Desktop/eid-lkbir-app/src/pages/Auth.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
