import { useState, useEffect, useRef } from 'react'
import { supabase } from '../config/supabase'

function Support({ session, onBack }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const fetchAndMarkRead = async () => {
      // جيب الرسائل
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
      setLoading(false)

      // علم رسائل الأدمين كمقروءة
      await supabase
        .from('support_messages')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('from_admin', true)
        .eq('read', false)
    }
    fetchAndMarkRead()

    // كتسمع للرسائل الجديدة
    const channel = supabase
      .channel('support-' + session.user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `user_id=eq.${session.user.id}`
      }, async (payload) => {
        setMessages(prev => [...prev, payload.new])
        // إذا جات رسالة من الأدمين علمها مقروءة فالحال
        if (payload.new.from_admin) {
          await supabase
            .from('support_messages')
            .update({ read: true })
            .eq('id', payload.new.id)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session])

  // scroll للأسفل تلقائياً
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    const msgToSend = newMessage
    setNewMessage('')

    // نزيدو الرسالة فالشاشة مباشرة
    const tempMsg = {
      id: Date.now(),
      message: msgToSend,
      from_admin: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    await supabase
      .from('support_messages')
      .insert({
        user_id: session.user.id,
        message: msgToSend,
        from_admin: false,
        read: false
      })
  }

  return (
    <div style={{ fontFamily:'Arial', direction:'rtl', height:'100vh', display:'flex', flexDirection:'column', background:'#f5f5f5' }}>

      {/* الهيدر */}
      <div style={{ background:'#1a6b3c', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2 style={{ color:'white', margin:0, fontSize:'18px' }}>💬 تواصل معنا</h2>
          <p style={{ color:'#c8f5d8', margin:0, fontSize:'12px' }}>فريق الدعم متاح لمساعدتك</p>
        </div>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer' }}>
          رجوع
        </button>
      </div>

      {/* الرسائل */}
      <div style={{ flex:1, overflowY:'auto', padding:'15px', display:'flex', flexDirection:'column', gap:'10px' }}>

        {/* رسالة ترحيب دايمة */}
        <div style={{ display:'flex', justifyContent:'flex-start' }}>
          <div style={{ background:'white', padding:'12px 15px', borderRadius:'15px 15px 15px 0', maxWidth:'75%', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ margin:0, fontSize:'14px' }}>🐑 مرحبا! كيفاش نقدر نعاونك؟</p>
            <p style={{ margin:'5px 0 0 0', fontSize:'11px', color:'#999' }}>فريق سوق العيد</p>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:'#999' }}>جاري التحميل...</p>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id}>
              {/* رسالة عادية */}
              <div style={{ display:'flex', justifyContent: msg.from_admin ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  padding:'12px 15px',
                  borderRadius: msg.from_admin ? '15px 15px 15px 0' : '15px 15px 0 15px',
                  maxWidth:'75%',
                  background: msg.from_admin ? 'white' : '#1a6b3c',
                  color: msg.from_admin ? '#333' : 'white',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ margin:0, fontSize:'14px' }}>{msg.message}</p>
                  <p style={{ margin:'5px 0 0 0', fontSize:'11px', color: msg.from_admin ? '#999' : 'rgba(255,255,255,0.7)' }}>
                    {msg.from_admin ? 'فريق سوق العيد' : 'أنت'}
                  </p>
                </div>
              </div>

              {/* رسالة الشكر بعد أول رسالة من المستخدم */}
              {!msg.from_admin && index === messages.findIndex(m => !m.from_admin) && (
                <div style={{ display:'flex', justifyContent:'flex-start', marginTop:'10px' }}>
                  <div style={{ background:'white', padding:'12px 15px', borderRadius:'15px 15px 15px 0', maxWidth:'75%', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin:0, fontSize:'14px' }}>
                      شكراً على تواصلكم معنا 🙏 فريقنا غادي يجاوبكم فأقرب وقت ممكن إن شاء الله
                    </p>
                    <p style={{ margin:'5px 0 0 0', fontSize:'11px', color:'#999' }}>فريق سوق العيد</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* خانة الكتابة */}
      <div style={{ padding:'15px', background:'white', borderTop:'1px solid #eee', display:'flex', gap:'10px' }}>
        <input
          style={{ flex:1, padding:'12px', borderRadius:'25px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', outline:'none' }}
          placeholder="اكتب رسالتك..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          style={{ background:'#1a6b3c', color:'white', border:'none', borderRadius:'50%', width:'48px', height:'48px', fontSize:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
        >
          ✉️
        </button>
      </div>
    </div>
  )
}

export default Support