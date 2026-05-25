const DANGEROUS_ZONES = [
  { name: 'Kimyasal Depo', lat: 40.1920, lng: 29.0610, radius: 50 },
  { name: 'Elektrik Odası', lat: 40.1925, lng: 29.0615, radius: 30 },
];

const THRESHOLDS = {
  HARD_IMPACT_G: 0.2,
  FALL_G: 1.5,
  INACTIVITY_MINUTES: 30,
  LOW_BATTERY: 15,
};

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function analyzeSensorData(sensorData, lastLogs) {
  const alarms = [];

  const { accelerometer, location, batteryLevel } = sensorData;

  // 1. Sert darbe / düşme analizi
  if (accelerometer?.magnitude > THRESHOLDS.HARD_IMPACT_G) {
    const isFall =
      accelerometer.magnitude > THRESHOLDS.FALL_G;

    alarms.push({
      type: isFall ? 'FALL_DETECTED' : 'HARD_IMPACT',
      severity: isFall ? 'CRITICAL' : 'HIGH',
      description: `İvme büyüklüğü: ${accelerometer.magnitude.toFixed(2)}g`,
      sensorData: accelerometer,
    });
  }

  // 2. Tehlikeli bölge analizi
  if (location?.latitude && location?.longitude) {
    for (const zone of DANGEROUS_ZONES) {
      const dist = getDistance(
        location.latitude,
        location.longitude,
        zone.lat,
        zone.lng,
      );

      if (dist < zone.radius) {
        alarms.push({
          type: 'DANGEROUS_ZONE',
          severity: 'HIGH',
          description: `${zone.name} bölgesine girildi (${dist.toFixed(0)}m)`,
          sensorData: location,
        });
      }
    }
  }

  // 3. Hareketsizlik analizi
  if (lastLogs && lastLogs.length >= 3) {
    const allStill = lastLogs.every(
      (log) => log.accelerometer?.magnitude < 0.3,
    );

    const oldestLog = lastLogs[lastLogs.length - 1];

    const timeSpan =
      (Date.now() - new Date(oldestLog.timestamp).getTime()) /
      60000;

    if (
      allStill &&
      timeSpan > THRESHOLDS.INACTIVITY_MINUTES
    ) {
      alarms.push({
        type: 'INACTIVITY',
        severity: 'MEDIUM',
        description: `${timeSpan.toFixed(1)} dakika hareketsizlik tespit edildi`,
        sensorData: {
          duration: timeSpan,
        },
      });
    }
  }

  // 4. Düşük pil analizi
  if (
    typeof batteryLevel === 'number' &&
    batteryLevel < THRESHOLDS.LOW_BATTERY
  ) {
    alarms.push({
      type: 'LOW_BATTERY',
      severity: 'LOW',
      description: `Pil seviyesi: %${batteryLevel}`,
      sensorData: {
        batteryLevel,
      },
    });
  }

  return alarms;
}

module.exports = {
  analyzeSensorData,
};