import React, { useState } from 'react';

const RENKLER = {
  navy: '#0F172A',
  accent: '#F59E0B',
  text: '#F8FAFC'
};

function Login({ baslangicKayitMi }) {
  const [isLogin, setIsLogin] = useState(!baslangicKayitMi);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`${isLogin ? 'Giriş' : 'Kayıt'} işlemi yapılıyor: ${email}`);
  };

  return (
    <div style={glassCardStyle}>
      <div style={logoWrapper}>
        <div style={iconStyle}>{isLogin ? '🛡️' : '✍️'}</div>
        <h1 style={titleStyle}>VISION<span style={{color: RENKLER.accent}}>GUARD</span></h1>
        <p style={subtitleStyle}>{isLogin ? 'Sisteme Giriş Yap' : 'Yeni Personel Kaydı'}</p>
      </div>

      <form onSubmit={handleSubmit} style={formStyle}>
        {!isLogin && (
          <div style={inputContainer}>
            <label style={labelStyle}>Ad Soyad</label>
            <input type="text" placeholder="Melike Dal" style={inputStyle} required />
          </div>
        )}

        <div style={inputContainer}>
          <label style={labelStyle}>Personel E-Posta</label>
          <input 
            type="email" 
            placeholder="isim.soyisim@sirket.com" 
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>

        <div style={inputContainer}>
          <label style={labelStyle}>Şifre</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>

        <button type="submit" style={buttonStyle}>
          {isLogin ? 'SİSTEME GİRİŞ YAP' : 'HESABI OLUŞTUR'}
        </button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)} style={toggleButton}>
        {isLogin ? 'Hesabınız yok mu? Kayıt Ol' : 'Zaten üye misiniz? Giriş Yap'}
      </button>
    </div>
  );
}

// Tasarım Objeleri (Stiller)
const glassCardStyle = { background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)' };
const logoWrapper = { marginBottom: '30px' };
const iconStyle = { fontSize: '40px', marginBottom: '10px' };
const titleStyle = { color: '#FFFFFF', fontSize: '22px', letterSpacing: '2px', fontWeight: '800', margin: '0' };
const subtitleStyle = { color: '#94A3B8', fontSize: '12px', textTransform: 'uppercase', marginTop: '5px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputContainer = { textAlign: 'left' };
const labelStyle = { display: 'block', color: '#CBD5E1', fontSize: '13px', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: '#FFFFFF', outline: 'none', boxSizing: 'border-box' };
const buttonStyle = { backgroundColor: RENKLER.accent, color: RENKLER.navy, padding: '14px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' };
const toggleButton = { background: 'none', border: 'none', color: RENKLER.accent, marginTop: '20px', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' };

export default Login;