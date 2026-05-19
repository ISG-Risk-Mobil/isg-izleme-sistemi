import React from 'react';

// Renk paleti sabitleri
const COLORS = {
  danger: '#EF4444',  // Kırmızı (Baret Yok / Acil)
  warning: '#F59E0B', // Turuncu (Dikkat)
  success: '#10B981', // Yeşil (Güvenli)
  info: '#3B82F6',    // Mavi (Bilgilendirme)
  background: '#F3F4F6',
  cardBg: '#FFFFFF',
  textMain: '#1F2937'
};

function Dashboard() {
  // Örnek veriler (Normalde backend'den gelecek)
  const alerts = [
    { id: 1, type: 'danger', msg: 'Bölge A: Baret Takmayan Personel!', time: '14:20' },
    { id: 2, type: 'warning', msg: 'Bölge C: Yüksek Gürültü Seviyesi', time: '14:15' },
    { id: 3, type: 'success', msg: 'Giriş Kapısı: KKD Kontrolü Tamam', time: '14:10' }
  ];

  return (
    <div style={{ 
      backgroundColor: COLORS.background, 
      minHeight: '100vh', 
      padding: '40px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: COLORS.textMain
    }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>İSG Mobil Risk Analiz Paneli</h1>
        <p style={{ color: '#6B7280' }}>Bursa Fabrika Sahası - Anlık Veri Akışı</p>
      </header>

      {/* Özet Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={cardStyle(COLORS.danger)}>
          <span style={{ fontSize: '14px' }}>Aktif İhlaller</span>
          <h2 style={{ fontSize: '32px', margin: '10px 0' }}>3</h2>
        </div>
        <div style={cardStyle(COLORS.success)}>
          <span style={{ fontSize: '14px' }}>Güvenli Alanlar</span>
          <h2 style={{ fontSize: '32px', margin: '10px 0' }}>12</h2>
        </div>
        <div style={cardStyle(COLORS.info)}>
          <span style={{ fontSize: '14px' }}>Toplam Personel</span>
          <h2 style={{ fontSize: '32px', margin: '10px 0' }}>45</h2>
        </div>
      </div>

      {/* Canlı Akış Listesi */}
      <div style={{ backgroundColor: COLORS.cardBg, borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ borderBottom: '2px solid #F3F4F6', paddingBottom: '10px', marginBottom: '20px' }}>Canlı Risk Akışı</h3>
        {alerts.map(alert => (
          <div key={alert.id} style={alertItemStyle(COLORS[alert.type])}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600' }}>{alert.msg}</span>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Yardımcı Tasarım Fonksiyonları
const cardStyle = (color) => ({
  backgroundColor: COLORS.cardBg,
  padding: '20px',
  borderRadius: '12px',
  borderLeft: `6px solid ${color}`,
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
});

const alertItemStyle = (color) => ({
  padding: '15px',
  marginBottom: '10px',
  borderRadius: '8px',
  backgroundColor: `${color}15`, // Rengin çok açık versiyonu (opaklık eklenmiş)
  borderLeft: `4px solid ${color}`,
  color: color
});

export default Dashboard;