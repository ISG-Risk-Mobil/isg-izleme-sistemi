import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Shield, UserPlus } from 'lucide-react';

const RENKLER = {
  navy: '#0B1120',
  accent: '#EAB308',
  textMain: '#F1F5F9',
  textMuted: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.1)'
};

function LoginPage({ baslangicKayitMi, onLogin }) {
  const [isLogin, setIsLogin] = useState(!baslangicKayitMi);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Yeni eklenen alanlar
  const [role, setRole] = useState('personel'); 
  const [department, setDepartment] = useState('');

  // LoginPage.jsx içinde:
const handleSubmit = async (e) => {
  e.preventDefault();
  const API_URL = 'http://localhost:5000/api';

  try {
    if (isLogin) {
      // GİRİŞ İŞLEMİ
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      onLogin({ token: res.data.token, role: res.data.user.role, name: res.data.user.name });
    } else {
      // KAYIT İŞLEMİ
      const res = await axios.post(`${API_URL}/auth/register`, {
        name, email, password, role, department
      });
      // Kayıt başarılıysa giriş sayfasına dön veya otomatik giriş yap
      alert("Hesap başarıyla oluşturuldu! Lütfen giriş yapın.");
      setIsLogin(true); 
    }
  } catch (err) {
    console.error(err);
    alert("Hata: " + (err.response?.data?.message || "İşlem başarısız"));
  }
};

  return (
    <div style={pageContainer}>
      <div style={glassCardStyle}>
        <div style={logoWrapper}>
          <div style={iconStyle}>{isLogin ? <Shield size={32} /> : <UserPlus size={32} />}</div>
          <h1 style={titleStyle}>VISION<span style={{color: RENKLER.accent}}>GUARD</span></h1>
          <p style={subtitleStyle}>{isLogin ? 'Sisteme giriş yaparak devam edin' : 'Kurumsal hesabınızı oluşturun'}</p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {!isLogin && (
            <>
              <div style={inputContainer}>
                <label style={labelStyle}>Ad Soyad</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required />
              </div>
              <div style={inputContainer}>
                <label style={labelStyle}>Departman</label>
                <input type="text" placeholder="Örn: Üretim, Lojistik" value={department} onChange={(e) => setDepartment(e.target.value)} style={inputStyle} required />
              </div>
              <div style={inputContainer}>
                <label style={labelStyle}>Yetki Seviyesi</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{...inputStyle, backgroundColor: '#0f172a', cursor: 'pointer'}}>
                  <option value="worker">Worker</option>
                  <option value="admin">Yönetici (Admin)</option>
                </select>
              </div>
            </>
          )}

          <div style={inputContainer}>
            <label style={labelStyle}>E-Posta Adresi</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
          </div>
          
          <div style={{...inputContainer, position: 'relative'}}>
            <label style={labelStyle}>Şifre</label>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <button type="submit" style={buttonStyle}>
            {isLogin ? 'SİSTEME GİRİŞ YAP' : 'HESABI OLUŞTUR'}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} style={toggleButton}>
          {isLogin ? 'Hesabınız yok mu? Kayıt Ol' : 'Zaten üye misiniz? Giriş Yap'}
        </button>
      </div>
    </div>
  );
}

const pageContainer = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const glassCardStyle = { background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', border: `1px solid ${RENKLER.border}`, borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' };
const logoWrapper = { marginBottom: '40px' };
const iconStyle = { color: RENKLER.accent, background: 'rgba(234, 179, 8, 0.1)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' };
const titleStyle = { color: RENKLER.textMain, fontSize: '24px', letterSpacing: '1px', fontWeight: '800', margin: '0' };
const subtitleStyle = { color: RENKLER.textMuted, fontSize: '14px', marginTop: '8px' };
const inputStyle = { width: '100%', padding: '14px', marginTop: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${RENKLER.border}`, borderRadius: '12px', color: '#FFF', outline: 'none', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', backgroundColor: RENKLER.accent, color: RENKLER.navy, padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '20px' };
const labelStyle = { color: RENKLER.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' };
const inputContainer = { textAlign: 'left', marginBottom: '20px' };
const formStyle = { display: 'flex', flexDirection: 'column' };
const toggleButton = { background: 'none', border: 'none', color: RENKLER.textMuted, marginTop: '20px', cursor: 'pointer', fontSize: '13px' };
const eyeButtonStyle = { position: 'absolute', right: '15px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: RENKLER.textMuted };

export default LoginPage;