import React, {useEffect, useMemo, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';

import {useAuth} from '../../context/AuthContext';

import {
  getUsers,
  makeUserAdmin,
  makeUserWorker,
} from '../../services/api/authService';

import {getDevices} from '../../services/api/deviceService';

import {getAlarms, resolveAlarm} from '../../services/api/alarmService';

type TabType = 'users' | 'alarms' | 'devices';
type AlarmFilterType = 'all' | 'active' | 'resolved' | 'critical' | 'today';

const AdminManagementScreen = ({navigation}: any) => {
  const {token, user} = useAuth();

  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [alarmFilter, setAlarmFilter] = useState<AlarmFilterType>('all');
  const [searchText, setSearchText] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [alarms, setAlarms] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [roleChangingUserId, setRoleChangingUserId] = useState<string | null>(
    null,
  );

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedAlarm, setSelectedAlarm] = useState<any | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);

  const normalizeUsersResponse = (response: any) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.success) {
      return response.users || [];
    }

    return [];
  };

  const getId = (item: any) => {
    if (!item) {
      return null;
    }

    if (typeof item === 'string') {
      return item;
    }

    return item._id || item.id || null;
  };

  const getUserId = (item: any) => {
    return item?._id || item?.id;
  };

  const getCurrentUserId = () => {
    return (user as any)?._id || (user as any)?.id;
  };

  const getAlarmUserId = (alarm: any) => {
    return getId(alarm?.userId);
  };

  const getAlarmDeviceId = (alarm: any) => {
    return getId(alarm?.deviceId);
  };

  const getDeviceAssignedUserId = (device: any) => {
    return getId(device?.assignedUser);
  };

  const isSameId = (first: any, second: any) => {
    if (!first || !second) {
      return false;
    }

    return String(first) === String(second);
  };

  const formatDate = (value: any) => {
    if (!value) {
      return 'Tarih yok';
    }

    return new Date(value).toLocaleString('tr-TR');
  };

  const formatJson = (value: any) => {
    if (!value) {
      return 'Veri yok';
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const isToday = (value: any) => {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    const today = new Date();

    return date.toDateString() === today.toDateString();
  };

  const fetchAdminData = async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const usersResponse = await getUsers(token);
      const devicesResponse = await getDevices(token);
      const alarmsResponse = await getAlarms(token);

      setUsers(normalizeUsersResponse(usersResponse));

      if (devicesResponse?.success) {
        setDevices(devicesResponse.devices || []);
      }

      if (alarmsResponse?.success) {
        setAlarms(alarmsResponse.alarms || []);
      }
    } catch (error) {
      console.log('ADMIN MANAGEMENT ERROR:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token, isAdmin]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const changeUserRole = async (
    targetUserId: string,
    newRole: 'admin' | 'worker',
  ) => {
    if (!token) {
      Alert.alert('Hata', 'Token bulunamadı');
      return;
    }

    try {
      setRoleChangingUserId(targetUserId);

      const response =
        newRole === 'admin'
          ? await makeUserAdmin(token, targetUserId)
          : await makeUserWorker(token, targetUserId);

      if (response?.success === false) {
        Alert.alert('Hata', response.message || 'Rol değiştirilemedi');
        return;
      }

      setUsers(previous =>
        previous.map(item =>
          getUserId(item) === targetUserId ? {...item, role: newRole} : item,
        ),
      );

      if (selectedUser && getUserId(selectedUser) === targetUserId) {
        setSelectedUser({...selectedUser, role: newRole});
      }

      Alert.alert(
        'Başarılı',
        newRole === 'admin'
          ? 'Kullanıcı admin yapıldı'
          : 'Kullanıcı worker yapıldı',
      );
    } catch (error: any) {
      Alert.alert('Hata', error?.message || 'Rol değiştirilemedi');
    } finally {
      setRoleChangingUserId(null);
    }
  };

  const handleChangeUserRole = (item: any) => {
    const targetUserId = getUserId(item);
    const currentUserId = getCurrentUserId();

    if (!targetUserId) {
      Alert.alert('Hata', 'Kullanıcı ID bulunamadı');
      return;
    }

    if (targetUserId === currentUserId) {
      Alert.alert('Uyarı', 'Kendi hesabının rolünü değiştiremezsin.');
      return;
    }

    const currentRole = item.role === 'admin' ? 'admin' : 'worker';
    const newRole = currentRole === 'worker' ? 'admin' : 'worker';

    Alert.alert(
      'Rol Değiştir',
      `${item.name || 'Bu kullanıcı'} ${
        newRole === 'admin' ? 'admin' : 'worker'
      } yapılacak. Emin misin?`,
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Onayla',
          onPress: () => changeUserRole(targetUserId, newRole),
        },
      ],
    );
  };

  const handleResolveAlarm = async (alarmId: string) => {
    if (!token) {
      return;
    }

    const response = await resolveAlarm(token, alarmId);

    if (response?.success) {
      Alert.alert('Başarılı', 'Alarm çözüldü');

      setAlarms(previous =>
        previous.map(item =>
          item._id === alarmId || item.id === alarmId
            ? {
                ...item,
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy: user,
              }
            : item,
        ),
      );

      if (selectedAlarm && getId(selectedAlarm) === alarmId) {
        setSelectedAlarm({
          ...selectedAlarm,
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: user,
        });
      }
    } else {
      Alert.alert('Hata', response?.message || 'Alarm çözülemedi');
    }
  };

  const workerCount = users.filter(item => item.role === 'worker').length;
  const adminCount = users.filter(item => item.role === 'admin').length;

  const activeDeviceCount = devices.filter(item => item.isActive).length;

  const activeAlarmCount = alarms.filter(item => !item.resolved).length;

  const criticalActiveAlarms = alarms.filter(
    item => !item.resolved && item.severity === 'CRITICAL',
  );

  const searchValue = searchText.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!searchValue) {
      return users;
    }

    return users.filter(item => {
      const text = `${item.name || ''} ${item.email || ''} ${
        item.department || ''
      } ${item.role || ''}`.toLowerCase();

      return text.includes(searchValue);
    });
  }, [users, searchValue]);

  const filteredDevices = useMemo(() => {
    if (!searchValue) {
      return devices;
    }

    return devices.filter(item => {
      const ownerName = item?.assignedUser?.name || '';
      const ownerEmail = item?.assignedUser?.email || '';

      const text = `${item.name || ''} ${item.deviceId || ''} ${ownerName} ${
        ownerEmail || ''
      }`.toLowerCase();

      return text.includes(searchValue);
    });
  }, [devices, searchValue]);

  const filteredAlarms = useMemo(() => {
    let result = [...alarms];

    if (alarmFilter === 'active') {
      result = result.filter(item => !item.resolved);
    }

    if (alarmFilter === 'resolved') {
      result = result.filter(item => item.resolved);
    }

    if (alarmFilter === 'critical') {
      result = result.filter(item => item.severity === 'CRITICAL');
    }

    if (alarmFilter === 'today') {
      result = result.filter(item => isToday(item.createdAt));
    }

    if (!searchValue) {
      return result;
    }

    return result.filter(item => {
      const userName = item?.userId?.name || '';
      const userEmail = item?.userId?.email || '';
      const deviceName = item?.deviceId?.name || '';
      const deviceCode = item?.deviceId?.deviceId || '';

      const text = `${item.type || ''} ${item.severity || ''} ${
        item.description || ''
      } ${userName} ${userEmail} ${deviceName} ${deviceCode}`.toLowerCase();

      return text.includes(searchValue);
    });
  }, [alarms, alarmFilter, searchValue]);

  const getAlarmUserName = (alarm: any) => {
    return alarm?.userId?.name || 'Bilinmiyor';
  };

  const getAlarmDeviceName = (alarm: any) => {
    return alarm?.deviceId?.name || alarm?.deviceId?.deviceId || 'Bilinmiyor';
  };
  const getResolvedByName = (alarm: any) => {
    return alarm?.resolvedBy?.name || alarm?.resolvedBy?.email || 'Bilinmiyor';
  };
  const getDeviceOwnerName = (device: any) => {
    return device?.assignedUser?.name || 'Atanmamış';
  };

  const getSeverityStyle = (severity: string) => {
    if (severity === 'CRITICAL') {
      return styles.criticalBadge;
    }

    if (severity === 'HIGH') {
      return styles.highBadge;
    }

    if (severity === 'MEDIUM') {
      return styles.mediumBadge;
    }

    return styles.lowBadge;
  };

  const getSelectedUserDevices = (selected: any) => {
    const selectedId = getUserId(selected);

    return devices.filter(device =>
      isSameId(getDeviceAssignedUserId(device), selectedId),
    );
  };

  const getSelectedUserAlarms = (selected: any) => {
    const selectedId = getUserId(selected);

    return alarms.filter(alarm => isSameId(getAlarmUserId(alarm), selectedId));
  };

  const getSelectedDeviceAlarms = (selected: any) => {
    const selectedId = getId(selected);

    return alarms.filter(alarm =>
      isSameId(getAlarmDeviceId(alarm), selectedId),
    );
  };

  const renderStatCard = (
    label: string,
    value: string | number,
    danger = false,
  ) => {
    return (
      <View style={styles.statCard}>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>

        <Text style={[styles.statValue, danger && styles.dangerText]}>
          {value}
        </Text>
      </View>
    );
  };

  const renderCriticalBanner = () => {
    if (criticalActiveAlarms.length === 0) {
      return null;
    }

    const firstAlarm = criticalActiveAlarms[0];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.criticalBanner}
        onPress={() => {
          setActiveTab('alarms');
          setAlarmFilter('critical');
          setSelectedAlarm(firstAlarm);
        }}>
        <View style={styles.criticalBannerLeft}>
          <Text style={styles.criticalBannerTitle}>Kritik Uyarı</Text>

          <Text style={styles.criticalBannerSubText} numberOfLines={1}>
            {firstAlarm.description || firstAlarm.type || 'Detay için dokun'}
          </Text>
        </View>

        <View style={styles.criticalCountBox}>
          <Text style={styles.criticalCountText}>
            {criticalActiveAlarms.length}
          </Text>

          <Text style={styles.criticalCountLabel}>kritik</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'users' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('users')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'users' && styles.activeTabText,
            ]}>
            Kullanıcılar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'alarms' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('alarms')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'alarms' && styles.activeTabText,
            ]}>
            Alarmlar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'devices' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('devices')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'devices' && styles.activeTabText,
            ]}>
            Cihazlar
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSearchBox = () => {
    let placeholder = 'Ara';

    if (activeTab === 'users') {
      placeholder = 'Kullanıcı adı, e-posta veya departman ara';
    }

    if (activeTab === 'alarms') {
      placeholder = 'Alarm tipi, kullanıcı, cihaz veya açıklama ara';
    }

    if (activeTab === 'devices') {
      placeholder = 'Cihaz adı, cihaz ID veya kullanıcı ara';
    }

    return (
      <View style={styles.searchBox}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          style={styles.searchInput}
        />

        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearSearchText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAlarmFilters = () => {
    if (activeTab !== 'alarms') {
      return null;
    }

    const filters: {
      key: AlarmFilterType;
      label: string;
    }[] = [
      {
        key: 'all',
        label: 'Tümü',
      },
      {
        key: 'active',
        label: 'Aktif',
      },
      {
        key: 'resolved',
        label: 'Çözülen',
      },
      {
        key: 'critical',
        label: 'Kritik',
      },
      {
        key: 'today',
        label: 'Bugün',
      },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}>
        {filters.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterButton,
              alarmFilter === item.key && styles.activeFilterButton,
            ]}
            onPress={() => setAlarmFilter(item.key)}>
            <Text
              style={[
                styles.filterText,
                alarmFilter === item.key && styles.activeFilterText,
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderUsers = () => {
    if (filteredUsers.length === 0) {
      return <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>;
    }

    return filteredUsers.map((item, index) => {
      const itemId = getUserId(item);
      const currentUserId = getCurrentUserId();

      const itemRole = item.role === 'admin' ? 'admin' : 'worker';
      const nextRole = itemRole === 'worker' ? 'admin' : 'worker';

      const isCurrentUser = itemId === currentUserId;
      const isChanging = roleChangingUserId === itemId;

      return (
        <TouchableOpacity
          key={itemId || index}
          activeOpacity={0.85}
          style={styles.listCard}
          onPress={() => setSelectedUser(item)}>
          <View style={styles.listLeft}>
            <View
              style={[
                styles.avatarCircle,
                itemRole === 'admin' && styles.adminAvatarCircle,
              ]}>
              <Text
                style={[
                  styles.avatarText,
                  itemRole === 'admin' && styles.adminAvatarText,
                ]}>
                {(item.name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.listInfo}>
              <Text style={styles.listTitle}>
                {item.name || 'İsimsiz Kullanıcı'}
              </Text>

              <Text style={styles.listSubText}>
                {item.email || 'E-posta yok'}
              </Text>

              <Text style={styles.listSubText}>
                Departman: {item.department || 'Genel'}
              </Text>

              <Text style={styles.tapHint}>Detay için dokun</Text>
            </View>
          </View>

          <View style={styles.listRight}>
            <View
              style={[
                styles.roleBadge,
                itemRole === 'admin'
                  ? styles.adminRoleBadge
                  : styles.workerRoleBadge,
              ]}>
              <Text style={styles.badgeText}>{itemRole}</Text>
            </View>

            {!isCurrentUser ? (
              <TouchableOpacity
                style={[
                  styles.roleActionButton,
                  nextRole === 'admin'
                    ? styles.makeAdminButton
                    : styles.makeWorkerButton,
                  isChanging && styles.disabledButton,
                ]}
                disabled={isChanging}
                onPress={() => handleChangeUserRole(item)}>
                <Text
                  style={[
                    styles.roleActionText,
                    nextRole === 'admin'
                      ? styles.makeAdminText
                      : styles.makeWorkerText,
                  ]}>
                  {isChanging
                    ? '...'
                    : nextRole === 'admin'
                    ? 'Admin Yap'
                    : 'Worker Yap'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.currentUserText}>Sen</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderAlarms = () => {
    if (filteredAlarms.length === 0) {
      return <Text style={styles.emptyText}>Alarm kaydı bulunamadı.</Text>;
    }

    return filteredAlarms.map((alarm, index) => (
      <TouchableOpacity
        key={alarm._id || alarm.id || index}
        activeOpacity={0.85}
        style={styles.alarmCard}
        onPress={() => setSelectedAlarm(alarm)}>
        <View style={styles.alarmTop}>
          <Text style={styles.listTitle}>{alarm.type || 'Alarm'}</Text>

          <View
            style={[styles.severityBadge, getSeverityStyle(alarm.severity)]}>
            <Text style={styles.badgeText}>{alarm.severity || 'LOW'}</Text>
          </View>
        </View>

        <Text style={styles.listSubText}>
          {alarm.description || 'Açıklama yok'}
        </Text>

        <Text style={styles.listSubText}>
          Kullanıcı: {getAlarmUserName(alarm)}
        </Text>

        <Text style={styles.listSubText}>
          Cihaz: {getAlarmDeviceName(alarm)}
        </Text>

        <Text style={styles.dateText}>{formatDate(alarm.createdAt)}</Text>

        {alarm.resolved && (
          <Text style={styles.listSubText}>
            Çözen yönetici: {getResolvedByName(alarm)}
          </Text>
        )}

        <View style={styles.alarmBottom}>
          <Text
            style={
              alarm.resolved ? styles.resolvedText : styles.unresolvedText
            }>
            {alarm.resolved ? 'Çözüldü' : 'Aktif'}
          </Text>

          {!alarm.resolved && (
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolveAlarm(alarm._id || alarm.id)}>
              <Text style={styles.resolveButtonText}>Çöz</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.tapHint}>Detay için dokun</Text>
      </TouchableOpacity>
    ));
  };

  const renderDevices = () => {
    if (filteredDevices.length === 0) {
      return <Text style={styles.emptyText}>Cihaz bulunamadı.</Text>;
    }

    return filteredDevices.map((device, index) => (
      <TouchableOpacity
        key={device._id || device.id || device.deviceId || index}
        activeOpacity={0.85}
        style={styles.listCard}
        onPress={() => setSelectedDevice(device)}>
        <View style={styles.listInfo}>
          <Text style={styles.listTitle}>{device.name || 'İsimsiz Cihaz'}</Text>

          <Text style={styles.listSubText}>
            Cihaz ID: {device.deviceId || '-'}
          </Text>

          <Text style={styles.listSubText}>
            Kullanıcı: {getDeviceOwnerName(device)}
          </Text>

          <Text style={styles.listSubText}>
            Son görülme: {formatDate(device.lastSeen)}
          </Text>

          <Text style={styles.tapHint}>Detay için dokun</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            device.isActive
              ? styles.activeDeviceBadge
              : styles.passiveDeviceBadge,
          ]}>
          <Text style={styles.badgeText}>
            {device.isActive ? 'Aktif' : 'Pasif'}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  const renderUserDetailModal = () => {
    if (!selectedUser) {
      return null;
    }

    const selectedUserDevices = getSelectedUserDevices(selectedUser);
    const selectedUserAlarms = getSelectedUserAlarms(selectedUser);
    const selectedActiveAlarms = selectedUserAlarms.filter(
      item => !item.resolved,
    );

    const itemId = getUserId(selectedUser);
    const currentUserId = getCurrentUserId();
    const isCurrentUser = itemId === currentUserId;

    return (
      <Modal
        visible={!!selectedUser}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedUser(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kullanıcı Detayı</Text>

              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Text style={styles.closeText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailMainTitle}>
                  {selectedUser.name || 'İsimsiz Kullanıcı'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>E-posta: </Text>
                  {selectedUser.email || '-'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Rol: </Text>
                  {selectedUser.role || 'worker'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Departman: </Text>
                  {selectedUser.department || 'Genel'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Kayıt tarihi: </Text>
                  {formatDate(selectedUser.createdAt)}
                </Text>
              </View>

              <View style={styles.detailStatsRow}>
                <View style={styles.detailSmallCard}>
                  <Text style={styles.detailSmallLabel}>Cihaz</Text>
                  <Text style={styles.detailSmallValue}>
                    {selectedUserDevices.length}
                  </Text>
                </View>

                <View style={styles.detailSmallCard}>
                  <Text style={styles.detailSmallLabel}>Alarm</Text>
                  <Text style={styles.detailSmallValue}>
                    {selectedUserAlarms.length}
                  </Text>
                </View>

                <View style={styles.detailSmallCard}>
                  <Text style={styles.detailSmallLabel}>Aktif</Text>
                  <Text style={[styles.detailSmallValue, styles.dangerText]}>
                    {selectedActiveAlarms.length}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Kullanıcı Cihazları
                </Text>

                {selectedUserDevices.length === 0 ? (
                  <Text style={styles.detailText}>Bağlı cihaz bulunamadı.</Text>
                ) : (
                  selectedUserDevices.map(device => (
                    <TouchableOpacity
                      key={device._id || device.id || device.deviceId}
                      style={styles.detailMiniItem}
                      onPress={() => {
                        setSelectedUser(null);
                        setSelectedDevice(device);
                      }}>
                      <Text style={styles.detailMiniTitle}>
                        {device.name || 'İsimsiz Cihaz'}
                      </Text>

                      <Text style={styles.detailMiniText}>
                        {device.deviceId || '-'} ·{' '}
                        {device.isActive ? 'Aktif' : 'Pasif'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Son Alarmlar</Text>

                {selectedUserAlarms.length === 0 ? (
                  <Text style={styles.detailText}>Alarm kaydı bulunamadı.</Text>
                ) : (
                  selectedUserAlarms.slice(0, 5).map(alarm => (
                    <TouchableOpacity
                      key={alarm._id || alarm.id}
                      style={styles.detailMiniItem}
                      onPress={() => {
                        setSelectedUser(null);
                        setSelectedAlarm(alarm);
                      }}>
                      <Text style={styles.detailMiniTitle}>
                        {alarm.type || 'Alarm'}
                      </Text>

                      <Text style={styles.detailMiniText}>
                        {alarm.severity || 'LOW'} ·{' '}
                        {alarm.resolved ? 'Çözüldü' : 'Aktif'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {!isCurrentUser && (
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => handleChangeUserRole(selectedUser)}>
                  <Text style={styles.modalActionButtonText}>
                    {selectedUser.role === 'admin' ? 'Worker Yap' : 'Admin Yap'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAlarmDetailModal = () => {
    if (!selectedAlarm) {
      return null;
    }

    const alarmId = selectedAlarm._id || selectedAlarm.id;

    const location =
      selectedAlarm.location ||
      selectedAlarm.sensorData?.location ||
      selectedAlarm.sensorData;

    return (
      <Modal
        visible={!!selectedAlarm}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAlarm(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alarm Detayı</Text>

              <TouchableOpacity onPress={() => setSelectedAlarm(null)}>
                <Text style={styles.closeText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <View style={styles.detailTopRow}>
                  <Text style={styles.detailMainTitle}>
                    {selectedAlarm.type || 'Alarm'}
                  </Text>

                  <View
                    style={[
                      styles.severityBadge,
                      getSeverityStyle(selectedAlarm.severity),
                    ]}>
                    <Text style={styles.badgeText}>
                      {selectedAlarm.severity || 'LOW'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailDescription}>
                  {selectedAlarm.description || 'Açıklama yok'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Durum: </Text>
                  {selectedAlarm.resolved ? 'Çözüldü' : 'Aktif'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Oluşturulma: </Text>
                  {formatDate(selectedAlarm.createdAt)}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Çözülme: </Text>
                  {formatDate(selectedAlarm.resolvedAt)}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Çözen yönetici: </Text>
                  {selectedAlarm.resolved
                    ? getResolvedByName(selectedAlarm)
                    : 'Henüz çözülmedi'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Kullanıcı ve Cihaz
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Kullanıcı: </Text>
                  {getAlarmUserName(selectedAlarm)}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Cihaz: </Text>
                  {getAlarmDeviceName(selectedAlarm)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Konum Bilgisi</Text>

                <Text style={styles.detailText}>{formatJson(location)}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Sensör Verisi</Text>

                <Text style={styles.codeText}>
                  {formatJson(selectedAlarm.sensorData)}
                </Text>
              </View>

              {!selectedAlarm.resolved && (
                <TouchableOpacity
                  style={styles.modalResolveButton}
                  onPress={() => handleResolveAlarm(alarmId)}>
                  <Text style={styles.modalResolveButtonText}>Alarmı Çöz</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDeviceDetailModal = () => {
    if (!selectedDevice) {
      return null;
    }

    const selectedDeviceAlarms = getSelectedDeviceAlarms(selectedDevice);
    const activeDeviceAlarms = selectedDeviceAlarms.filter(
      item => !item.resolved,
    );

    return (
      <Modal
        visible={!!selectedDevice}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedDevice(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cihaz Detayı</Text>

              <TouchableOpacity onPress={() => setSelectedDevice(null)}>
                <Text style={styles.closeText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailMainTitle}>
                  {selectedDevice.name || 'İsimsiz Cihaz'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Cihaz ID: </Text>
                  {selectedDevice.deviceId || '-'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Durum: </Text>
                  {selectedDevice.isActive ? 'Aktif' : 'Pasif'}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Atanan kullanıcı: </Text>
                  {getDeviceOwnerName(selectedDevice)}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Son veri zamanı: </Text>
                  {formatDate(selectedDevice.lastSeen)}
                </Text>

                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Oluşturulma: </Text>
                  {formatDate(selectedDevice.createdAt)}
                </Text>
              </View>

              <View style={styles.detailStatsRow}>
                <View style={styles.detailSmallCard}>
                  <Text style={styles.detailSmallLabel}>Alarm</Text>
                  <Text style={styles.detailSmallValue}>
                    {selectedDeviceAlarms.length}
                  </Text>
                </View>

                <View style={styles.detailSmallCard}>
                  <Text style={styles.detailSmallLabel}>Aktif</Text>
                  <Text style={[styles.detailSmallValue, styles.dangerText]}>
                    {activeDeviceAlarms.length}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Cihaza Bağlı Alarmlar
                </Text>

                {selectedDeviceAlarms.length === 0 ? (
                  <Text style={styles.detailText}>
                    Bu cihaza ait alarm kaydı bulunamadı.
                  </Text>
                ) : (
                  selectedDeviceAlarms.slice(0, 8).map(alarm => (
                    <TouchableOpacity
                      key={alarm._id || alarm.id}
                      style={styles.detailMiniItem}
                      onPress={() => {
                        setSelectedDevice(null);
                        setSelectedAlarm(alarm);
                      }}>
                      <Text style={styles.detailMiniTitle}>
                        {alarm.type || 'Alarm'}
                      </Text>

                      <Text style={styles.detailMiniText}>
                        {alarm.severity || 'LOW'} ·{' '}
                        {alarm.resolved ? 'Çözüldü' : 'Aktif'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.deniedCard}>
          <Text style={styles.deniedTitle}>Yetkisiz Erişim</Text>

          <Text style={styles.deniedText}>
            Bu ekran sadece admin kullanıcılar içindir.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('AnaSayfa')}>
            <Text style={styles.backButtonText}>← Ana Sayfa</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Detaylı Yönetim Paneli</Text>

          <Text style={styles.headerText}>
            Tüm kullanıcılar, cihazlar ve alarmlar
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            color="#F59E0B"
            size="large"
            style={styles.loader}
          />
        ) : (
          <>
            {renderCriticalBanner()}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsHorizontalContent}
              style={styles.statsHorizontal}>
              {renderStatCard('Kullanıcı', users.length)}
              {renderStatCard('Worker', workerCount)}
              {renderStatCard('Admin', adminCount)}
              {renderStatCard('Cihaz', devices.length)}
              {renderStatCard('Aktif Cihaz', activeDeviceCount)}
              {renderStatCard(
                'Aktif Alarm',
                activeAlarmCount,
                activeAlarmCount > 0,
              )}
            </ScrollView>

            {renderTabs()}
            {renderSearchBox()}
            {renderAlarmFilters()}

            <View style={styles.resultInfoBox}>
              <Text style={styles.resultInfoText}>
                {activeTab === 'users' &&
                  `${filteredUsers.length} kullanıcı listeleniyor`}
                {activeTab === 'alarms' &&
                  `${filteredAlarms.length} alarm listeleniyor`}
                {activeTab === 'devices' &&
                  `${filteredDevices.length} cihaz listeleniyor`}
              </Text>
            </View>

            {activeTab === 'users' && renderUsers()}
            {activeTab === 'alarms' && renderAlarms()}
            {activeTab === 'devices' && renderDevices()}
          </>
        )}
      </ScrollView>

      {renderUserDetailModal()}
      {renderAlarmDetailModal()}
      {renderDeviceDetailModal()}
    </SafeAreaView>
  );
};

export default AdminManagementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
  },

  headerText: {
    color: '#94A3B8',
    marginTop: 6,
    marginBottom: 16,
  },

  loader: {
    marginTop: 40,
  },

  criticalBannerText: {
    color: '#FECACA',
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  statLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },

  statValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },

  dangerText: {
    color: '#EF4444',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 5,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },

  tabButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },

  activeTabButton: {
    backgroundColor: '#F59E0B',
  },

  tabText: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 12,
  },

  activeTabText: {
    color: '#0F172A',
  },

  searchBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 10,
  },

  clearSearchText: {
    color: '#60A5FA',
    fontWeight: '800',
    fontSize: 12,
  },

  filterContainer: {
    gap: 8,
    paddingBottom: 12,
  },

  filterButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  activeFilterButton: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },

  filterText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },

  activeFilterText: {
    color: '#fff',
  },

  resultInfoBox: {
    marginBottom: 12,
  },

  resultInfoText: {
    color: '#94A3B8',
    fontSize: 13,
  },

  listCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  listLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },

  listInfo: {
    flex: 1,
  },

  listTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  listSubText: {
    color: '#94A3B8',
    marginTop: 5,
    fontSize: 12,
  },

  tapHint: {
    color: '#64748B',
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
  },

  listRight: {
    alignItems: 'flex-end',
    gap: 8,
  },

  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#CBD5E1',
    fontWeight: '900',
  },

  adminAvatarCircle: {
    backgroundColor: '#78350F',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },

  adminAvatarText: {
    color: '#F59E0B',
  },

  roleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  adminRoleBadge: {
    backgroundColor: '#92400E',
  },

  workerRoleBadge: {
    backgroundColor: '#14532D',
  },

  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },

  roleActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },

  makeAdminButton: {
    backgroundColor: '#451A03',
    borderColor: '#F59E0B',
  },

  makeWorkerButton: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
  },

  disabledButton: {
    opacity: 0.5,
  },

  roleActionText: {
    fontSize: 11,
    fontWeight: '900',
  },

  makeAdminText: {
    color: '#F59E0B',
  },

  makeWorkerText: {
    color: '#FCA5A5',
  },

  currentUserText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },

  alarmCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },

  alarmTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  severityBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },

  criticalBadge: {
    backgroundColor: '#7F1D1D',
  },

  highBadge: {
    backgroundColor: '#B91C1C',
  },

  mediumBadge: {
    backgroundColor: '#92400E',
  },

  lowBadge: {
    backgroundColor: '#14532D',
  },

  dateText: {
    color: '#64748B',
    marginTop: 8,
    fontSize: 12,
  },

  alarmBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  resolvedText: {
    color: '#22C55E',
    fontWeight: '900',
  },

  unresolvedText: {
    color: '#EF4444',
    fontWeight: '900',
  },

  resolveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  resolveButtonText: {
    color: '#fff',
    fontWeight: '900',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },

  activeDeviceBadge: {
    backgroundColor: '#14532D',
  },

  passiveDeviceBadge: {
    backgroundColor: '#7F1D1D',
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 12,
  },

  deniedCard: {
    backgroundColor: '#1E293B',
    margin: 20,
    padding: 22,
    borderRadius: 20,
  },

  deniedTitle: {
    color: '#EF4444',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },

  deniedText: {
    color: '#CBD5E1',
    lineHeight: 22,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#101B2E',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    maxHeight: '88%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },

  closeText: {
    color: '#60A5FA',
    fontWeight: '900',
  },

  detailSection: {
    backgroundColor: '#0B1628',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1E2B44',
  },

  detailTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  detailMainTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },

  detailDescription: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    fontWeight: '700',
  },

  detailText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 21,
  },

  detailLabel: {
    color: '#9CA3AF',
    fontWeight: '900',
  },

  detailSectionTitle: {
    color: '#60A5FA',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },

  detailStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },

  detailSmallCard: {
    flex: 1,
    backgroundColor: '#0B1628',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2B44',
  },

  detailSmallLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 6,
  },

  detailSmallValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },

  detailMiniItem: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },

  detailMiniTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  detailMiniText: {
    color: '#94A3B8',
    marginTop: 4,
    fontSize: 12,
  },

  modalActionButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },

  modalActionButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },

  modalResolveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },

  modalResolveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },

  codeText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    fontFamily: 'monospace',
  },

  criticalBanner: {
    backgroundColor: '#7F1D1D',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  criticalBannerLeft: {
    flex: 1,
  },

  criticalBannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },

  criticalBannerSubText: {
    color: '#FECACA',
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
  },

  criticalCountBox: {
    backgroundColor: '#450A0A',
    minWidth: 58,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },

  criticalCountText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },

  criticalCountLabel: {
    color: '#FECACA',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },

  statsHorizontal: {
    marginBottom: 16,
  },

  statsHorizontalContent: {
    gap: 10,
    paddingRight: 20,
  },

  statCard: {
    width: 118,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },

  topHeader: {
    marginBottom: 12,
  },

  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },

  backButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '900',
  },
});
