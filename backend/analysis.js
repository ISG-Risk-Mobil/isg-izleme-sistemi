const THRESHOLDS = {
  fall: 25,        // ivmeölçer toplam şiddeti (m/s²) — düşme
  impact: 20,      // ani darbe eşiği
  stillness: 10.5,  // hareketsizlik eşiği (çok düşük hareket)
  stillDuration: 5 // kaç ardışık kayıt hareketsiz kalırsa alarm
};

// Toplam ivme şiddetini hesapla
function magnitude(accel) {
  if (accel?.magnitude != null) return accel.magnitude;
  const { x = 0, y = 0, z = 0 } = accel;
  return Math.sqrt(x * x + y * y + z * z);
}

// Tek kayıt için anlık risk analizi
function analyzeSingle(sensorData) {
  const results = [];
  const mag = magnitude(sensorData.accelerometer || {});

  if (mag > THRESHOLDS.fall) {
    results.push({
      type: 'fall',
      level: 'critical',
      message: `Düşme şüphesi — ivme şiddeti: ${mag.toFixed(2)} m/s²`,
      latitude: sensorData.location?.lat,
      longitude: sensorData.location?.lng
    });
  } else if (mag > THRESHOLDS.impact) {
    results.push({
      type: 'impact',
      level: 'high',
      message: `Sert darbe algılandı — ivme şiddeti: ${mag.toFixed(2)} m/s²`,
      latitude: sensorData.location?.lat,
      longitude: sensorData.location?.lng
    });
  }

  return results;
}

// Zaman serisi analizi — son N kayıt üzerinde hareketsizlik tespiti
function analyzeTimeSeries(dataArray) {
  const results = [];
  if (!dataArray || dataArray.length < 3) return results; // 3σ için minimum

  // Hareketsizlik kontrolü — ayrı minimum
  if (dataArray.length >= THRESHOLDS.stillDuration) {
    const recent = dataArray.slice(-THRESHOLDS.stillDuration);
    const allStill = recent.every(d => {
    const mag = magnitude(d.accelerometer || {});
    return Math.abs(mag - 9.8) < 0.7;
    });
    if (allStill) {
      const last = recent[recent.length - 1];
      results.push({
        type: 'stillness',
        level: 'high',
        message: `Uzun süreli hareketsizlik — ${THRESHOLDS.stillDuration} ardışık ölçümde hareket yok`,
        latitude: last.location?.lat,
        longitude: last.location?.lng
      });
    }
  }

  // 3σ anomali — her zaman çalışır (min 3 veri yeterli)
  const magnitudes = dataArray.map(d => magnitude(d.accelerometer || {}));
  const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const std = Math.sqrt(
    magnitudes.map(m => Math.pow(m - mean, 2)).reduce((a, b) => a + b, 0) / magnitudes.length
  );
  const lastMag = magnitudes[magnitudes.length - 1];
  if (std > 0 && Math.abs(lastMag - mean) > 3 * std) {
    const last = dataArray[dataArray.length - 1];
    results.push({
      type: 'anomaly',
      level: 'medium',
      message: `Olağandışı hareket — ortalama: ${mean.toFixed(2)}, son değer: ${lastMag.toFixed(2)}`,
      latitude: last.location?.lat,
      longitude: last.location?.lng
    });
  }

  return results;
}

module.exports = { analyzeSingle, analyzeTimeSeries };  