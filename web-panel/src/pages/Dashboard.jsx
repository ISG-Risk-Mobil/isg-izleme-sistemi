import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Activity, User, LogOut, ShieldCheck, Camera, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import io from 'socket.io-client';
import ProfilePage from './ProfilePage';

export default function Dashboard({ role, onLogout }) {
  const [grafikVerisi, setGrafikVerisi] = useState([]);
  const [alarmlar, setAlarmlar] = useState([]);
  const [kullaniciRolu] = useState(role || localStorage.getItem('role') || 'user');
  const [gosterimModu, setGosterimModu] = useState('DASHBOARD');
  
  const videoRef = useRef(null);

  const styles = {
    container: { padding: '24px', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' },
    card: { backgroundColor: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' },
    title: { fontSize: '14px', color: '#94a3b8', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
    profileBtn: { background: '#1e293b', border: '1px solid #f59e0b', color: '#f59e0b', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }
  };

  // Kamera Başlatma
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(err => console.error("Kamera hatası:", err));
    }
  }, []);

  useEffect(() => {
    const soket = io('http://localhost:5000');
    soket.on('sensor-guncelleme', (yeniVeri) => {
      const risk = yeniVeri.accelerometer?.magnitude || 0;
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
          role: localStorage.getItem('role') || kullaniciRolu, 
          department: localStorage.getItem('userDept') || 'Genel' 
        }} 
        onBack={() => setGosterimModu('DASHBOARD')} 
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
        {/* Canlı Kamera Akışı */}
        <div style={{ ...styles.card, gridColumn: 'span 8', position: 'relative' }}>
          <h3 style={styles.title}><Camera size={16}/> Canlı Saha Analizi (AI Active)</h3>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '12px', border: '1px solid #334155' }} />
          <div style={{ position: 'absolute', top: '90px', left: '40px', border: '2px solid #22c55e', width: '150px', height: '250px', borderRadius: '4px', pointerEvents: 'none' }}>
            <span style={{ backgroundColor: '#22c55e', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>BARET TESPİT EDİLDİ</span>
          </div>
        </div>

        {/* Kritik Bildirimler */}
        <div style={{ ...styles.card, gridColumn: 'span 4' }}>
          <h3 style={styles.title}><AlertTriangle size={16}/> Kritik Bildirimler</h3>
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
          <h3 style={styles.title}><ShieldCheck size={16}/> Canlı Ekipman Tespit Durumu</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '10px' }}>
            {[
              { label: 'Baret', status: 'Tespit Edildi', color: '#22c55e' },
              { label: 'İş Yeleği', status: 'Tespit Edildi', color: '#22c55e' },
              { label: 'Eldiven', status: 'Eksik', color: '#ef4444' }
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
          <h3 style={styles.title}><Activity size={16}/> Canlı İvme & Risk Analizi</h3>
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
}