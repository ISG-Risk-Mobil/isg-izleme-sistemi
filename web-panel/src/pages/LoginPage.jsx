import React, { useState } from 'react';
import axios from 'axios';

const RENKLER = {
  navy: '#0F172A',
  accent: '#F59e0b',
  text: '#F8FAFC'
};

const API_URL = 'http://localhost:5000/api';

function LoginPage({ baslangicKayitMi, onLogin }) {
  const [isLogin, setIsLogin] = useState(!baslangicKayitMi);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Genel'); // 'genel' yerine 'Genel' olarak güncelledim
  const [role, setRole] = useState('worker');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // GİRİŞ İŞLEMİ
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        
        const { token, user } = response.data;
        
        // Verileri localStorage'a kaydet (Profil sayfası buradan okuyacak)
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userDept', user.department || 'Genel');

        const girisZamani = new Date().toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      localStorage.setItem('lastLogin', girisZamani);
        
        alert(`Hoş geldin ${user.name}!`);
        
        if (onLogin) {
          onLogin(user.role);
        }
        
      } else {
        // KAYIT İŞLEMİ
        await axios.post(`${API_URL}/auth/register`, {
          name,
          email,
          password,
          role,
          department
        });
        
        alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
        setIsLogin(true); // Kayıttan sonra giriş ekranına dön
      }
    } catch (error) {
      alert(error.response?.data?.message || 'İşlem başarısız!');
    }
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
          <>
            <div style={inputContainer}>
              <label style={labelStyle}>Ad Soyad</label>
              <input type="text" placeholder="Ad Soyad" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            
            <div style={inputContainer}>
              <label style={labelStyle}>Departman</label>
              <select style={inputStyle} value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="Genel">Genel</option>
                <option value="Bursa">Bursa Fabrika</option>
                <option value="Bakım">Bakım Onarım</option>
                <option value="Lojistik">Lojistik</option>
              </select>
            </div>

            <div style={inputContainer}>
              <label style={labelStyle}>Rol Seçimi</label>
              <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="worker">Personel</option>
                <option value="admin">Yönetici</option>
              </select>
            </div>
          </>
        )}

        <div style={inputContainer}>
          <label style={labelStyle}>Personel E-Posta</label>
          <input type="email" placeholder="isim.soyisim@sirket.com" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div style={inputContainer}>
          <label style={labelStyle}>Şifre</label>
          <input type="password" placeholder="••••••••" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} required />
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

// Stillerin değişmedi, aynı kalıyor
const glassCardStyle = { background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)', margin: 'auto' };
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

export default LoginPage;