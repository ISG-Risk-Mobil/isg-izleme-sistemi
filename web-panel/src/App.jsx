import React, { useState, useEffect } from 'react';
import Login from './pages/LoginPage';

const RENKLER = {
  lacivert: '#0F172A',
  altin: '#F59E0B',
  beyaz: '#F8FAFC'
};

function App() {
  const [gosterimModu, setGosterimModu] = useState('HERO'); // HERO veya AUTH
  const [kayitMi, setKayitMi] = useState(false);
  const [yazi, setYazi] = useState('');
  const tamMetin = "VISIONGUARD";

  // DÜZELTME 1: Fonksiyonu return'den ÖNCEYE taşıdık
  const authAc = (kayitModu) => {
    setKayitMi(kayitModu);
    setGosterimModu('AUTH');
  };

  // Daktilo Animasyonu
  useEffect(() => {
    let i = 0;
    let siliniyorMu = false;
    
    const zamanlayici = setInterval(() => {
      setYazi(tamMetin.slice(0, i));

      if (!siliniyorMu) {
        i++;
        if (i > tamMetin.length) {
          siliniyorMu = true;
        }
      } else {
        i--;
        if (i < 0) {
          siliniyorMu = false;
          i = 0;
        }
      }
    }, siliniyorMu ? 100 : 200);

    return () => clearInterval(zamanlayici);
  }, []);

  // DÜZELTME 2: return her zaman fonksiyonun en sonunda olmalı
  return (
    <div style={anaKonteyner}>
      {/* Navigasyon Barı */}
      {/* Navigasyon Barı */}
<nav style={navBar}>
  <div style={{ fontWeight: '800', letterSpacing: '2px', color: RENKLER.altin }}>VG-SYSTEMS</div>
  <div style={{ display: 'flex', gap: '15px' }}>
    
    {/* Giriş Yap Butonu - Güncellendi */}
    <button 
      onClick={() => authAc(false)} 
      style={{ ...navButon, backgroundColor: RENKLER.altin, color: RENKLER.lacivert }}
    >
      Giriş Yap
    </button>

    {/* Hesap Oluştur Butonu */}
    <button 
      onClick={() => authAc(true)} 
      style={{ ...navButon, backgroundColor: RENKLER.altin, color: RENKLER.lacivert }}
    >
      Hesap Oluştur
    </button>
    
  </div>
</nav>

      {/* İçerik Alanı */}
      <div style={icerikAlani}>
        {gosterimModu === 'HERO' ? (
          <div style={heroMerkez}>
            <h1 style={devBaslik}>
              {yazi}<span className="imlec">|</span>
            </h1>
            <p style={heroAltYazi}>Yapay Zeka Destekli İş Sağlığı ve Güvenliği Analiz Paneli</p>
          </div>
        ) : (
          <div style={authOverlay}>
            <button onClick={() => setGosterimModu('HERO')} style={vazgecButon}>✕ Vazgeç</button>
            <Login baslangicKayitMi={kayitMi} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes yanSon { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
        .imlec { animation: yanSon 0.8s infinite; color: ${RENKLER.altin}; }
      `}</style>
    </div>
  );
}

// Stiller (Aynı kalıyor)
const anaKonteyner = { backgroundColor: RENKLER.lacivert, height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', fontFamily: "'Inter', sans-serif" };
const navBar = { position: 'absolute', top: 0, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px 60px', boxSizing: 'border-box', zIndex: 100 };
const navButon = { padding: '10px 25px', borderRadius: '10px', border: `1px solid ${RENKLER.altin}`, backgroundColor: 'transparent', color: RENKLER.altin, cursor: 'pointer', fontWeight: '700', transition: '0.3s' };
const icerikAlani = { height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const heroMerkez = { textAlign: 'center' };
const devBaslik = { fontSize: '90px', color: '#FFF', letterSpacing: '10px', margin: 0, fontWeight: '900' };
const heroAltYazi = { color: '#64748B', fontSize: '18px', marginTop: '20px', letterSpacing: '2px' };
const authOverlay = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 1000 };
const vazgecButon = { position: 'absolute', top: '40px', right: '60px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '18px' };

export default App;