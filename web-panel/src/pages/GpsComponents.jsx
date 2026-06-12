import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, RefreshCw, Wifi, WifiOff } from 'lucide-react';

// ── Ortak: Leaflet CDN yükle ──────────────────────────────
function leafletYukle() {
  return new Promise((resolve) => {
    if (window.L) { resolve(); return; }
    if (!document.querySelector('link[href*="leaflet"]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }
    if (document.querySelector('script[src*="leaflet"]')) {
      const bekle = setInterval(() => { if (window.L) { clearInterval(bekle); resolve(); } }, 80);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

const HARITA_CSS = `
  .leaflet-popup-content-wrapper{background:#1e293b!important;border:1px solid #334155!important;border-radius:10px!important;box-shadow:0 8px 24px rgba(0,0,0,.6)!important}
  .leaflet-popup-content{color:#e2e8f0!important}
  .leaflet-popup-tip{background:#1e293b!important}
  .leaflet-popup-close-button{color:#64748b!important}
  .leaflet-control-zoom a{background:#1e293b!important;border-color:#334155!important;color:#94a3b8!important}
  .leaflet-control-zoom a:hover{background:#334155!important;color:#f8fafc!important}
  @keyframes gps-pulse{0%,100%{box-shadow:0 0 0 4px rgba(245,158,11,.35),0 4px 16px rgba(0,0,0,.5)}50%{box-shadow:0 0 0 12px rgba(245,158,11,.08),0 4px 16px rgba(0,0,0,.5)}}
  @keyframes gps-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
`;


// ══════════════════════════════════════════════════════════
//  KisiselKonum — Ana Panel'de kişinin kendi konumu
//  Kullanım: <KisiselKonum styles={styles} />
// ══════════════════════════════════════════════════════════
export function KisiselKonum({ styles }) {
  const mapRef        = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef     = useRef(null);
  const watchIdRef    = useRef(null);

  const [konum,         setKonum]         = useState(null);
  const [hata,          setHata]          = useState(null);
  const [yukleniyor,    setYukleniyor]    = useState(true);
  const [sonGuncelleme, setSonGuncelleme] = useState(null);

  const haritaOlustur = async (lat, lng, accuracy) => {
    await leafletYukle();
    const L = window.L;
    if (!mapRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.setView([lat, lng], 15);
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      return;
    }

    const map = L.map(mapRef.current, {
      center: [lat, lng], zoom: 15,
      zoomControl: true, attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    const ikon = L.divIcon({
      className: '',
      html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);border:3px solid #fff;box-shadow:0 0 0 4px rgba(245,158,11,0.3),0 4px 16px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;animation:gps-pulse 2s infinite">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      </div>`,
      iconSize: [40, 40], iconAnchor: [20, 40],
    });

    const marker = L.marker([lat, lng], { icon: ikon })
      .addTo(map)
      .bindPopup(`<b>${localStorage.getItem('userName') || 'Konumunuz'}</b><br><span style="font-size:12px;color:#94a3b8">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`);

    if (accuracy) {
      L.circle([lat, lng], { radius: accuracy, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.07, weight: 1 }).addTo(map);
    }

    markerRef.current     = marker;
    leafletMapRef.current = map;
  };

  const konumAl = () => {
    if (!navigator.geolocation) { setHata('Tarayıcınız konum özelliğini desteklemiyor.'); setYukleniyor(false); return; }
    setYukleniyor(true); setHata(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng, accuracy } }) => {
        setKonum({ lat, lng, accuracy });
        setSonGuncelleme(new Date());
        setYukleniyor(false);
        haritaOlustur(lat, lng, accuracy);
      },
      () => { setHata('Konum erişimi reddedildi. Tarayıcı izinlerini kontrol edin.'); setYukleniyor(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    konumAl();
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        ({ coords: { latitude: lat, longitude: lng, accuracy } }) => {
          setKonum({ lat, lng, accuracy });
          setSonGuncelleme(new Date());
          haritaOlustur(lat, lng, accuracy);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
    return () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  return (
    <div style={{ ...styles.card, gridColumn: 'span 12' }}>
      <style>{HARITA_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ ...styles.title, marginBottom: 0 }}>
          <MapPin size={14} color="#f59e0b" /> Anlık Konumum
          {konum && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#22c55e20', color: '#22c55e', fontWeight: '600', marginLeft: '8px' }}>
              <Wifi size={10} /> Canlı
            </span>
          )}
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {sonGuncelleme && <span style={{ fontSize: '11px', color: '#64748b' }}>{sonGuncelleme.toLocaleTimeString('tr-TR')} güncellendi</span>}
          <button onClick={konumAl} style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
            <RefreshCw size={12} /> Yenile
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
        {yukleniyor && !hata && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, backgroundColor: '#0f172acc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <Navigation size={28} color="#f59e0b" style={{ animation: 'gps-spin 1.5s linear infinite' }} />
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Konum alınıyor...</p>
          </div>
        )}
        {hata ? (
          <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', backgroundColor: '#0f172a' }}>
            <WifiOff size={32} color="#ef4444" />
            <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{hata}</p>
            <button onClick={konumAl} style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px' }}>Tekrar Dene</button>
          </div>
        ) : (
          <div ref={mapRef} style={{ height: '300px', width: '100%' }} />
        )}
      </div>

      {konum && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' }}>
          {[
            { label: 'Enlem',    value: konum.lat.toFixed(6) + '°',  renk: '#6366f1' },
            { label: 'Boylam',   value: konum.lng.toFixed(6) + '°',  renk: '#6366f1' },
            { label: 'Doğruluk', value: `±${Math.round(konum.accuracy)}m`, renk: konum.accuracy < 20 ? '#22c55e' : konum.accuracy < 100 ? '#f59e0b' : '#ef4444' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 14px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{item.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '700', color: item.renk, fontFamily: 'monospace' }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════
//  KullaniciKonumModal — Yönetim paneli kullanıcı modalı içinde
//
//  MongoDB'den gelen format: { latitude, longitude, accuracy }
//
//  Dashboard.jsx'te kullanıcı detay modalına sekme olarak ekle:
//
//  1) State ekle:
//     const [modalSekme, setModalSekme] = useState('detay');
//
//  2) secilenKullanici null yapılan yerlere ekle:
//     setModalSekme('detay');
//
//  3) Modal başlığından sonra sekme butonları ekle (aşağıda gösterildi)
//
//  4) Modal içeriğini koşullu göster (aşağıda gösterildi)
// ══════════════════════════════════════════════════════════
export function KullaniciKonumModal({ kullanici }) {
  const mapRef        = useRef(null);
  const leafletMapRef = useRef(null);

  const [konum,      setKonum]      = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata,       setHata]       = useState(null);

  const konumCek = async () => {
    setYukleniyor(true); setHata(null);
    try {
      // sensorData.js'e eklediğimiz endpoint'i çağır
      const res = await fetch(
        `http://localhost:5000/api/sensor-data/user-location/${kullanici._id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Konum verisi alınamadı');
      }

      // MongoDB'den gelen format: { latitude, longitude, accuracy }
      const { latitude, longitude, accuracy } = data.location;

      if (!latitude || !longitude) {
        throw new Error('Konum verisi henüz gönderilmemiş');
      }

      setKonum({ lat: latitude, lng: longitude, accuracy, lastSeen: data.lastSeen });
    } catch (err) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  };

  const haritaOlustur = async (lat, lng, accuracy) => {
    await leafletYukle();
    const L = window.L;
    if (!mapRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.setView([lat, lng], 15);
      return;
    }

    const map = L.map(mapRef.current, {
      center: [lat, lng], zoom: 15,
      zoomControl: true, attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    const isAdmin = kullanici.role === 'admin';
    const renk    = isAdmin ? '#f59e0b' : '#22c55e';

    const ikon = L.divIcon({
      className: '',
      html: `<div style="width:40px;height:40px;border-radius:50%;background:${renk}22;border:3px solid ${renk};box-shadow:0 0 0 5px ${renk}33,0 4px 16px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;animation:gps-pulse 2s infinite">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${renk}">
          ${isAdmin
            ? '<path d="M12 1l2.753 8.472H23l-7.176 5.217 2.753 8.472L12 18.944l-6.577 4.217 2.753-8.472L2 10.472h8.247L12 1z"/>'
            : '<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>'}
        </svg>
      </div>`,
      iconSize: [40, 40], iconAnchor: [20, 40],
    });

    L.marker([lat, lng], { icon: ikon })
      .addTo(map)
      .bindPopup(`<b>${kullanici.name}</b><br><span style="font-size:11px;color:#94a3b8">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`)
      .openPopup();

    if (accuracy) {
      L.circle([lat, lng], { radius: accuracy, color: renk, fillColor: renk, fillOpacity: 0.08, weight: 1 }).addTo(map);
    }

    leafletMapRef.current = map;
  };

  useEffect(() => {
    konumCek();
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, [kullanici._id]);

  useEffect(() => {
    if (konum && !yukleniyor) {
      setTimeout(() => haritaOlustur(konum.lat, konum.lng, konum.accuracy), 80);
    }
  }, [konum, yukleniyor]);

  return (
    <div>
      <style>{HARITA_CSS}</style>

      {/* Yükleniyor */}
      {yukleniyor && (
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', backgroundColor: '#0f172a', borderRadius: '12px' }}>
          <Navigation size={30} color="#f59e0b" style={{ animation: 'gps-spin 1.5s linear infinite' }} />
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{kullanici.name} konumu yükleniyor...</p>
        </div>
      )}

      {/* Hata */}
      {!yukleniyor && hata && (
        <div style={{ height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #ef444430' }}>
          <WifiOff size={32} color="#ef4444" />
          <p style={{ color: '#ef4444', fontSize: '13px', margin: 0, textAlign: 'center' }}>{hata}</p>
          <p style={{ color: '#64748b', fontSize: '12px', margin: 0, textAlign: 'center' }}>Kullanıcı henüz konum göndermemiş olabilir.</p>
          <button onClick={konumCek} style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} /> Tekrar Dene
          </button>
        </div>
      )}

      {/* Harita + Bilgi kartları */}
      {!yukleniyor && !hata && konum && (
        <>
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', marginBottom: '12px' }}>
            <div ref={mapRef} style={{ height: '280px', width: '100%' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'Enlem',          value: konum.lat.toFixed(6) + '°',  renk: '#6366f1' },
              { label: 'Boylam',         value: konum.lng.toFixed(6) + '°',  renk: '#6366f1' },
              { label: 'Doğruluk',       value: konum.accuracy ? `±${Math.round(konum.accuracy)}m` : '—', renk: !konum.accuracy ? '#64748b' : konum.accuracy < 20 ? '#22c55e' : konum.accuracy < 100 ? '#f59e0b' : '#ef4444' },
              { label: 'Son Güncelleme', value: new Date(konum.lastSeen).toLocaleString('tr-TR'), renk: '#94a3b8' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px 12px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: '700', color: item.renk, fontFamily: 'monospace' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <a
            href={`https://www.google.com/maps?q=${konum.lat},${konum.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', fontSize: '12px', textDecoration: 'none' }}
          >
            <MapPin size={12} /> Google Maps'te Aç
          </a>
        </>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════
//  KisiselKonumMobil — Ana Panel'de mobilden gelen konum
//  Kullanım: <KisiselKonumMobil styles={styles} />
// ══════════════════════════════════════════════════════════
export function KisiselKonumMobil({ styles }) {
  const mapRef        = useRef(null);
  const leafletMapRef = useRef(null);

  const [konum,         setKonum]         = useState(null);
  const [yukleniyor,    setYukleniyor]    = useState(true);
  const [hata,          setHata]          = useState(null);
  const [sonGuncelleme, setSonGuncelleme] = useState(null);

  const konumCek = async () => {
    setYukleniyor(true); setHata(null);
    try {
      const res = await fetch('http://localhost:5000/api/sensor-data/my-location', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Konum alınamadı');

      const { latitude, longitude, accuracy } = data.location;
      if (!latitude || !longitude) throw new Error('Konum verisi henüz gönderilmemiş');

      setKonum({ lat: latitude, lng: longitude, accuracy, lastSeen: data.lastSeen });
      setSonGuncelleme(new Date(data.lastSeen));
    } catch (err) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  };

  const haritaOlustur = async (lat, lng, accuracy) => {
    await leafletYukle();
    const L = window.L;
    if (!mapRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.setView([lat, lng], 15);
      return;
    }

    const map = L.map(mapRef.current, {
      center: [lat, lng], zoom: 15,
      zoomControl: true, attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    const ikon = L.divIcon({
      className: '',
      html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);border:3px solid #fff;box-shadow:0 0 0 4px rgba(245,158,11,0.3),0 4px 16px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;animation:gps-pulse 2s infinite">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      </div>`,
      iconSize: [40, 40], iconAnchor: [20, 40],
    });

    L.marker([lat, lng], { icon: ikon })
      .addTo(map)
      .bindPopup(`<b>${localStorage.getItem('userName') || 'Konumunuz'}</b><br><span style="font-size:12px;color:#94a3b8">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`)
      .openPopup();

    if (accuracy) {
      L.circle([lat, lng], { radius: accuracy, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.08, weight: 1 }).addTo(map);
    }

    leafletMapRef.current = map;
  };

  useEffect(() => {
    konumCek();
    // Her 30 saniyede otomatik yenile
    const interval = setInterval(konumCek, 30000);
    return () => {
      clearInterval(interval);
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (konum && !yukleniyor) {
      setTimeout(() => haritaOlustur(konum.lat, konum.lng, konum.accuracy), 80);
    }
  }, [konum, yukleniyor]);

  return (
    <div style={{ ...styles.card, gridColumn: 'span 12' }}>
      <style>{HARITA_CSS}</style>

      {/* Başlık */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ ...styles.title, marginBottom: 0 }}>
          <MapPin size={14} color="#f59e0b" /> Anlık Konumum
          {konum && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#22c55e20', color: '#22c55e', fontWeight: '600', marginLeft: '8px' }}>
              <Wifi size={10} /> Mobil
            </span>
          )}
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {sonGuncelleme && (
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Son güncelleme: {sonGuncelleme.toLocaleString('tr-TR')}
            </span>
          )}
          <button onClick={konumCek} style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
            <RefreshCw size={12} /> Yenile
          </button>
        </div>
      </div>

      {/* Yükleniyor */}
      {yukleniyor && (
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
          <Navigation size={30} color="#f59e0b" style={{ animation: 'gps-spin 1.5s linear infinite' }} />
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Konum yükleniyor...</p>
        </div>
      )}

      {/* Hata */}
      {!yukleniyor && hata && (
        <div style={{ height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #ef444430' }}>
          <WifiOff size={32} color="#ef4444" />
          <p style={{ color: '#ef4444', fontSize: '13px', margin: 0, textAlign: 'center' }}>{hata}</p>
          <p style={{ color: '#64748b', fontSize: '12px', margin: 0, textAlign: 'center' }}>Mobil uygulamadan konum gönderilmemiş olabilir.</p>
          <button onClick={konumCek} style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} /> Tekrar Dene
          </button>
        </div>
      )}

      {/* Harita */}
      {!yukleniyor && !hata && konum && (
        <>
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', marginBottom: '12px' }}>
            <div ref={mapRef} style={{ height: '300px', width: '100%' }} />
          </div>

          {/* Koordinat kartları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'Enlem',          value: konum.lat.toFixed(6) + '°',  renk: '#6366f1' },
              { label: 'Boylam',         value: konum.lng.toFixed(6) + '°',  renk: '#6366f1' },
              { label: 'Doğruluk',       value: konum.accuracy ? `±${Math.round(konum.accuracy)}m` : '—', renk: !konum.accuracy ? '#64748b' : konum.accuracy < 20 ? '#22c55e' : konum.accuracy < 100 ? '#f59e0b' : '#ef4444' },
              { label: 'Son Güncelleme', value: new Date(konum.lastSeen).toLocaleTimeString('tr-TR'), renk: '#94a3b8' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px 14px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{item.label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: '700', color: item.renk, fontFamily: 'monospace' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
