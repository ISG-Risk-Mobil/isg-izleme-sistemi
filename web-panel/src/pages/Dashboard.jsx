import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Activity, User, LogOut, ShieldCheck, Cpu, Users, BarChart2, FileText, LayoutDashboard, ChevronRight, Crown, UserX } from 'lucide-react';
import { XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import io from 'socket.io-client';
import ProfilePage from './ProfilePage';
import {
  KisiselKonum,
  KisiselKonumMobil,
  KullaniciKonumModal
} from './GpsComponents';

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
  const [tumAlarmlar, setTumAlarmlar] = useState([]);
  const [gosterimModu, setGosterimModu] = useState('DASHBOARD');
  const [aktifSekme, setAktifSekme] = useState('anaDashboard');
  const [kullaniciListesi, setKullaniciListesi] = useState([]);
  const [kullaniciYukleniyor, setKullaniciYukleniyor] = useState(false);
  const [rolDegistiriliyor, setRolDegistiriliyor] = useState(null);
  const [cihazlar, setCihazlar] = useState([]);
  const [riskSkoru, setRiskSkoru] = useState(null);
  const [uyariGoster, setUyariGoster] = useState(false);
  const [uyariMesaj, setUyariMesaj] = useState('');
  const grafikRengi = riskSkoru > 0.5 ? '#ef4444' : riskSkoru > 0.2 ? '#f59e0b' : '#22c55e';

  
  const [secilenKullanici, setSecilenKullanici] = useState(null);
  const [kullaniciDetay, setKullaniciDetay] = useState(null);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);
  const [secilenAlarm, setSecilenAlarm] = useState(null);
  const [secilenCihaz, setSecilenCihaz] = useState(null);

  const kullaniciRolu = getRoleFromToken();
  const mevcutKullaniciId = localStorage.getItem('userId');
  const isAdmin = kullaniciRolu === 'admin';
  
  const [aktifAlarmModalAcik, setAktifAlarmModalAcik] = useState(false);

  const [kullaniciKonum, setKullaniciKonum] = useState(null);
  
  const [aramaKelimesi, setAramaKelimesi] = useState('');
  
  const [modalSekme, setModalSekme] = useState('detay');
  const sekmeler = [
    { id: 'anaDashboard', label: 'Ana Panel', icon: <LayoutDashboard size={15}/> },
    { id: 'analizler',    label: 'Detaylı Analiz', icon: <BarChart2 size={15}/> },
    ...(isAdmin ? [{ id: 'yonetim', label: 'Yönetim Paneli', icon: <Users size={15}/> }] : []),
   
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
    }),
    modal: {
      overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000080', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
      box: { backgroundColor: '#1e293b', borderRadius: '20px', padding: '28px', width: '560px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #334155', boxShadow: '0 25px 50px #00000080' },
      baslik: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
      kapatBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '20px' },
      satir: { padding: '12px 14px', backgroundColor: '#0f172a', borderRadius: '10px', marginBottom: '8px' },
    }
  };

  const fetchKullanicilar = async () => {
    if (!isAdmin) return;
    setKullaniciYukleniyor(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/users', {
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

  const fetchKullaniciDetay = async (kullanici) => {
    setSecilenKullanici(kullanici);
    setDetayYukleniyor(true);
    try {
      const alarmRes = await fetch(`http://localhost:5000/api/alarms?userId=${kullanici._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const alarmData = await alarmRes.json();
      const cihazRes = await fetch(`http://localhost:5000/api/devices?userId=${kullanici._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const cihazData = await cihazRes.json();
      setKullaniciDetay({
        alarmlar: alarmData.alarms || alarmData || [],
        cihaz: cihazData.devices?.[0] || null
      });
    } catch (err) {
      console.error('Detay çekilemedi:', err);
    } finally {
      setDetayYukleniyor(false);
    }
  };

  const fetchRiskSkoru = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/my-sensor', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success && data.logs && data.logs.length > 0) {
        const grafik = data.logs.map(log => ({
          zaman: new Date(log.timestamp).toLocaleTimeString('tr-TR').slice(0, 5),
          risk: log.accelerometer?.magnitude || 0
        }));
        setGrafikVerisi(grafik);
        const sonRisk = grafik[grafik.length - 1].risk;
        setRiskSkoru(sonRisk);
        if (sonRisk > 0.5) { setUyariMesaj(`⚠️ Yüksek Risk! ${localStorage.getItem('userName')} — ${sonRisk.toFixed(2)}g ani hareket tespit edildi!`); setUyariGoster(true); }
        else if (sonRisk > 0.2) { setUyariMesaj(`🟡 Orta Risk! ${localStorage.getItem('userName')} — ${sonRisk.toFixed(2)}g hareket tespit edildi.`); setUyariGoster(true); }
        else { setUyariGoster(false); }
      }
    } catch (err) {
      console.error('Risk skoru çekilemedi:', err);
    }
  };

  const fetchAlarmlar = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/alerts?kendi=true', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setAlarmlar(data.alerts);
    } catch (err) {
      console.error('Alarmlar çekilemedi:', err);
    }
  };

  const fetchTumAlarmlar = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/alerts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setTumAlarmlar(data.alerts);
    } catch (err) {
      console.error('Tüm alarmlar çekilemedi:', err);
    }
  };

  const fetchCihazlar = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/devices', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setCihazlar(data.devices);
      else if (Array.isArray(data)) setCihazlar(data);
    } catch (err) {
      console.error('Cihazlar çekilemedi:', err);
    }
  };

  const fetchKullaniciKonum = useCallback(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/my-location', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (data.success && data.location) {
      setKullaniciKonum(data.location); 
    }
  } catch (err) {
    console.error('Kullanıcı konumu çekilemedi:', err);
  }
}, []);

  const alarmCoz = async (id) => {

  await fetch(
    `http://localhost:5000/api/alarms/${id}/resolve`,
    {
      method: 'PUT',
      headers: {
        Authorization:
          `Bearer ${localStorage.getItem('token')}`
      }
    }
  );

  fetchAlarmlar();
  fetchTumAlarmlar();
};

  useEffect(() => {
    fetchKullanicilar();
    fetchAlarmlar();
    fetchTumAlarmlar();
    fetchCihazlar();
    fetchRiskSkoru();
    fetchKullaniciKonum();
  }, [isAdmin]);
  
  const aktifAlarmlar =
  alarmlar.filter(a => !a.resolved);

const cozulmusAlarmlar =
  alarmlar.filter(a => a.resolved);

const aktifTumAlarmlar =
  tumAlarmlar.filter(a => !a.resolved);

const cozulmusTumAlarmlar =
  tumAlarmlar.filter(a => a.resolved);
  const rolDegistir = async (kullaniciId, yeniRol) => {
    setRolDegistiriliyor(kullaniciId);
    try {
      const endpoint = yeniRol === 'admin'
        ? `http://localhost:5000/api/auth/users/${kullaniciId}/make-admin`
        : `http://localhost:5000/api/auth/users/${kullaniciId}/make-worker`;
      const res = await fetch(endpoint, { method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (res.ok) {
        setKullaniciListesi(onceki => onceki.map(u => u._id === kullaniciId ? { ...u, role: yeniRol } : u));
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
    if (!localStorage.getItem('sonGirisTarihi')) {
    localStorage.setItem('sonGirisTarihi', new Date().toISOString());
  }
    const soket = io('http://localhost:5000');
    const userId = localStorage.getItem('userId');
    soket.emit('join', userId);
    soket.on('sensor-update', (yeniVeri) => {
      const risk = yeniVeri.accelerometer?.magnitude || 0;
      setRiskSkoru(risk);
      setGrafikVerisi(prev => [...prev.slice(-19), { zaman: new Date().toLocaleTimeString('tr-TR').slice(0, 5), risk }]);
      if (yeniVeri.location?.lat && yeniVeri.location?.lng) {
    setKullaniciKonum({
      lat: yeniVeri.location.lat,
      lng: yeniVeri.location.lng
    });
  }
    });
    soket.on('new-alarm', (alarm) => {
      setAlarmlar(prev => [alarm, ...prev]);
    });
    return () => soket.disconnect();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout(); else window.location.reload();
  };

  const AlarmDetayModal = () => {
    if (!secilenAlarm) return null;
    const a = secilenAlarm;
    const severity = a.severity?.toLowerCase();
    const renk = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#22c55e';
    return (
      <div style={styles.modal.overlay} onClick={() => setSecilenAlarm(null)}>
        <div style={styles.modal.box} onClick={e => e.stopPropagation()}>
          <div style={styles.modal.baslik}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: `${renk}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${renk}40` }}>
                <AlertTriangle size={20} color={renk}/>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Alarm Detayı</h2>
                <span style={styles.badge(renk)}>{a.severity || 'normal'}</span>
              </div>
            </div>
            <button onClick={() => setSecilenAlarm(null)} style={styles.modal.kapatBtn}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Tip', value: a.type || '—' },
              { label: 'Şiddet', value: a.severity || '—', renk },
              { label: 'Durum', value: a.resolved ? 'Çözüldü' : 'Aktif', renk: a.resolved ? '#22c55e' : '#ef4444' },
              { label: 'Tarih', value: new Date(a.createdAt).toLocaleString('tr-TR') },
              { label: 'Kullanıcı', value: a.userId?.name || 'Bilinmiyor' },
              { label: 'Lokasyon', value: a.location ? `${a.location.lat?.toFixed(4)}, ${a.location.lng?.toFixed(4)}` : '—' },
            ].map((item, i) => (
              <div key={i} style={styles.modal.satir}>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{item.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '600', color: item.renk || '#e2e8f0' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={styles.modal.satir}>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Mesaj</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0', lineHeight: '1.5' }}>{a.message || a.description || '—'}</p>
          </div>
        </div>
      </div>
    );
  };

  const AktifAlarmlarModal = () => {
  if (!aktifAlarmModalAcik) return null;

  return (
    <div
      style={styles.modal.overlay}
      onClick={() => setAktifAlarmModalAcik(false)}
    >
      <div
        style={styles.modal.box}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modal.baslik}>
          <h2 style={{ margin: 0 }}>
            Aktif Alarmlarım ({aktifAlarmlar.length})
          </h2>

          <button
            onClick={() => setAktifAlarmModalAcik(false)}
            style={styles.modal.kapatBtn}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}
        >
          {aktifAlarmlar.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              Aktif alarm bulunamadı.
            </p>
          ) : (
            aktifAlarmlar.map((alarm) => (
              <div
                key={alarm._id}
                onClick={() => setSecilenAlarm(alarm)}
                style={{
                  padding: '12px',
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  borderLeft: '3px solid #ef4444',
                  cursor: 'pointer'
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                >
                  {alarm.message}
                </p>

                <p
                  style={{
                    margin: '4px 0 0',
                    color: '#64748b',
                    fontSize: '12px'
                  }}
                >
                  {new Date(alarm.createdAt).toLocaleString('tr-TR')}
                </p>
                
<span style={{
  display: 'inline-block',
  marginTop: '6px',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '600',
  backgroundColor: (alarm.isResolved === false || alarm.isResolved === "false") ? '#ef444422' : '#10b98122',
  color: (alarm.isResolved === false || alarm.isResolved === "false") ? '#ef4444' : '#10b981',
  border: `1px solid ${(alarm.isResolved === false || alarm.isResolved === "false") ? '#ef444444' : '#10b98144'}`
}}>
  {alarm.resolved === 'active' ? 'Aktif' : 'Çözüldü'}
</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

  const CihazDetayModal = () => {
    if (!secilenCihaz) return null;
    const d = secilenCihaz;
    const renk = d.isActive ? '#22c55e' : '#ef4444';
    return (
      <div style={styles.modal.overlay} onClick={() => setSecilenCihaz(null)}>
        <div style={styles.modal.box} onClick={e => e.stopPropagation()}>
          <div style={styles.modal.baslik}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: `${renk}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${renk}40` }}>
                <Cpu size={20} color={renk}/>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>{d.deviceId || d.name}</h2>
                <span style={styles.badge(renk)}>{d.isActive ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
              </div>
            </div>
            <button onClick={() => setSecilenCihaz(null)} style={styles.modal.kapatBtn}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Cihaz ID', value: d.deviceId || '—' },
              { label: 'Ad', value: d.name || '—' },
              { label: 'Tip', value: d.type || '—' },
              { label: 'Durum', value: d.isActive ? 'Çevrimiçi' : 'Çevrimdışı', renk },
              { label: 'Atanan Kullanıcı', value: d.assignedUser?.name || 'Atanmamış' },
              { label: 'Kayıt Tarihi', value: d.createdAt ? new Date(d.createdAt).toLocaleDateString('tr-TR') : '—' },
            ].map((item, i) => (
              <div key={i} style={styles.modal.satir}>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{item.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '600', color: item.renk || '#e2e8f0' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {d.assignedUser && (
            <div style={styles.modal.satir}>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Atanan Kullanıcı Detayı</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>{d.assignedUser.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{d.assignedUser.email}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AnaDashboard = () => (
  <div style={styles.grid}>
    <div style={{ ...styles.card, gridColumn: 'span 4' }}>
      <p style={styles.title}><Activity size={14}/> Anlık Risk Skoru</p>
      <div style={styles.statKart('#f59e0b')}>
        <span style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>{riskSkoru !== null ? riskSkoru.toFixed(2) : '—'}</span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{localStorage.getItem('userName') || 'Kullanıcı'} · Son ölçüm</span>
      </div>
    </div>
      <div
  style={{
    ...styles.card,
    gridColumn: 'span 4',
    cursor: 'pointer'
  }}
  onClick={() => {
     
     setAktifAlarmModalAcik(true);
     
  }}
>
      <p style={styles.title}><AlertTriangle size={14}/> Aktif Alarmlar</p>
      <div style={styles.statKart('#ef4444')}>
        <span style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>{alarmlar.filter(a => !a.resolved).length}</span>

        
        <span style={{ fontSize: '12px', color: '#64748b' }}>Çözülmemiş alarm</span>
      </div>
    </div>
    <div style={{ ...styles.card, gridColumn: 'span 4' }}>
  <p style={styles.title}><ShieldCheck size={14}/> Sistem Durumu</p>
  <div style={styles.statKart(aktifTumAlarmlar.length > 0 ? '#ef4444' : '#22c55e')}>
    <span style={{ fontSize: '32px', fontWeight: '700', color: aktifTumAlarmlar.length > 0 ? '#ef4444' : '#22c55e' }}>
      {aktifTumAlarmlar.length > 0 ? 'TEHLİKE' : 'GÜVENLİ'}
    </span>
    <span style={{ fontSize: '12px', color: '#64748b' }}>
      {aktifTumAlarmlar.length > 0 ? `${aktifTumAlarmlar.length} aktif fabrika alarmı var` : 'Tüm sistemler normal'}
    </span>
  </div>
</div>
    <div style={{ ...styles.card, gridColumn: 'span 8' }}>
      <p style={styles.title}><Activity size={14}/> Canlı Risk Analizi</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={grafikVerisi}>
          <defs>
            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={grafikRengi} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={grafikRengi} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="zaman" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }}/>
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}/>
          <Area type="monotone" dataKey="risk" stroke={grafikRengi} strokeWidth={2.5} fill="url(#riskGrad)" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>

    <div style={{ ...styles.card, gridColumn: 'span 4' }}>
      <p style={styles.title}><ShieldCheck size={14}/> Çözülmüş Alarmlarım</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
        {cozulmusAlarmlar.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Çözülmüş alarm yok.</p>
        ) : (
          cozulmusAlarmlar.map((a, i) => (
            <div key={a._id || i} onClick={() => setSecilenAlarm(a)} style={{ padding: '12px 14px', backgroundColor: '#0f172a', borderRadius: '10px', borderLeft: '3px solid #22c55e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0' }}>{a.message}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{new Date(a.createdAt).toLocaleString('tr-TR')}</p>
              </div>
              <span style={styles.badge('#22c55e')}>ÇÖZÜLDÜ</span>
            </div>
          ))
        )}
      </div>
    </div>

    
<KisiselKonumMobil styles={styles} />
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
            <div key={u._id} onClick={() => fetchKullaniciDetay(u)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#0f172a', borderRadius: '10px', border: `1px solid ${u.role === 'admin' ? '#f59e0b30' : '#1e293b'}`, cursor: 'pointer' }}>
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
                {u._id !== mevcutKullaniciId && (
                  <button
                    style={styles.rolBtn(u.role === 'worker' ? 'admin' : 'worker')}
                    disabled={rolDegistiriliyor === u._id}
                    onClick={(e) => { e.stopPropagation(); rolDegistir(u._id, u.role === 'worker' ? 'admin' : 'worker'); }}
                  >
                    {rolDegistiriliyor === u._id ? '...' : u.role === 'worker' ? <><Crown size={11}/> Admin Yap</> : <><UserX size={11}/> Worker Yap</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...styles.card, gridColumn: 'span 4' }}>
        <p style={styles.title}><Cpu size={14}/> Cihaz Yönetimi</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cihazlar.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Cihaz bulunamadı.</p>
          ) : cihazlar.map((d) => (
            <div key={d._id} onClick={() => setSecilenCihaz(d)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#0f172a', borderRadius: '10px', border: `1px solid ${d.isActive ? '#22c55e' : '#ef4444'}20`, cursor: 'pointer' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>{d.deviceId}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{d.name} · {d.assignedUser?.name || 'Atanmamış'}</p>
              </div>
              <span style={styles.badge(d.isActive ? '#22c55e' : '#ef4444')}>{d.isActive ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
            </div>
          ))}
        </div>
      </div>
      
<div style={{ ...styles.card, gridColumn: 'span 6' }}>
  <p style={styles.title}>
    <AlertTriangle size={14}/>
    Aktif Fabrika Alarmları
  </p>

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}
  >
    {aktifTumAlarmlar.length === 0 ? (
      <p
        style={{
          color: '#64748b',
          fontSize: '13px',
          textAlign: 'center',
          padding: '20px'
        }}
      >
        Aktif alarm yok.
      </p>
    ) : (
      aktifTumAlarmlar.map((a, i) => {
        const severity = a.severity?.toLowerCase();

        const renk =
          severity === 'high'
            ? '#ef4444'
            : severity === 'medium'
            ? '#f59e0b'
            : '#22c55e';

        return (
          <div
            key={a._id || i}
            onClick={() => setSecilenAlarm(a)}
            style={{
              padding: '12px 14px',
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              borderLeft: `3px solid ${renk}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#e2e8f0'
                }}
              >
                {a.message}
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: '#64748b',
                  marginTop: '4px'
                }}
              >
                {a.userId?.name || 'Bilinmiyor'} ·{' '}
                {new Date(a.createdAt).toLocaleString('tr-TR')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={styles.badge(renk)}>
                {a.severity || 'normal'}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alarmCoz(a._id);
                }}
                style={{
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: 'pointer'
                }}
              >
                Çözüldü
              </button>
            </div>
          </div>
        );
      })
    )}
  </div>
</div>


<div style={{ ...styles.card, gridColumn: 'span 6' }}>
  <p style={styles.title}>
    <ShieldCheck size={14}/>
    Çözülmüş Fabrika Alarmları
  </p>

  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}
  >
    {cozulmusTumAlarmlar.length === 0 ? (
      <p
        style={{
          color: '#64748b',
          fontSize: '13px',
          textAlign: 'center',
          padding: '20px'
        }}
      >
        Çözülmüş alarm bulunamadı.
      </p>
    ) : (
      cozulmusTumAlarmlar.map((a, i) => (
        <div
          key={a._id || i}
          onClick={() => setSecilenAlarm(a)}
          style={{
            padding: '12px 14px',
            backgroundColor: '#0f172a',
            borderRadius: '10px',
            borderLeft: '3px solid #22c55e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#e2e8f0'
              }}
            >
              {a.message}
            </p>

            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: '#64748b',
                marginTop: '4px'
              }}
            >
              {a.userId?.name || 'Bilinmiyor'} ·{' '}
              {new Date(a.createdAt).toLocaleString('tr-TR')}
            </p>
          </div>

          <span style={styles.badge('#22c55e')}>
            ÇÖZÜLDÜ
          </span>
        </div>
      ))
    )}
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

      
{secilenKullanici && (
  <div style={styles.modal.overlay} onClick={() => { setSecilenKullanici(null); setModalSekme('detay'); }}>
    <div style={{ ...styles.modal.box, width: '600px' }} onClick={e => e.stopPropagation()}>

      
      <div style={styles.modal.baslik}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: secilenKullanici.role === 'admin' ? '#f59e0b20' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', border: secilenKullanici.role === 'admin' ? '2px solid #f59e0b40' : '2px solid #334155' }}>
            {secilenKullanici.role === 'admin' ? <Crown size={22} color="#f59e0b"/> : <User size={22} color="#94a3b8"/>}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{secilenKullanici.name}</h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>{secilenKullanici.email}</p>
          </div>
        </div>
        <button onClick={() => { setSecilenKullanici(null); setModalSekme('detay'); }} style={styles.modal.kapatBtn}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', backgroundColor: '#0f172a', padding: '5px', borderRadius: '10px', border: '1px solid #1e293b' }}>
        {[
          { id: 'detay', label: '👤 Detay' },
          { id: 'konum', label: '📍 GPS Konumu' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setModalSekme(s.id)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: '7px', border: 'none',
              cursor: 'pointer', fontSize: '13px',
              fontWeight: modalSekme === s.id ? '600' : '400',
              backgroundColor: modalSekme === s.id ? '#f59e0b' : 'transparent',
              color: modalSekme === s.id ? '#0f172a' : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

    
      {modalSekme === 'detay' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Rol', value: secilenKullanici.role, renk: secilenKullanici.role === 'admin' ? '#f59e0b' : '#22c55e' },
              { label: 'Departman', value: secilenKullanici.department || 'Genel', renk: '#94a3b8' },
              { label: 'Durum', value: secilenKullanici.isActive ? 'Aktif' : 'Pasif', renk: secilenKullanici.isActive ? '#22c55e' : '#ef4444' },
              { label: 'Kayıt Tarihi', value: new Date(secilenKullanici.createdAt).toLocaleDateString('tr-TR'), renk: '#94a3b8' },
            ].map((item, i) => (
              <div key={i} style={styles.modal.satir}>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{item.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '600', color: item.renk }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atanmış Cihaz</p>
            {detayYukleniyor ? <p style={{ color: '#64748b', fontSize: '13px' }}>Yükleniyor...</p>
              : kullaniciDetay?.cihaz ? (
                <div style={{ ...styles.modal.satir, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>{kullaniciDetay.cihaz.deviceId}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{kullaniciDetay.cihaz.name}</p>
                  </div>
                  <span style={styles.badge(kullaniciDetay.cihaz.isActive ? '#22c55e' : '#ef4444')}>{kullaniciDetay.cihaz.isActive ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                </div>
              ) : <p style={{ color: '#64748b', fontSize: '13px' }}>Atanmış cihaz yok.</p>}
          </div>

          <div>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Alarmlar {kullaniciDetay?.alarmlar?.length > 0 && <span style={styles.badge('#ef4444')}>{kullaniciDetay.alarmlar.length}</span>}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {detayYukleniyor ? <p style={{ color: '#64748b', fontSize: '13px' }}>Yükleniyor...</p>
                : kullaniciDetay?.alarmlar?.length === 0 ? <p style={{ color: '#64748b', fontSize: '13px' }}>Alarm yok.</p>
                : kullaniciDetay?.alarmlar?.map((a, i) => {
                    const severity = a.severity?.toLowerCase();
                    const renk = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#22c55e';
                    return (
                      <div key={i} style={{ padding: '10px 12px', backgroundColor: '#0f172a', borderRadius: '8px', borderLeft: `3px solid ${renk}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0' }}>{a.description}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{a.type} · {new Date(a.createdAt).toLocaleString('tr-TR')}</p>
                        </div>
                        <span style={styles.badge(renk)}>{a.severity}</span>
                      </div>
                    );
                  })}
            </div>
          </div>
        </>
      )}

     
      {modalSekme === 'konum' && (
        <KullaniciKonumModal kullanici={secilenKullanici} />
      )}

    </div>
  </div>
)}


      
      <AlarmDetayModal/>

      
      <CihazDetayModal/>

      <AktifAlarmlarModal />

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
    </div>
  );
}
