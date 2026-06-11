import React, { useRef, useState } from 'react';
import { ArrowLeft, Lock, X, Pencil, CheckCircle } from 'lucide-react';

export default function ProfilSayfasi({ kullanici = {}, geriDon }) {
  const dosyaGirisRef = useRef(null);
  const [profilFotografi, setProfilFotografi] = useState(localStorage.getItem('profilFotografi') || null);
  const [duzenle, setDuzenle] = useState(false);
  const [sifreDegistiriliyorMu, setSifreDegistiriliyorMu] = useState(false);
  const [mesaj, setMesaj] = useState(null);
  const [mesajTip, setMesajTip] = useState('basari');

  const [formData, setFormData] = useState({
    name:       kullanici?.name       || localStorage.getItem('userName')  || '',
    email:      kullanici?.email      || localStorage.getItem('userEmail') || '',
    department: kullanici?.department || localStorage.getItem('userDept')  || '',
  });

  // ← Eksik olan state burası
  const [sifreBilgileri, setSifreBilgileri] = useState({
    eskiSifre: '', yeniSifre: '', yeniSifreTekrar: ''
  });

  const gosterBildirim = (metin, tip = 'basari') => {
    setMesaj(metin);
    setMesajTip(tip);
    setTimeout(() => setMesaj(null), 3000);
  };

  const fotografDegistir = (e) => {
    const dosya = e.target.files[0];
    if (dosya) {
      const okuyucu = new FileReader();
      okuyucu.onloadend = () => {
        const base64 = okuyucu.result;
        setProfilFotografi(base64);
        localStorage.setItem('profilFotografi', base64);
        gosterBildirim("Profil fotoğrafı güncellendi!");
      };
      okuyucu.readAsDataURL(dosya);
    }
  };

  const profiliKaydet = () => {
    localStorage.setItem('userName', formData.name);
    localStorage.setItem('userEmail', formData.email);
    localStorage.setItem('userDept', formData.department);
    setDuzenle(false);
    gosterBildirim("Profil bilgileri kaydedildi!");
  };

  // ← Eksik olan fonksiyon burası
  const sifreGuncellemeIstegi = async () => {
    const { eskiSifre, yeniSifre, yeniSifreTekrar } = sifreBilgileri;

    if (!eskiSifre || !yeniSifre || !yeniSifreTekrar) {
      gosterBildirim("Tüm alanları doldurun.", 'hata');
      return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      gosterBildirim("Yeni şifreler eşleşmiyor.", 'hata');
      return;
    }
    if (yeniSifre.length < 6) {
      gosterBildirim("Şifre en az 6 karakter olmalı.", 'hata');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ oldPassword: eskiSifre, newPassword: yeniSifre })
      });
      const data = await res.json();
      if (res.ok) {
        gosterBildirim("Şifre başarıyla güncellendi!");
        setSifreDegistiriliyorMu(false);
        setSifreBilgileri({ eskiSifre: '', yeniSifre: '', yeniSifreTekrar: '' });
      } else {
        gosterBildirim(data.message || "Şifre güncellenemedi.", 'hata');
      }
    } catch {
      gosterBildirim("Sunucuya bağlanılamadı.", 'hata');
    }
  };

  const stiller = {
    konteyner: { padding: '40px 20px', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, sans-serif', overflowY: 'auto' },
    anaKart: { maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' },
    solPanel: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '20px', textAlign: 'center', border: '1px solid #334155' },
    sagPanel: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '20px', border: '1px solid #334155' },
    avatar: { width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #f59e0b', margin: '0 auto 10px', objectFit: 'cover', cursor: 'pointer' },
    girdi: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', marginTop: '5px', boxSizing: 'border-box' },
    baslik: { fontSize: '18px', marginBottom: '20px', color: '#f59e0b', borderBottom: '1px solid #334155', paddingBottom: '10px' }
  };

  return (
    <div style={stiller.konteyner}>
      {/* Bildirim */}
      {mesaj && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: mesajTip === 'hata' ? '#dc2626' : '#059669', color: 'white', padding: '15px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1000 }}>
          <CheckCircle size={18}/> {mesaj}
        </div>
      )}

      <input type="file" ref={dosyaGirisRef} onChange={fotografDegistir} style={{ display: 'none' }} accept="image/*" />

      <button onClick={geriDon} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={18}/> Panele Dön
      </button>

      <div style={stiller.anaKart}>
        {/* SOL PANEL */}
        <div style={stiller.solPanel}>
          <img
            src={profilFotografi || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'U')}&background=334155&color=f8fafc`}
            style={stiller.avatar}
            onClick={() => dosyaGirisRef.current.click()}
            alt="Profil"
          />
          <p style={{ fontWeight: 'bold', fontSize: '20px', margin: '10px 0 5px' }}>{formData.name}</p>
          <div style={{ color: '#22c55e', fontSize: '12px', marginBottom: '15px' }}>● Aktif</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => { if (duzenle) profiliKaydet(); else setDuzenle(true); }}
              style={{ width: '100%', padding: '10px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Pencil size={16}/>
              {duzenle ? "Kaydet" : "Profili Düzenle"}
            </button>
            {duzenle && (
              <button onClick={() => setDuzenle(false)} style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8' }}>
                İptal
              </button>
            )}
            {profilFotografi && (
              <button onClick={() => { setProfilFotografi(null); localStorage.removeItem('profilFotografi'); gosterBildirim("Fotoğraf kaldırıldı!"); }}
                style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}>
                Fotoğrafı Kaldır
              </button>
            )}
          </div>
        </div>

        {/* SAĞ PANEL */}
        <div style={stiller.sagPanel}>
          {!sifreDegistiriliyorMu ? (
            <>
              <h3 style={stiller.baslik}>Kullanıcı Bilgileri</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Ad Soyad</label>
                  <input disabled={!duzenle} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ ...stiller.girdi, opacity: duzenle ? 1 : 0.7 }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Email</label>
                  <input disabled={!duzenle} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ ...stiller.girdi, opacity: duzenle ? 1 : 0.7 }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Departman</label>
                  <input disabled={!duzenle} value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} style={{ ...stiller.girdi, opacity: duzenle ? 1 : 0.7 }} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Rol</label>
                  <div style={{ ...stiller.girdi, marginTop: '5px', opacity: 0.6 }}>{(kullanici?.role || 'User').toUpperCase()}</div>
                </div>
              </div>

              <h3 style={{ ...stiller.baslik, marginTop: '30px' }}>Sistem & Hesap Detayları</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ padding: '15px', backgroundColor: '#0f172a', borderRadius: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>Son Giriş</div>
                  <div style={{ fontWeight: 'bold' }}>{localStorage.getItem('lastLogin') || 'Bilinmiyor'}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#0f172a', borderRadius: '10px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>Durum</div>
                  <div style={{ fontWeight: 'bold', color: '#22c55e' }}>Aktif</div>
                </div>
              </div>

              <button
                onClick={() => setSifreDegistiriliyorMu(true)}
                style={{ width: '100%', marginTop: '30px', padding: '12px', border: '1px solid #f59e0b', background: 'transparent', color: '#f59e0b', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Lock size={16}/> Şifremi Değiştir
              </button>
            </>
          ) : (
            <>
              <h3 style={stiller.baslik}>Şifre Değiştir</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Mevcut Şifre</label>
                  <input type="password" placeholder="••••••" style={stiller.girdi}
                    value={sifreBilgileri.eskiSifre}
                    onChange={(e) => setSifreBilgileri({...sifreBilgileri, eskiSifre: e.target.value})} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Yeni Şifre</label>
                  <input type="password" placeholder="••••••" style={stiller.girdi}
                    value={sifreBilgileri.yeniSifre}
                    onChange={(e) => setSifreBilgileri({...sifreBilgileri, yeniSifre: e.target.value})} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Yeni Şifre Tekrar</label>
                  <input type="password" placeholder="••••••" style={stiller.girdi}
                    value={sifreBilgileri.yeniSifreTekrar}
                    onChange={(e) => setSifreBilgileri({...sifreBilgileri, yeniSifreTekrar: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={sifreGuncellemeIstegi} style={{ flex: 1, padding: '12px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#0f172a' }}>
                  Kaydet
                </button>
                <button onClick={() => { setSifreDegistiriliyorMu(false); setSifreBilgileri({ eskiSifre: '', yeniSifre: '', yeniSifreTekrar: '' }); }}
                  style={{ padding: '12px 16px', backgroundColor: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white' }}>
                  <X size={18}/>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}