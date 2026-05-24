import React, { useRef, useState } from 'react';
import { Mail, Shield, Briefcase, Clock, ArrowLeft, Camera } from 'lucide-react';

export default function ProfilePage({ user, onBack }) {
  const fileInputRef = useRef(null);
  const [profilePic, setProfilePic] = useState(localStorage.getItem('profilePic') || null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilePic(base64String);
        localStorage.setItem('profilePic', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const styles = {
    container: { padding: '40px', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, sans-serif' },
    card: { backgroundColor: '#1e293b', borderRadius: '20px', padding: '40px', border: '1px solid #334155', maxWidth: '600px', margin: '0 auto' },
    // Profil fotoğrafı stilleri
    avatar: { 
      width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f59e0b', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', 
      fontWeight: 'bold', color: '#0f172a', margin: '0 auto 20px', cursor: 'pointer',
      backgroundImage: profilePic ? `url(${profilePic})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    },
    cameraOverlay: { position: 'absolute', bottom: '0', right: '0', backgroundColor: 'rgba(0,0,0,0.6)', padding: '5px', borderRadius: '50%', color: 'white' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', borderBottom: '1px solid #334155' },
    backBtn: { background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}><ArrowLeft size={18}/> Panele Dön</button>
      
      <div style={styles.card}>
        {/* AVATAR KISMI */}
        <div style={styles.avatar} onClick={() => fileInputRef.current.click()}>
          {!profilePic && (user?.name?.charAt(0).toUpperCase() || 'U')}
          <div style={styles.cameraOverlay}><Camera size={16}/></div>
        </div>
      
        <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{display: 'none'}} accept="image/*" />

        <h2 style={{ textAlign: 'center', margin: '0 0 20px' }}>{user?.name || 'Kullanıcı Adı'}</h2>

        <div style={{ marginTop: '30px' }}>
          <div style={styles.infoRow}>
            <Mail size={20} color="#f59e0b"/> 
            <strong>E-posta:</strong> {user?.email || 'Belirtilmemiş'}
          </div>
          
          <div style={styles.infoRow}>
            <Shield size={20} color="#f59e0b"/> 
            <strong>Rol:</strong> {user?.role ? user.role.toUpperCase() : 'Bilinmiyor'}
          </div>
          
          <div style={styles.infoRow}>
            <Briefcase size={20} color="#f59e0b"/> 
            <strong>Departman:</strong> {user?.department || 'Operasyon'}
          </div>

          <div style={styles.infoRow}>
            <Clock size={20} color="#f59e0b"/> 
            <strong>Son Giriş:</strong> {localStorage.getItem('lastLogin') || 'Henüz giriş yapmadı'}
          </div>
        </div>
      </div>
    </div>
  );
}