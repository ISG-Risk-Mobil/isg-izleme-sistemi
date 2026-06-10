import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, User, LogOut, ShieldCheck, Cpu, Users } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import io from 'socket.io-client';
import ProfilePage from './ProfilePage';

export default function Dashboard({ role, onLogout, onBack }) {
  const [grafikVerisi, setGrafikVerisi] = useState([]);
  const [alarmlar, setAlarmlar] = useState([]);
  const [kullaniciRolu] = useState(role || localStorage.getItem('role') || 'user');
  const [gosterimModu, setGosterimModu] = useState('DASHBOARD');
  // Dashboard.jsx en üstüne ekleyin
const [kullaniciListesi, setKullaniciListesi] = useState([]);
const [seciliKullanici, setSeciliKullanici] = useState(null);

  // Personel - Yönetici ayrımı için tanımlama
  const isYonetici = kullaniciRolu === 'admin' || kullaniciRolu === 'yönetici';

  const styles = {
    container: { 
      padding: '24px', 
      backgroundColor: '#0f172a', 
      height: '100vh', 
      overflowY: 'auto', 
      color: '#f8fafc', 
      fontFamily: 'Inter, sans-serif' 
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' },
    card: { backgroundColor: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' },
    title: { fontSize: '14px', color: '#94a3b8', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
    profileBtn: { background: '#1e293b', border: '1px solid #f59e0b', color: '#f59e0b', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }
  };

  useEffect(() => {
    const soket = io('http://localhost:5000');
    
    soket.on('sensor-guncelleme', (yeniVeri) => {
      const risk = yeniVeri.sensorData?.magnitude || 0;
      setGrafikVerisi(onceki => [...onceki.slice(-19), { zaman: new Date().toLocaleTimeString().slice(0, 5), risk: risk }]);
    });
    
    soket.on('new-alarm', (yeniAlarm) => {
      setAlarmlar(onceki => [yeniAlarm, ...onceki].slice(0, 5));
    });
    
    return () => soket.disconnect();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout(); else window.location.reload();
  };

  if (gosterimModu === 'PROFILE') {
    return (
      <ProfilePage 
        user={{ 
          name: localStorage.getItem('userName') || 'Kullanıcı', 
          email: localStorage.getItem('userEmail') || 'Email bulunamadı', 
          role: kullaniciRolu, 
          department: localStorage.getItem('userDept') || 'Genel' 
        }} 
        // Burada Dashboard'un aldığı onBack fonksiyonunu ProfilePage'e iletiyoruz
        geriDon={() => setGosterimModu('DASHBOARD')} 
      />
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>VisionGuard <span style={{ color: '#f59e0b' }}>Pro</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button style={styles.profileBtn} onClick={() => setGosterimModu('PROFILE')}>
            <User size={16}/> Profilim
          </button>
          <button style={{ ...styles.profileBtn, borderColor: '#ef4444', color: '#ef4444' }} onClick={handleLogout}>
            <LogOut size={16}/> Çıkış
          </button>
        </div>
      </header>

      <div style={styles.grid}>
        
        {/* YÖNETİCİYE ÖZEL BİLGİLENDİRME KARTI */}
        {isYonetici && (
          <div style={{ ...styles.card, gridColumn: 'span 12', border: '1px solid #f59e0b' }}>
            <h3 style={{ ...styles.title, color: '#f59e0b' }}><Users size={16}/> Yönetici Kontrol Paneli</h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1' }}>Tüm fabrika sahası ve işçi güvenlik verileri anlık olarak izleniyor.</p>
          </div>
        )}

        <div style={{ ...styles.card, gridColumn: 'span 8', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <Cpu size={48} style={{ marginBottom: '10px' }} />
                <p>{isYonetici ? "Fabrika genel sistem analizi aktif." : "Kişisel çalışma verileri izleniyor."}</p>
            </div>
        </div>

        {/* Kritik Bildirimler - Role göre başlık değişimi */}
        <div style={{ ...styles.card, gridColumn: 'span 4' }}>
          <h3 style={styles.title}>
            <AlertTriangle size={16}/> {isYonetici ? 'Fabrika Genel Alarmları' : 'Kişisel Bildirimlerim'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alarmlar.length === 0 ? <p style={{color:'#64748b', fontSize:'13px'}}>Aktif alarm yok.</p> : alarmlar.map((a, i) => (
              <div key={i} style={{ padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '13px', borderLeft: '3px solid #ef4444' }}>
                {a.description}
              </div>
            ))}
          </div>
        </div>

        {/* Ekipman Durum Paneli */}
        <div style={{ ...styles.card, gridColumn: 'span 12' }}>
          <h3 style={styles.title}><ShieldCheck size={16}/> {isYonetici ? 'Fabrika Genel Ekipman Durumu' : 'Kişisel Ekipman Tespit Durumu'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '10px' }}>
            {[
              { label: 'Baret', status: 'Sistem Bekleniyor', color: '#94a3b8' },
              { label: 'İş Yeleği', status: 'Sistem Bekleniyor', color: '#94a3b8' },
              { label: 'Eldiven', status: 'Sistem Bekleniyor', color: '#94a3b8' }
            ].map((item, index) => (
              <div key={index} style={{ padding: '15px', backgroundColor: '#0f172a', borderRadius: '10px', border: `1px solid ${item.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
                <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: `${item.color}20`, color: item.color }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Analiz Grafiği */}
        <div style={{ ...styles.card, gridColumn: 'span 12' }}>
          <h3 style={styles.title}><Activity size={16}/> {isYonetici ? 'Fabrika Genel Risk Analizi' : 'Canlı İvme & Risk Analizi'}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={grafikVerisi}>
              <XAxis dataKey="zaman" stroke="#94a3b8" />
              <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
              <Line type="monotone" dataKey="risk" stroke="#f59e0b" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} //değişiklikleri bu koda ekle