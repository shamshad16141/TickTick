import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

// 🔔 Notification setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type AlarmType = {
  id: string;
  time: Date;
  active: boolean;
  notificationId?: string;
};

export default function Alarm() {
  const [alarms, setAlarms] = useState<AlarmType[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  const requestPermissions = useCallback(async () => {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  }, []);

  const setupNotifications = useCallback(async () => {
    const granted = await requestPermissions();

    if (!granted) {
      Alert.alert('Notification permission required', 'Allow notifications to add alarms.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alarm-channel', {
        name: 'Alarms',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }, [requestPermissions]);

  useEffect(() => {
    setupNotifications();
  }, [setupNotifications]);

  function getNextTrigger(date: Date) {
    const now = new Date();
    const next = new Date(now);

    next.setHours(date.getHours(), date.getMinutes(), 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  async function scheduleAlarm(date: Date) {
    const triggerDate = getNextTrigger(date);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Alarm",
        body: "Time's up!",
        sound: 'default',
        vibrate: [0, 500, 500],
        priority: 'high',
        ...(Platform.OS === 'android' && {
          channelId: 'alarm-channel',
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return id;
  }

  async function cancelAlarm(notificationId?: string) {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  }

  async function onTimePicked(event: DateTimePickerEvent, date?: Date) {
    setShowPicker(false);

    if (event.type === 'dismissed' || !date) {
      return;
    }

    try {
      setSelectedTime(date);

      const notificationId = await scheduleAlarm(date);

      const newAlarm: AlarmType = {
        id: Date.now().toString(),
        time: date,
        active: true,
        notificationId,
      };

      setAlarms((prev) => [newAlarm, ...prev]);
      Alert.alert('Alarm added', `Alarm set for ${formatTime(date)}`);
    } catch {
      Alert.alert('Could not add alarm', 'Please allow notifications and try again.');
    }
  }

  async function toggleAlarm(id: string) {
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) return;

    if (alarm.active) {
      await cancelAlarm(alarm.notificationId);
      setAlarms((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: false, notificationId: undefined } : a))
      );
      return;
    }

    const newId = await scheduleAlarm(alarm.time);
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: true, notificationId: newId } : a))
    );
  }

  async function deleteAlarm(id: string) {
    const alarm = alarms.find((a) => a.id === id);
    await cancelAlarm(alarm?.notificationId);

    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#7dd3fc', '#3b82f6', '#1e3a8a']}
        style={styles.gradient}
      />

      <Text style={styles.title}>Alarms</Text>

      {/* Add Alarm */}
      <Pressable
        onPress={() => setShowPicker(true)}
        style={({ pressed }) => [
          styles.addBtn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.addText}>+ Add Alarm</Text>
      </Pressable>

      {/* Time Picker */}
      {showPicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimePicked}
        />
      )}

      {/* Alarm List */}
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        style={{ width: '85%' }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.time}>{formatTime(item.time)}</Text>

            <View style={styles.actions}>
              <Pressable
                onPress={() => toggleAlarm(item.id)}
                style={[
                  styles.toggle,
                  item.active && styles.activeToggle,
                ]}
              >
                <Text style={styles.toggleText}>
                  {item.active ? "ON" : "OFF"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => deleteAlarm(item.id)}
                style={styles.delete}
              >
                <Text style={styles.deleteText}>✕</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: 'center',
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  title: {
    marginTop: 80,
    fontSize: 28,
    color: "#fff",
    fontWeight: 'bold',
  },

  addBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  addText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: '600',
  },

  card: {
    marginTop: 15,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  time: {
    fontSize: 22,
    color: "#fff",
    fontWeight: 'bold',
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  toggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  activeToggle: {
    backgroundColor: '#22c55e',
  },

  toggleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: '600',
  },

  delete: {
    padding: 6,
  },

  deleteText: {
    color: "#fff",
    fontSize: 18,
  },

  pressed: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});