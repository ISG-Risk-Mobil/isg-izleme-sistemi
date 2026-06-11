import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, User, LogOut, ShieldCheck, Cpu, Users, BarChart2, FileText, LayoutDashboard, ChevronRight, Crown, UserX } from 'lucide-react';
import { XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import io from 'socket.io-client';
import ProfilePage from './ProfilePage';

function getRoleFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'worker';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'worker';
  } catch {
    return 'worker';
  }
}

export default function Dashboard({ role, onLogout, onBack }) {
  const [grafikVerisi, setGrafikVerisi] = useState([]);
  const [alarmlar, setAlarmlar] = useState([]);
  const [gosterimModu, setGosterimModu] = useState('DASHBOARD');
  const [aktifSekme, setAktifSekme] = useState('anaDashboard');
  const [kullaniciListesi, setKullaniciListesi] = useState([]);
  const [kullaniciYukleniyor, setKullaniciYukleniyor] = useState(false);
  const [rolDegistiriliyor, setRolDegistiriliyor] = useState(null); // hangi kullanıcının rolü değişiyor

  const kullaniciRolu = getRoleFromToken();
  const mevcutKullaniciId = localStorage.getItem('userId');
  const isAdmin = kullaniciRolu === 'admin';

  const sekmeler = [
    { id: 'anaDashboard', label: 'Ana Panel', icon: <LayoutDashboard size={15}/> },
    { id: 'analizler',    label: 'Detaylı Analiz', icon: <BarChart2 size={15}/> },
    ...(isAdmin ? [{ id: 'yonetim', label: 'Yönetim Paneli', icon: <Users size={15}/> }] : []),
    { id: 'raporlar',    label: 'Raporlar', icon: <FileText size={15}/> },
  ];

  const styles = {
    container: { padding: '24px', backgroundColor: '#0f172a', minHeight: '100vh', overflowY: 'auto', color: '#f8fafc', fontFamily: 'Inter, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' },
    card: { backgroundColor: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' },
    title: { fontSize: '13px', color: '#94a3b8', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    profileBtn: { background: '#1e293b', border: '1px solid #f59e0b', color: '#f59e0b', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' },
    sekmeBar: { display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#1e293b', padding: '6px', borderRadius: '12px', border: '1px solid #334155' },
    sekmeBtn: (aktif) => ({ flex: 1, padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: aktif ? '600' : '400', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s', backgroundColor: aktif ? '#f59e0b' : 'transparent', color: aktif ? '#0f172a' : '#94a3b8' }),
    statKart: (renk) => ({ backgroundColor: '#0f172a', borderRadius: '12px', padding: '16px', border: `1px solid ${renk}40`, display: 'flex', flexDirection: 'column', gap: '6px' }),
    badge: (renk) => ({ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: `${renk}20`, color: renk, fontWeight: '600' }),
    rolBtn: (tip) => ({
      padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
      display: 'flex', alignItems: 'center', gap: '4px',
      backgroundColor: tip === 'admin' ? '#f59e0b20' : '#ef444420',
      color: tip === 'admin' ? '#f59e0b' : '#ef4444',
    })
  };

  // Kullanıcı listesini çek
  const fetchKullanicilar = async () => {
    if (!isAdmin) return;
    setKullaniciYukleniyor(true);
    try {
      const res = await fetch('http://localhost:5000/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setKullaniciListesi(data.users);
      else if (Array.isArray(data)) setKullaniciListesi(data);
    } catch (err) {
      console.error('Kullanıcılar çekilemedi:', err);
    } finally {
      setKullaniciYukleniyor(false);
    }
  };

  useEffect(() => {
    fetchKullanicilar();
  }, [isAdmin]);

  // Rol değiştir — admin yap veya worker yap
  const rolDegistir = async (kullaniciId, yeniRol) => {
    setRolDegistiriliyor(kullaniciId);
    try {
      const endpoint = yeniRol === 'admin'
        ? `http://localhost:5000/api/auth/users/${kullaniciId}/make-admin`
        : `http://localhost:5000/api/auth/users/${kullaniciId}/make-worker`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();

      if (res.ok) {
        // Listeyi güncelle — sayfayı yeniden yüklemeden
        setKullaniciListesi(onceki =>
          onceki.map(u => u._id === kullaniciId ? { ...u, role: yeniRol } : u)
        );
      } else {
        alert('Hata: ' + data.message);
      }
    } catch (err) {
      alert('Bağlantı hatası');
    } finally {
      setRolDegistiriliyor(null);
    }
  };

  useEffect(() => {
    const soket = io('http://localhost:5000');
    soket.on('sensorData', (yeniVeri) => {
  const risk = yeniVeri.lastSensorValue || 0;
  setGrafikVerisi(onceki => [...onceki.slice(-19), {
    zaman: new Date().toLocaleTimeString().slice(0, 5),
    risk
  }]);
});
    soket.on('new-alarm', (yeniAlarm) => {
      setAlarmlar(onceki => [yeniAlarm, ...onceki].slice(0, 5));
    });
    soket.on('newUser', (yeniKullanici) => {
      setKullaniciListesi(onceki => [yeniKullanici, ...onceki]);
    });
    return () => soket.disconnect();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout(); else window.location.reload();
  };

  const AnaDashboard = () => (
    <div style={styles.grid}>
      <div style={{ ...styles.card, gridColumn: 'span 4' }}>
        <p style={styles.title}><Activity size={14}/> Anlık Risk Skoru</p>
        <div style={styles.statKart('#f59e0b')}>
          <span style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>{grafikVerisi.length > 0 ? grafikVerisi[grafikVerisi.length - 1].risk.toFixed(1) : '—'}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Son ölçüm</span>
        </div>
      </div>
      <div style={{ ...styles.card, gridColumn: 'span 4' }}>
        <p style={styles.title}><AlertTriangle size={14}/> Aktif Alarmlar</p>
        <div style={styles.statKart('#ef4444')}>
          <span style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>{alarmlar.length}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Son 5 alarm</span>
        </div>
      </div>
      <div style={{ ...styles.card, gridColumn: 'span 4' }}>
        <p style={styles.title}><ShieldCheck size={14}/> Sistem Durumu</p>
        <div style={styles.statKart('#22c55e')}>
          <span style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>AKTİF</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Tüm sensörler bağlı</span>
        </div>
      </div>
      <div style={{ ...styles.card, gridColumn: 'span 8' }}>
        <p style={styles.title}><Activity size={14}/> Canlı Risk Analizi</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={grafikVerisi}>
            <defs><linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="zaman" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }}/>
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}/>
            <Area type="monotone" dataKey="risk" stroke="#f59e0b" strokeWidth={2.5} fill="url(#riskGrad)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ ...styles.card, gridColumn: 'span 4' }}>
        <p style={styles.title}><AlertTriangle size={14}/> {isAdmin ? 'Fabrika Alarmları' : 'Bildirimlerim'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alarmlar.length === 0 ? <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Aktif alarm yok.</p>
            : alarmlar.map((a, i) => (
              <div key={i} style={{ padding: '10px 12px', backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '13px', borderLeft: '3px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e1' }}>{a.description}</span>
                <ChevronRight size={14} color="#64748b"/>
              </div>
            ))}
        </div>
      </div>
      <div style={{ ...styles.card, gridColumn: 'span 12' }}>
        <p style={styles.title}><ShieldCheck size={14}/> {isAdmin ? 'Fabrika Ekipman Durumu' : 'Kişisel Ekipman Tespiti'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[{ label: 'Baret', status: 'Sistem Bekleniyor', color: '#94a3b8' }, { label: 'İş Yeleği', status: 'Sistem Bekleniyor', color: '#94a3b8' }, { label: 'Eldiven', status: 'Sistem Bekleniyor', color: '#94a3b8' }].map((item, i) => (
            <div key={i} style={{ padding: '14px 16px', backgroundColor: '#0f172a', borderRadius: '10px', border: `1px solid ${item.color}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
              <span style={styles.badge(item.color)}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DetayliAnaliz = () => (
    <div style={styles.grid}>
      <div style={{ ...styles.card, gridColumn: 'span 12' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ ...styles.title, marginBottom: 0 }}><BarChart2 size={14}/> {isAdmin ? 'Tüm Sensör Verileri' : 'Kişisel Sensör Geçmişi'}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Bugün', 'Bu Hafta', 'Bu Ay'].map(f => (
              <button key={f} style={{ ...styles.sekmeBtn(false), padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155', fontSize: '12px' }}>{f}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={grafikVerisi}>
            <defs><linearGradient id="analGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="zaman" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }}/>
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}/>
            <Area type="monotone" dataKey="risk" stroke="#6366f1" strokeWidth={2} fill="url(#analGrad)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ ...styles.card, gridColumn: 'span 12' }}>
        <p style={styles.title}><Activity size={14}/> Sensör Log Kayıtları {!isAdmin && <span style={styles.badge('#6366f1')}>Kişisel</span>}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Zaman', 'Sensör ID', 'Değer', 'Durum'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: '500' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grafikVerisi.slice(-5).reverse().map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{row.zaman}</td>
                  <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{isAdmin ? `SN-00${(i % 3) + 1}` : `SN-${mevcutKullaniciId || '001'}`}</td>
                  <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: '600' }}>{row.risk.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px' }}><span style={styles.badge(row.risk > 5 ? '#ef4444' : '#22c55e')}>{row.risk > 5 ? 'Yüksek' : 'Normal'}</span></td>
                </tr>
              ))}
              {grafikVerisi.length === 0 && (<tr><td colSpan={4} style={{ padding: '20px 12px', color: '#64748b', textAlign: 'center' }}>Henüz veri yok.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const YonetimPaneli = () => (
    <div style={styles.grid}>
      <div style={{ ...styles.card, gridColumn: 'span 12', border: '1px solid #f59e0b', background: 'linear-gradient(135deg, #1e293b 0%, #1a2535 100%)' }}>
        <p style={{ ...styles.title, color: '#f59e0b', marginBottom: 0 }}><Users size={14}/> Yönetici Kontrol Paneli — Tüm fabrika sahası izleniyor</p>
      </div>

      {/* Kullanıcı listesi — gerçek veri + rol değiştirme */}
      <div style={{ ...styles.card, gridColumn: 'span 8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <p style={{ ...styles.title, marginBottom: 0 }}><Users size={14}/> Kullanıcılar</p>
          <span style={styles.badge('#94a3b8')}>{kullaniciListesi.length} kişi</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
          {kullaniciYukleniyor ? (
            <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Yükleniyor...</p>
          ) : kullaniciListesi.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Kullanıcı bulunamadı.</p>
          ) : kullaniciListesi.map((u) => (
            <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#0f172a', borderRadius: '10px', border: `1px solid ${u.role === 'admin' ? '#f59e0b30' : '#1e293b'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: u.role === 'admin' ? '#f59e0b20' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', border: u.role === 'admin' ? '1px solid #f59e0b40' : 'none' }}>
                  {u.role === 'admin' ? <Crown size={15} color="#f59e0b"/> : <User size={15} color="#94a3b8"/>}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{u.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{u.email} · {u.department || 'Genel'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.badge(u.role === 'admin' ? '#f59e0b' : '#22c55e')}>{u.role}</span>
                {/* Kendi hesabına rol değiştiremez */}
                {u._id !== mevcutKullaniciId && (
                  <button
                    style={styles.rolBtn(u.role === 'worker' ? 'admin' : 'worker')}
                    disabled={rolDegistiriliyor === u._id}
                    onClick={() => rolDegistir(u._id, u.role === 'worker' ? 'admin' : 'worker')}
                  >
                    {rolDegistiriliyor === u._id ? '...' : u.role === 'worker'
                      ? <><Crown size={11}/> Admin Yap</>
                      : <><UserX size={11}/> Worker Yap</>
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cihaz yönetimi */}
      <div style={{ ...styles.card, gridColumn: 'span 4' }}>
        <p style={styles.title}><Cpu size={14}/> Cihaz Yönetimi</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'DEV-001', tip: 'Kamera', durum: 'Çevrimiçi', renk: '#22c55e' },
            { id: 'DEV-002', tip: 'Sensör', durum: 'Çevrimiçi', renk: '#22c55e' },
            { id: 'DEV-003', tip: 'Kamera', durum: 'Çevrimdışı', renk: '#ef4444' },
          ].map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#0f172a', borderRadius: '10px', border: `1px solid ${d.renk}20` }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>{d.id}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{d.tip}</p>
              </div>
              <span style={styles.badge(d.renk)}>{d.durum}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const Raporlar = () => (
    <div style={styles.grid}>
      <div style={{ ...styles.card, gridColumn: 'span 12' }}>
        <p style={styles.title}><FileText size={14}/> {isAdmin ? 'Tüm Raporlar' : 'Raporlarım'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { baslik: 'Aylık Güvenlik Raporu — Mayıs 2025', tarih: '01.06.2025', tip: 'PDF', renk: '#6366f1' },
            { baslik: 'Haftalık Analiz — 23. Hafta', tarih: '09.06.2025', tip: 'Excel', renk: '#22c55e' },
            { baslik: 'Acil Durum Olay Özeti', tarih: '05.06.2025', tip: 'PDF', renk: '#6366f1' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={styles.badge(r.renk)}>{r.tip}</span>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#e2e8f0' }}>{r.baslik}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{r.tarih}</p>
                </div>
              </div>
              <ChevronRight size={16} color="#64748b"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (gosterimModu === 'PROFILE') {
    return (
      <ProfilePage
        user={{ name: localStorage.getItem('userName') || 'Kullanıcı', email: localStorage.getItem('userEmail') || 'Email bulunamadı', role: kullaniciRolu, department: localStorage.getItem('userDept') || 'Genel' }}
        geriDon={() => setGosterimModu('DASHBOARD')}
      />
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>VisionGuard <span style={{ color: '#f59e0b' }}>Pro</span></h1>
          {isAdmin && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#f59e0b' }}>Yönetici Görünümü</p>}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button style={styles.profileBtn} onClick={() => setGosterimModu('PROFILE')}><User size={16}/> Profilim</button>
          <button style={{ ...styles.profileBtn, borderColor: '#ef4444', color: '#ef4444' }} onClick={handleLogout}><LogOut size={16}/> Çıkış</button>
        </div>
      </header>
      <nav style={styles.sekmeBar}>
        {sekmeler.map(s => (
          <button key={s.id} style={styles.sekmeBtn(aktifSekme === s.id)} onClick={() => setAktifSekme(s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </nav>
      {aktifSekme === 'anaDashboard' && <AnaDashboard/>}
      {aktifSekme === 'analizler'    && <DetayliAnaliz/>}
      {aktifSekme === 'yonetim'      && isAdmin && <YonetimPaneli/>}
      {aktifSekme === 'raporlar'     && <Raporlar/>}
    </div>
  );
}
