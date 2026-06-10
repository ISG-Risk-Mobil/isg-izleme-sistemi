import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

const RENKLER = {
  bg: '#020617',
  accent: '#EAB308',
  textMain: '#F8FAFC',
  textMuted: '#64748B'
};

const SLAYTLAR = [
  "/images/görsel1.jpg",
  "/images/görsel2.jpg",
  "/images/görsel3.jpg"
];

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loginEmail, setLoginEmail] = useState('');       // YENİ
  const [loginPassword, setLoginPassword] = useState(''); // YENİ

  // App.jsx - handleLogin fonksiyonu:
// App.jsx içerisinde
const handleLogin = (userData) => {
  // Gelen veriyi güvenli bir şekilde sakla
  localStorage.setItem('token', userData.token);
  localStorage.setItem('role', userData.role);
  localStorage.setItem('userName', userData.name);
  
  // State'i güncelle: Bu satır, App.jsx'in Dashboard'u render etmesini sağlar
  setIsLoggedIn(true); 
  
  // Eğer özel bir modal yapın varsa onu kapat
  setIsAuthOpen(false); 
};

// ... render içinde:
<Login onLogin={handleLogin} />

  // YENİ: Direkt login fonksiyonu
  const handleDirectLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: loginEmail,
        password: loginPassword
      });
      handleLogin({
        token: res.data.token,
        role: res.data.user?.role || 'worker',
        name: res.data.user?.name || ''
      });
    } catch (err) {
      alert("Hata: " + (err.response?.data?.message || "Giriş başarısız"));
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % SLAYTLAR.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={container}>
      {isLoggedIn ? (
        <Dashboard 
          role={localStorage.getItem('role')} 
          onLogout={() => {
            localStorage.clear();
            setIsLoggedIn(false);
          }} 
        />
      ) : (
        <div style={layout}>
          <section style={leftPanel}>
            {SLAYTLAR.map((src, idx) => (
              <img key={idx} src={src} alt="Endüstri" style={{
                ...bgImageStyle,
                opacity: idx === currentIdx ? 1 : 0,
              }} />
            ))}

            <div style={{ 
              zIndex: 2, position: 'relative', flex: 1, display: 'flex', 
              flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
              textAlign: 'center', padding: '0 60px', textShadow: '0 4px 15px rgba(0,0,0,0.7)' 
            }}>
              <div style={{ ...brand, fontSize: '18px', letterSpacing: '6px', textTransform: 'uppercase', color: RENKLER.accent, marginBottom: '20px' }}>
                VG.SYSTEMS AI
              </div>
              <h1 style={{ ...mainHeading, fontSize: '52px', marginBottom: '24px' }}>
                Endüstriyel Güvenlikte<br/>
                Zekayı Saha ile Birleştirin.
              </h1>
              <p style={{ ...subHeading, fontSize: '18px', lineHeight: '1.7', maxWidth: '450px', color: '#E2E8F0', opacity: 0.9 }}>
                Yapay zeka destekli proaktif analiz yöntemlerimizle, tesisinizdeki riskleri önceden tahmin edin; iş kazalarını gerçekleşmeden önleyin.
              </p>
            </div>
            
            <div style={{ zIndex: 2, position: 'relative', padding: '80px', paddingTop: '0', ...footerText }}>
              © 2026 VISIONGUARD INC.
            </div>
          </section>

          <section style={rightPanel}>
            {!isAuthOpen ? (
              // DEĞİŞTİ: Butonlar yerine direkt form
              <div style={entryArea}>
                <h2 style={{fontSize: '28px', fontWeight: '700', marginBottom: '10px', color: '#FFF'}}>Sistemi Başlatın</h2>
                <input
                  type="email"
                  placeholder="E-posta"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="password"
                  placeholder="Şifre"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={handleDirectLogin} style={primaryBtn}>
                  Giriş Yap
                </button>
                <button onClick={() => setIsAuthOpen('register')} style={secondaryBtn}>
                  Hesap Oluştur
                </button>
              </div>
            ) : (
              <div style={authContainer}>
                <button onClick={() => setIsAuthOpen(false)} style={backBtn}>← Geri Dön</button>
                <Login 
                  baslangicKayitMi={isAuthOpen === 'register'} 
                  onLogin={handleLogin} 
                />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

const container = { backgroundColor: RENKLER.bg, minHeight: '100vh', color: RENKLER.textMain, fontFamily: "'Inter', sans-serif" };
const layout = { display: 'flex', height: '100vh', width: '100%' };
const leftPanel = { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' };
const bgImageStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 1.5s ease-in-out', zIndex: 1 };
const brand = { fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' };
const mainHeading = { fontSize: '56px', fontWeight: '800', lineHeight: '1.1', margin: '0' };
const subHeading = { fontSize: '18px', color: RENKLER.textMain, marginTop: '0', maxWidth: '400px' };
const footerText = { fontSize: '12px', color: RENKLER.textMuted };
const rightPanel = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#070b1a', borderLeft: '1px solid #1e293b' };
const entryArea = { display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center', width: '100%', maxWidth: '320px' };
const authContainer = { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const primaryBtn = { padding: '18px 40px', fontSize: '16px', fontWeight: '600', backgroundColor: RENKLER.accent, border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#000' };
const secondaryBtn = { padding: '18px 40px', fontSize: '16px', fontWeight: '600', backgroundColor: 'transparent', border: '1px solid #334155', color: '#FFF', borderRadius: '8px', cursor: 'pointer' };
const backBtn = { marginBottom: '20px', background: 'none', border: 'none', color: RENKLER.textMuted, cursor: 'pointer' };
// YENİ stil
const inputStyle = { width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #1e293b', borderRadius: '8px', color: '#FFF', boxSizing: 'border-box', outline: 'none' };

export default App;