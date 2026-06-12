import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Shield, UserPlus, ArrowLeft, Mail, KeyRound } from 'lucide-react';

const RENKLER = {
  navy: '#0B1120',
  accent: '#EAB308',
  textMain: '#F1F5F9',
  textMuted: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.1)'
};

const API_URL = 'http://localhost:5000/api';

function LoginPage({ baslangicKayitMi, baslangicSifreUnuttumMu, onLogin }) {
  const [isLogin, setIsLogin] = useState(!baslangicKayitMi);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');

  const [sifreAdim, setSifreAdim] = useState(baslangicSifreUnuttumMu ? 'email' : null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.user.role);
        localStorage.setItem('userName', res.data.user.name);
        localStorage.setItem('userEmail', res.data.user.email);
        onLogin({ token: res.data.token, role: res.data.user.role, name: res.data.user.name });
      } else {
        await axios.post(`${API_URL}/auth/register`, { name, email, password, department });
        alert("Hesap başarıyla oluşturuldu! Lütfen giriş yapın.");
        setIsLogin(true);
      }
    } catch (err) {
      alert("Hata: " + (err.response?.data?.message || "İşlem başarısız"));
    }
  };

  const sifreResetEmailGonder = async () => {
    if (!resetEmail) { setMesaj({ tip: 'hata', metin: 'Email adresinizi girin.' }); return; }
    setYukleniyor(true);
    setMesaj(null);
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email: resetEmail });
      setResetToken(res.data.resetToken);
      setSifreAdim('reset');
      setMesaj({ tip: 'basari', metin: 'Token alındı. Yeni şifrenizi belirleyin.' });
    } catch (err) {
      setMesaj({ tip: 'hata', metin: err.response?.data?.message || 'Email bulunamadı.' });
    } finally {
      setYukleniyor(false);
    }
  };

  const sifreSifirla = async () => {
    if (!yeniSifre || !yeniSifreTekrar) { setMesaj({ tip: 'hata', metin: 'Tüm alanları doldurun.' }); return; }
    if (yeniSifre !== yeniSifreTekrar) { setMesaj({ tip: 'hata', metin: 'Şifreler eşleşmiyor.' }); return; }
    if (yeniSifre.length < 6) { setMesaj({ tip: 'hata', metin: 'Şifre en az 6 karakter olmalı.' }); return; }
    setYukleniyor(true);
    setMesaj(null);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        resetToken,
        newPassword: yeniSifre
      });
      setMesaj({ tip: 'basari', metin: 'Şifre güncellendi! Giriş yapabilirsiniz.' });
      setTimeout(() => {
        setSifreAdim(null);
        setResetEmail('');
        setResetToken('');
        setYeniSifre('');
        setYeniSifreTekrar('');
        setMesaj(null);
      }, 2000);
    } catch (err) {
      setMesaj({ tip: 'hata', metin: err.response?.data?.message || 'Şifre sıfırlanamadı.' });
    } finally {
      setYukleniyor(false);
    }
  };

  if (sifreAdim === 'email') {
    return (
      <div style={pageContainer}>
        <div style={glassCardStyle}>
          <div style={logoWrapper}>
            <div style={iconStyle}><Mail size={32}/></div>
            <h1 style={titleStyle}>Şifre <span style={{ color: RENKLER.accent }}>Sıfırla</span></h1>
            <p style={subtitleStyle}>Kayıtlı email adresinizi girin</p>
          </div>

          {mesaj && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', backgroundColor: mesaj.tip === 'hata' ? '#ef444420' : '#22c55e20', color: mesaj.tip === 'hata' ? '#ef4444' : '#22c55e', border: `1px solid ${mesaj.tip === 'hata' ? '#ef444440' : '#22c55e40'}` }}>
              {mesaj.metin}
            </div>
          )}

          <div style={inputContainer}>
            <label style={labelStyle}>E-Posta Adresi</label>
            <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={inputStyle} placeholder="ornek@email.com"/>
          </div>

          <button onClick={sifreResetEmailGonder} disabled={yukleniyor} style={buttonStyle}>
            {yukleniyor ? 'Gönderiliyor...' : 'Devam Et'}
          </button>

          <button onClick={() => { setSifreAdim(null); setMesaj(null); }} style={toggleButton}>
            <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Giriş sayfasına dön
          </button>
        </div>
      </div>
    );
  }

  if (sifreAdim === 'reset') {
    return (
      <div style={pageContainer}>
        <div style={glassCardStyle}>
          <div style={logoWrapper}>
            <div style={iconStyle}><KeyRound size={32}/></div>
            <h1 style={titleStyle}>Yeni <span style={{ color: RENKLER.accent }}>Şifre</span></h1>
            <p style={subtitleStyle}>Yeni şifrenizi belirleyin</p>
          </div>

          {mesaj && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', backgroundColor: mesaj.tip === 'hata' ? '#ef444420' : '#22c55e20', color: mesaj.tip === 'hata' ? '#ef4444' : '#22c55e', border: `1px solid ${mesaj.tip === 'hata' ? '#ef444440' : '#22c55e40'}` }}>
              {mesaj.metin}
            </div>
          )}

          <div style={inputContainer}>
            <label style={labelStyle}>Yeni Şifre</label>
            <input type="password" value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)} style={inputStyle} placeholder="En az 6 karakter"/>
          </div>
          <div style={inputContainer}>
            <label style={labelStyle}>Yeni Şifre Tekrar</label>
            <input type="password" value={yeniSifreTekrar} onChange={(e) => setYeniSifreTekrar(e.target.value)} style={inputStyle} placeholder="Şifreyi tekrar girin"/>
          </div>

          <button onClick={sifreSifirla} disabled={yukleniyor} style={buttonStyle}>
            {yukleniyor ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
          </button>

          <button onClick={() => { setSifreAdim('email'); setMesaj(null); }} style={toggleButton}>
            <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Geri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <div style={glassCardStyle}>
        <div style={logoWrapper}>
          <div style={iconStyle}>{isLogin ? <Shield size={32}/> : <UserPlus size={32}/>}</div>
          <h1 style={titleStyle}>VISION<span style={{ color: RENKLER.accent }}>GUARD</span></h1>
          <p style={subtitleStyle}>{isLogin ? 'Sisteme giriş yaparak devam edin' : 'Kurumsal hesabınızı oluşturun'}</p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {!isLogin && (
            <>
              <div style={inputContainer}>
                <label style={labelStyle}>Ad Soyad</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required/>
              </div>
              <div style={inputContainer}>
                <label style={labelStyle}>Departman</label>
                <input type="text" placeholder="Örn: Üretim, Lojistik" value={department} onChange={(e) => setDepartment(e.target.value)} style={inputStyle} required/>
              </div>
            </>
          )}

          <div style={inputContainer}>
            <label style={labelStyle}>E-Posta Adresi</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required/>
          </div>

          <div style={{ ...inputContainer, position: 'relative' }}>
            <label style={labelStyle}>Şifre</label>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required/>
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>

          
          {isLogin && (
            <button type="button" onClick={() => setSifreAdim('email')} style={{ ...toggleButton, textAlign: 'right', marginTop: '-10px', marginBottom: '10px', color: RENKLER.accent }}>
              Şifremi Unuttum
            </button>
          )}

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
