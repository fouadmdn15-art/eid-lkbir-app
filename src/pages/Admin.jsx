import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

const ADMIN_EMAIL = 'fouadmdn15@gmail.com'

function Admin({ session, onBack }) {
  const [activeTab, setActiveTab] = useState('messages')
  const [users, setUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [unreadByUser, setUnreadByUser] = useState({})
  const [actionMessage, setActionMessage] = useState('')
  const [deletingUserId, setDeletingUserId] = useState(null)

  if (session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div style={{ textAlign:'center', padding:'50px', fontFamily:'Arial' }}>
        <h2>⛔ ما عندكش صلاحية</h2>
        <button onClick={onBack} style={{ padding:'10px 20px', background:'#1a6b3c', color:'white', border:'none', borderRadius:'8px', cursor:'pointer' }}>رجوع</button>
      </div>
    )
  }

  // جيب المستخدمين ديال المحادثات
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('user_id, from_admin, read, profiles(id, nom, telephone)')
        .order('created_at', { ascending: false })

      if (data) {
        const unread = {}
        const unique = []
        const seen = new Set()
        data.forEach(item => {
          if (!item.from_admin && !item.read) {
            unread[item.user_id] = (unread[item.user_id] || 0) + 1
          }
          if (!seen.has(item.user_id)) {
            seen.add(item.user_id)
            unique.push(item)
          }
        })
        setUnreadByUser(unread)
        setUsers(unique)
      }
      setLoading(false)
    }
    fetchUsers()

    const channel = supabase
      .channel('admin-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, () => {
        fetchUsers()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // جيب كل المستخدمين
  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setAllUsers(data)
    if (error) console.error('Error fetching users:', error)
  }

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchMessages = async (userId) => {
    setSelectedUser(userId)
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)

    await supabase
      .from('support_messages')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('from_admin', false)

    setUnreadByUser(prev => ({ ...prev, [userId]: 0 }))

    supabase
      .channel('admin-chat-' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'support_messages',
        filter: `user_id=eq.${userId}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
  }

  const handleReply = async () => {
    if (!newMessage.trim()) return
    await supabase.from('support_messages').insert({
      user_id: selectedUser,
      message: newMessage,
      from_admin: true,
      read: false
    })
    setNewMessage('')
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', selectedUser)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  // تفعيل/إلغاء الاشتراك
  const handleToggleAbonnement = async (userId, currentStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ abonnement: !currentStatus })
      .eq('id', userId)
    if (!error) {
      setAllUsers(allUsers.map(u =>
        u.id === userId ? { ...u, abonnement: !currentStatus } : u
      ))
      setActionMessage(currentStatus ? '✅ تم إلغاء الاشتراك' : '✅ تم تفعيل الاشتراك Pro')
      setTimeout(() => setActionMessage(''), 3000)
    } else {
      setActionMessage('⚠️ خطأ: ' + error.message)
      setTimeout(() => setActionMessage(''), 5000)
    }
  }

  // 🆕 حذف حساب كامل (يستعمل الـ function الآمنة فـ Supabase)
  const handleDeleteUser = async (userId, nom) => {
    const confirmMsg = `واش متأكد بغيتي تحذف حساب "${nom || 'بدون اسم'}"؟\n\n⚠️ هاد العملية ما يمكن التراجع عنها!\n\nغادي يتمسح كاع:\n• البروفيل\n• الإعلانات\n• الرسائل\n• الإيميل من قاعدة البيانات`

    if (!window.confirm(confirmMsg)) return

    // ما نخليش الأدمين يحذف راسو!
    if (userId === session.user.id) {
      setActionMessage('⚠️ ما تقدرش تحذف الحساب ديالك!')
      setTimeout(() => setActionMessage(''), 5000)
      return
    }

    setDeletingUserId(userId)
    setActionMessage('🔄 جاري الحذف...')

    try {
      // نستعمل الـ function الآمنة اللي درنا فـ Supabase
      const { data, error } = await supabase.rpc('delete_user_completely', {
        user_id_to_delete: userId
      })

      if (error) {
        setActionMessage('⚠️ خطأ: ' + error.message)
        setTimeout(() => setActionMessage(''), 7000)
        return
      }

      // نشوفو إيلا الـ function رجعت success
      if (data && data.success === false) {
        setActionMessage('⚠️ خطأ: ' + (data.error || 'فشل الحذف'))
        setTimeout(() => setActionMessage(''), 7000)
        return
      }

      // الحذف نجح!
      setAllUsers(allUsers.filter(u => u.id !== userId))
      setActionMessage(`✅ تم حذف الحساب بنجاح! (${data?.deleted_email || nom})`)
      setTimeout(() => setActionMessage(''), 5000)

      // Refresh قائمة المستخدمين باش نتأكدو
      fetchAllUsers()

    } catch (err) {
      setActionMessage('⚠️ خطأ غير متوقع: ' + err.message)
      setTimeout(() => setActionMessage(''), 7000)
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <div style={{ fontFamily:'Arial', direction:'rtl', height:'100vh', display:'flex', flexDirection:'column' }}>

      {/* الهيدر */}
      <div style={{ background:'#1a3a6b', padding:'15px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ color:'white', margin:0 }}>🛠️ لوحة التحكم</h2>
        <div style={{ display:'flex', gap:'10px' }}>
          <a
            href="https://supabase.com/dashboard/project/dkcruxuitukexjywfyct/auth/users"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background:'#3ecf8e', color:'white', textDecoration:'none', padding:'8px 15px', borderRadius:'8px', fontSize:'13px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px' }}
          >
            🔗 Supabase Users
          </a>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer' }}>رجوع</button>
        </div>
      </div>

      {/* التابات */}
      <div style={{ display:'flex', background:'white', borderBottom:'2px solid #eee' }}>
        <button
          onClick={() => setActiveTab('messages')}
          style={{ flex:1, padding:'15px', border:'none', background: activeTab === 'messages' ? '#1a3a6b' : 'white', color: activeTab === 'messages' ? 'white' : '#333', cursor:'pointer', fontSize:'15px', fontWeight:'bold' }}
        >
          💬 المحادثات ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{ flex:1, padding:'15px', border:'none', background: activeTab === 'users' ? '#1a3a6b' : 'white', color: activeTab === 'users' ? 'white' : '#333', cursor:'pointer', fontSize:'15px', fontWeight:'bold' }}
        >
          👥 المستخدمين ({allUsers.length})
        </button>
      </div>

      {/* رسالة الإجراء */}
      {actionMessage && (
        <div style={{
          background: actionMessage.includes('✅') ? '#d4edda' : actionMessage.includes('🔄') ? '#fff3cd' : '#f8d7da',
          color: actionMessage.includes('✅') ? '#155724' : actionMessage.includes('🔄') ? '#856404' : '#721c24',
          padding:'12px',
          textAlign:'center',
          fontWeight:'bold',
          borderBottom:'1px solid rgba(0,0,0,0.1)'
        }}>
          {actionMessage}
        </div>
      )}

      {/* تاب المحادثات */}
      {activeTab === 'messages' && (
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* قائمة المستخدمين */}
          <div style={{ width:'35%', background:'white', borderLeft:'1px solid #eee', overflowY:'auto' }}>
            {loading ? (
              <p style={{ textAlign:'center', padding:'20px', color:'#999' }}>جاري التحميل...</p>
            ) : users.length === 0 ? (
              <p style={{ textAlign:'center', padding:'20px', color:'#999' }}>ما كاين حتى رسالة</p>
            ) : (
              users.map(user => (
                <div
                  key={user.user_id}
                  onClick={() => fetchMessages(user.user_id)}
                  style={{ padding:'15px', borderBottom:'1px solid #eee', cursor:'pointer', background: selectedUser === user.user_id ? '#e8f5e9' : 'white', position:'relative' }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ position:'relative' }}>
                      <div style={{ fontSize:'30px' }}>👤</div>
                      {unreadByUser[user.user_id] > 0 && (
                        <span style={{ position:'absolute', top:'-5px', left:'-5px', background:'red', color:'white', borderRadius:'50%', width:'18px', height:'18px', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' }}>
                          {unreadByUser[user.user_id]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:'bold', color:'#333' }}>{user.profiles?.nom || 'مستخدم'}</p>
                      <p style={{ margin:0, fontSize:'12px', color:'#999' }}>{user.profiles?.telephone || ''}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* المحادثة */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {!selectedUser ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#999' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'50px' }}>💬</div>
                  <p>اختار محادثة من اليمين</p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex:1, overflowY:'auto', padding:'15px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{ display:'flex', justifyContent: msg.from_admin ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        padding:'12px 15px',
                        borderRadius: msg.from_admin ? '15px 15px 0 15px' : '15px 15px 15px 0',
                        maxWidth:'75%',
                        background: msg.from_admin ? '#1a3a6b' : 'white',
                        color: msg.from_admin ? 'white' : '#333',
                        boxShadow:'0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <p style={{ margin:0, fontSize:'14px' }}>{msg.message}</p>
                        <p style={{ margin:'5px 0 0 0', fontSize:'11px', color: msg.from_admin ? 'rgba(255,255,255,0.7)' : '#999' }}>
                          {msg.from_admin ? 'أنت' : 'المستخدم'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'15px', background:'white', borderTop:'1px solid #eee', display:'flex', gap:'10px' }}>
                  <input
                    style={{ flex:1, padding:'12px', borderRadius:'25px', border:'1px solid #ddd', fontSize:'16px', textAlign:'right', outline:'none' }}
                    placeholder="اكتب جوابك..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleReply()}
                  />
                  <button onClick={handleReply} style={{ background:'#1a3a6b', color:'white', border:'none', borderRadius:'50%', width:'48px', height:'48px', fontSize:'20px', cursor:'pointer', flexShrink:0 }}>✉️</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* تاب المستخدمين */}
      {activeTab === 'users' && (
        <div style={{ flex:1, overflowY:'auto', padding:'15px' }}>
          {allUsers.length === 0 ? (
            <p style={{ textAlign:'center', color:'#999' }}>ما كاين حتى مستخدم</p>
          ) : (
            allUsers.map(user => {
              const isAdmin = user.id === session.user.id
              const isDeleting = deletingUserId === user.id

              return (
                <div key={user.id} style={{ background:'white', borderRadius:'12px', padding:'15px', marginBottom:'15px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', opacity: isDeleting ? 0.5 : 1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'24px' }}>👤</span>
                        <strong style={{ fontSize:'16px' }}>{user.nom || 'بدون اسم'}</strong>
                        {isAdmin && (
                          <span style={{ background:'#1a3a6b', color:'white', padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'bold' }}>🛠️ أدمين</span>
                        )}
                        {user.abonnement && (
                          <span style={{ background:'#ffd700', color:'#333', padding:'2px 8px', borderRadius:'10px', fontSize:'12px', fontWeight:'bold' }}>⭐ Pro</span>
                        )}
                      </div>
                      <p style={{ margin:'3px 0', color:'#666', fontSize:'13px' }}>📱 {user.country_code || '+212'} {user.telephone || 'بدون هاتف'}</p>
                      <p style={{ margin:'3px 0', color:'#666', fontSize:'13px' }}>📍 {user.ville || 'بدون مدينة'}</p>
                      <p style={{ margin:'3px 0', color:'#666', fontSize:'13px' }}>
                        🏷️ {user.type_compte === 'vendeur' ? 'بائع' : 'مشتري'}
                      </p>
                    </div>
                  </div>

                  {/* الأزرار */}
                  {!isAdmin && (
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button
                        onClick={() => handleToggleAbonnement(user.id, user.abonnement)}
                        disabled={isDeleting}
                        style={{ flex:1, padding:'10px', background: user.abonnement ? '#ff9800' : '#1a3a6b', color:'white', border:'none', borderRadius:'8px', fontSize:'13px', cursor: isDeleting ? 'not-allowed' : 'pointer', fontWeight:'bold' }}
                      >
                        {user.abonnement ? '❌ إلغاء Pro' : '⭐ تفعيل Pro'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.nom)}
                        disabled={isDeleting}
                        style={{ flex:1, padding:'10px', background: isDeleting ? '#999' : '#f44336', color:'white', border:'none', borderRadius:'8px', fontSize:'13px', cursor: isDeleting ? 'not-allowed' : 'pointer', fontWeight:'bold' }}
                      >
                        {isDeleting ? '🔄 جاري الحذف...' : '🗑️ حذف الحساب'}
                      </button>
                    </div>
                  )}

                  {isAdmin && (
                    <p style={{ textAlign:'center', color:'#999', fontSize:'12px', margin:'10px 0 0 0', fontStyle:'italic' }}>
                      💡 الحساب ديال الأدمين ما يقدرش يتحذف
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Admin