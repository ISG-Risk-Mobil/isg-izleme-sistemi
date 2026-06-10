import React, { useRef, useState } from 'react';
import { Mail, Shield, ArrowLeft, Lock, X, Pencil, User, Briefcase, Clock, CheckCircle, Save } from 'lucide-react';

export default function ProfilSayfasi({ kullanici = {}, geriDon }) {
  const dosyaGirisRef = useRef(null);
  const [profilFotografi, setProfilFotografi] = useState(localStorage.getItem('profilFotografi') || null);
  const [duzenle, setDuzenle] = useState(false);
  const [sifreDegistiriliyorMu, setSifreDegistiriliyorMu] = useState(false);
  const [mesaj, setMesaj] = useState(null);
  
  // Düzenlenebilir alanlar için state
  const [formData, setFormData] = useState({
    name: kullanici?.name || localStorage.getItem('userName') || '',
    email: kullanici?.email || localStorage.getItem('userEmail') || ''
  });

  const gosterBildirim = (metin) => {
    setMesaj(metin);
    setTimeout(() => setMesaj(null), 3000);
  };

  const fotografDegistir = (e) => {
    const dosya = e.target.files[0];
    if (dosya) {
      const okuyucu = new FileReader();
      okuyucu.onloadend = () => {
        const base64Verisi = okuyucu.result;
        setProfilFotografi(base64Verisi);
        localStorage.setItem('profilFotografi', base64Verisi);
        gosterBildirim("Profil fotoğrafı güncellendi!");
      };
      okuyucu.readAsDataURL(dosya);
    }
  };

  const profiliKaydet = () => {
    localStorage.setItem('userName', formData.name);
    localStorage.setItem('userEmail', formData.email);
    setDuzenle(false);
    gosterBildirim("Profil bilgileri kaydedildi!");
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
      {mesaj && <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#059669', color: 'white', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', zIndex: 1000 }}><CheckCircle style={{ marginRight: '10px' }} /> {mesaj}</div>}
      
      <input type="file" ref={dosyaGirisRef} onChange={fotografDegistir} style={{ display: 'none' }} accept="image/*" />

      <button onClick={geriDon} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={18} style={{ display: 'inline', marginRight: '5px' }} /> Panele Dön
      </button>

      <div style={stiller.anaKart}>
        {/* SOL PANEL - GÜNCELLENMİŞ VERSİYON */}
<div style={stiller.solPanel}>
  <div style={{ position: 'relative', display: 'inline-block' }}>
    <img 
      src={profilFotografi || "https://ui-avatars.com/api/?name=User"} 
      style={stiller.avatar} 
      onClick={() => dosyaGirisRef.current.click()} 
      alt="Profil" 
    />
  </div>
  <p style={{ fontWeight: 'bold', fontSize: '20px', margin: '10px 0 5px' }}>{formData.name}</p>
  <div style={{ color: '#22c55e', fontSize: '12px', marginBottom: '15px' }}>● Aktif</div>

  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <button onClick={() => setDuzenle(!duzenle)} style={{ width: '100%', padding: '10px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
      <Pencil size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> 
      {duzenle ? "İptal" : "Profili Düzenle"}
    </button>

    {/* Fotoğrafı Kaldır Butonu */}
    {profilFotografi && (
      <button 
        onClick={() => {
          setProfilFotografi(null);
          localStorage.removeItem('profilFotografi');
          gosterBildirim("Fotoğraf kaldırıldı!");
        }} 
        style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}
      >
        Fotoğrafı Kaldır
      </button>
    )}
  </div>
</div>

        {/* SAĞ PANEL - GÜNCEL */}
{/* SAĞ PANEL - ŞİFRE DEĞİŞTİRME ENTEGRE GÜNCEL VERSİYON */}
        <div style={stiller.sagPanel}>
          {!sifreDegistiriliyorMu ? (
            <>
              <h3 style={stiller.baslik}>Kullanıcı Bilgileri</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Ad Soyad</label>
                  <input disabled={!duzenle} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={stiller.girdi} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Email</label>
                  <input disabled={!duzenle} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={stiller.girdi} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Departman</label>
                  <input disabled={!duzenle} value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} style={stiller.girdi} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>Rol</label>
                  <div style={{ ...stiller.girdi, opacity: 0.6 }}>{(kullanici?.role || 'User').toUpperCase()}</div>
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

              <button onClick={() => setSifreDegistiriliyorMu(true)} style={{ width: '100%', marginTop: '30px', padding: '12px', border: '1px solid #f59e0b', background: 'transparent', color: '#f59e0b', borderRadius: '8px', cursor: 'pointer' }}>
                <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Şifremi Değiştir
              </button>
            </>
          ) : (
            <div>
              <h3 style={stiller.baslik}>Şifre Değiştir</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="password" placeholder="Eski Şifre" style={stiller.girdi} onChange={(e) => setSifreBilgileri({...sifreBilgileri, eskiSifre: e.target.value})} />
                <input type="password" placeholder="Yeni Şifre" style={stiller.girdi} onChange={(e) => setSifreBilgileri({...sifreBilgileri, yeniSifre: e.target.value})} />
                <input type="password" placeholder="Yeni Şifre Tekrar" style={stiller.girdi} onChange={(e) => setSifreBilgileri({...sifreBilgileri, yeniSifreTekrar: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={sifreGuncellemeIstegi} style={{ flex: 1, padding: '12px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Kaydet</button>
                <button onClick={() => setSifreDegistiriliyorMu(false)} style={{ padding: '12px', backgroundColor: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white' }}><X size={18} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}