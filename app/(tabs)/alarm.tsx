import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

// Configure how notifications are displayed when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Alarm = { id: string; time: string; label: string; active: boolean; notifId?: string };

const STORAGE_KEY = 'alarms';
const TIME_REGEX  = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseTimeToMinutes(time: string): number | null {
  const match = time.match(TIME_REGEX);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatMinutesToTime(total: number) {
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

function normalizeTimeInput(value: string, prev: string): string {
  // Strip non-digits
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  // Clamp hours to 23
  const hh = Math.min(parseInt(digits.slice(0, 2), 10), 23).toString().padStart(2, '0');
  // Clamp minutes to 59
  const mm = Math.min(parseInt(digits.slice(2, 4), 10), 59).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatRemaining(minutes: number) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (h === 0) return `in ${m}m`;
  if (m === 0) return `in ${h}h`;
  return `in ${h}h ${m}m`;
}

function sortAlarms(list: Alarm[]) {
  return [...list].sort((a, b) =>
    (parseTimeToMinutes(a.time) ?? Infinity) - (parseTimeToMinutes(b.time) ?? Infinity)
  );
}

// ── Notification helpers ──────────────────────────────────────────────────────

async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleAlarmNotification(alarm: Alarm): Promise<string | null> {
  const minutes = parseTimeToMinutes(alarm.time);
  if (minutes === null) return null;

  const now      = new Date();
  const nowMin   = now.getHours() * 60 + now.getMinutes();
  let   deltaMin = minutes - nowMin;
  if (deltaMin <= 0) deltaMin += 1440; // next occurrence (tomorrow)

  const trigger = new Date(now.getTime() + deltaMin * 60 * 1000);
  // Zero out seconds so it fires on the exact minute
  trigger.setSeconds(0, 0);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Alarm',
        body:  alarm.label,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
    return id;
  } catch {
    return null;
  }
}

async function cancelAlarmNotification(notifId?: string) {
  if (notifId) {
    try { await Notifications.cancelScheduledNotificationAsync(notifId); } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AlarmScreen() {
  const { width, height } = useWindowDimensions();
  const insets    = useSafeAreaInsets();
  const isLandscape = width > height;
  const base = Math.min(width, height);   // font scaling anchor
  const { isDark, toggleDark, animatedBg, textColor, subColor, inputBg, inputBorder, cardBg, cardBorder, dividerColor } = useTheme();

  const [alarms,   setAlarms]   = useState<Alarm[]>([]);
  const [editing,  setEditing]  = useState<Alarm | null>(null);
  const [time,     setTime]     = useState('');
  const [label,    setLabel]    = useState('');
  const [addOpen,  setAddOpen]  = useState(false);
  const [nowMin,   setNowMin]   = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  const prevTimeRef = useRef('');
  const addBtnScale = useSharedValue(1);

  // ── Live countdown tick ──────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowMin(n.getHours() * 60 + n.getMinutes());
    };
    tick();
    const id = setInterval(tick, 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  // ── Permission + load ────────────────────────────────────────────────────
  useEffect(() => {
    requestPermissions();
    loadAlarms();
  }, []);

  async function loadAlarms() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return;
      const parsed = JSON.parse(data) as Alarm[];
      if (!Array.isArray(parsed)) return;
      const safe = parsed.filter(
        (a) => typeof a.id === 'string' && typeof a.time === 'string' &&
          typeof a.label === 'string' && typeof a.active === 'boolean' &&
          parseTimeToMinutes(a.time) !== null
      );
      setAlarms(sortAlarms(safe));
    } catch { Alert.alert('Error', 'Failed to load alarms.'); }
  }

  async function saveAlarms(updated: Alarm[]) {
    const sorted = sortAlarms(updated);
    setAlarms(sorted);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted)); }
    catch { Alert.alert('Error', 'Failed to save alarms.'); }
  }

  function clearForm() {
    setTime('');
    setLabel('');
    setEditing(null);
    setAddOpen(false);
    prevTimeRef.current = '';
  }

  // Fix #7 – always clear form when toggling + button
  function handleAddToggle() {
    if (addOpen) {
      clearForm();
    } else {
      // Reset form for a fresh add
      setEditing(null);
      setTime('');
      setLabel('');
      prevTimeRef.current = '';
      setAddOpen(true);
    }
  }

  async function toggle(id: string) {
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) return;

    if (alarm.active) {
      // Disabling → cancel notification
      await cancelAlarmNotification(alarm.notifId);
      await saveAlarms(alarms.map((a) => a.id === id ? { ...a, active: false, notifId: undefined } : a));
    } else {
      // Enabling → schedule notification
      const granted = await requestPermissions();
      if (!granted) { Alert.alert('Permission denied', 'Enable notifications in Settings to use alarms.'); return; }
      const notifId = await scheduleAlarmNotification({ ...alarm, active: true }) ?? undefined;
      await saveAlarms(alarms.map((a) => a.id === id ? { ...a, active: true, notifId } : a));
    }
  }

  async function addOrUpdateAlarm() {
    const normalized = normalizeTimeInput(time, prevTimeRef.current);
    const parsed     = parseTimeToMinutes(normalized);
    if (parsed === null || !TIME_REGEX.test(normalized)) {
      Alert.alert('Invalid Time', 'Please enter a valid time in HH:MM format.');
      return;
    }
    const finalTime  = formatMinutesToTime(parsed);
    const finalLabel = label.trim() || 'Alarm';

    // Fix #3 – no duplicate times (except when editing the same alarm)
    const duplicate = alarms.find(
      (a) => a.time === finalTime && a.id !== editing?.id
    );
    if (duplicate) {
      Alert.alert('Duplicate', `An alarm for ${finalTime} already exists.`);
      return;
    }

    if (editing) {
      // Cancel old notification before rescheduling
      await cancelAlarmNotification(editing.notifId);
      const notifId = editing.active
        ? (await scheduleAlarmNotification({ ...editing, time: finalTime, label: finalLabel }) ?? undefined)
        : undefined;
      await saveAlarms(alarms.map((a) =>
        a.id === editing.id ? { ...a, time: finalTime, label: finalLabel, notifId } : a
      ));
    } else {
      const granted = await requestPermissions();
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        time: finalTime,
        label: finalLabel,
        active: true,
      };
      const notifId = granted
        ? (await scheduleAlarmNotification(newAlarm) ?? undefined)
        : undefined;
      await saveAlarms([...alarms, { ...newAlarm, notifId }]);
    }
    clearForm();
  }

  async function deleteAlarm(id: string) {
    Alert.alert('Delete', 'Delete this alarm?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const alarm = alarms.find((a) => a.id === id);
          await cancelAlarmNotification(alarm?.notifId);
          await saveAlarms(alarms.filter((a) => a.id !== id));
        },
      },
    ]);
  }

  function editAlarm(alarm: Alarm) {
    setEditing(alarm);
    setTime(alarm.time);
    prevTimeRef.current = alarm.time;
    setLabel(alarm.label);
    setAddOpen(true);
  }

  // Fix #2 & #5 – single Date instance, recomputed every 30s via nowMin
  const nextAlarm = useMemo(() => {
    const active = alarms.filter((a) => a.active);
    if (!active.length) return { time: '--:--', subtitle: 'No active alarms' };
    let best: { alarm: Alarm; delta: number } | null = null;
    for (const a of active) {
      const m = parseTimeToMinutes(a.time);
      if (m === null) continue;
      let delta = m - nowMin;
      if (delta <= 0) delta += 1440;
      if (!best || delta < best.delta) best = { alarm: a, delta };
    }
    if (!best) return { time: '--:--', subtitle: 'No active alarms' };
    return {
      time: best.alarm.time,
      subtitle: `${formatRemaining(best.delta)} · ${best.alarm.label}`,
    };
  }, [alarms, nowMin]); // nowMin dependency makes it live

  const activeCount = useMemo(() => alarms.filter((a) => a.active).length, [alarms]);

  // Match all other screens — double-tap to toggle dark mode
  const doubleTap = Gesture.Tap().numberOfTaps(2).onStart(() => runOnJS(toggleDark)());

  const animAddBtn = useAnimatedStyle(() => ({ transform: [{ scale: addBtnScale.value }] }));
  const badgeBg    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(30,41,59,0.06)';

  // ── Shared form panel (used in both portrait & landscape) ──────────────────
  const FormPanel = () => addOpen ? (
    <View style={[styles.form, isLandscape && styles.formLandscape, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <Text style={[styles.formTitle, { color: textColor }]}>
        {editing ? 'Edit Alarm' : 'New Alarm'}
      </Text>
      <View style={[styles.formRow, isLandscape && styles.formRowLandscape]}>
        <View style={[styles.formInput, { backgroundColor: inputBg, borderColor: inputBorder }]}>
          <Ionicons name="time-outline" size={16} color={subColor} />
          <TextInput
            placeholder="HH:MM"
            placeholderTextColor={subColor}
            value={time}
            onChangeText={(v) => {
              const normalized = normalizeTimeInput(v, prevTimeRef.current);
              prevTimeRef.current = normalized;
              setTime(normalized);
            }}
            keyboardType="number-pad"
            maxLength={5}
            style={[styles.formTextInput, { color: textColor }]}
          />
        </View>
        <View style={[styles.formInput, { backgroundColor: inputBg, borderColor: inputBorder, flex: 1.4 }]}>
          <Ionicons name="pricetag-outline" size={16} color={subColor} />
          <TextInput
            placeholder="Label"
            placeholderTextColor={subColor}
            value={label}
            onChangeText={setLabel}
            style={[styles.formTextInput, { color: textColor }]}
            returnKeyType="done"
            onSubmitEditing={addOrUpdateAlarm}
          />
        </View>
      </View>
      <View style={styles.formActions}>
        {editing && (
          <Pressable onPress={clearForm} style={[styles.formBtn, { borderColor: inputBorder }]}>
            <Text style={[styles.formBtnText, { color: subColor }]}>Cancel</Text>
          </Pressable>
        )}
        <Pressable
          onPress={addOrUpdateAlarm}
          style={[styles.formBtn, {
            borderColor: '#22c55e',
            backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)',
          }]}
        >
          <Text style={[styles.formBtnText, { color: '#22c55e' }]}>
            {editing ? 'Update' : 'Add'}
          </Text>
        </Pressable>
      </View>
    </View>
  ) : null;

  return (
    <GestureDetector gesture={doubleTap}>
      <Animated.View style={[styles.container, animatedBg] as any}>

        {isLandscape ? (
          /* ── LANDSCAPE: left panel | right list ── */
          <View style={styles.landscapeRoot}>

            {/* Left panel — next alarm + add button + form */}
            <View style={[styles.leftPanel, {
              borderRightColor: dividerColor,
              paddingTop: insets.top + 10,
              paddingLeft: insets.left + 20,
            }]}>
              <Text style={[styles.nextLabel, { color: subColor }]}>NEXT ALARM</Text>
              <Text style={[styles.nextTime, { color: textColor, fontSize: base * 0.18 }]}>
                {nextAlarm.time}
              </Text>
              <Text style={[styles.nextSub, { color: subColor }]}>{nextAlarm.subtitle}</Text>

              <View style={styles.leftActions}>
                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.badgeText, { color: subColor }]}>{activeCount} on</Text>
                </View>
                <AnimatedPressable
                  onPressIn={() => { addBtnScale.value = withTiming(0.9, { duration: 100 }); }}
                  onPressOut={() => { addBtnScale.value = withSpring(1, { damping: 10, stiffness: 160 }); }}
                  onPress={handleAddToggle}
                  style={[
                    styles.addFab, animAddBtn,
                    {
                      backgroundColor: addOpen
                        ? (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)')
                        : (isDark ? 'rgba(34,197,94,0.15)'  : 'rgba(34,197,94,0.08)'),
                      borderColor: addOpen ? '#ef4444' : '#22c55e',
                    },
                  ]}
                >
                  <Ionicons name={addOpen ? 'close' : 'add'} size={22} color={addOpen ? '#ef4444' : '#22c55e'} />
                </AnimatedPressable>
              </View>

              <FormPanel />

              <Text style={[styles.hint, { color: subColor, marginTop: 'auto', paddingBottom: insets.bottom + 8 }]}>
                Double tap · {isDark ? 'light' : 'dark'} mode
              </Text>
            </View>

            {/* Right panel — alarm list */}
            <FlatList
              style={styles.rightPanel}
              data={alarms}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.listContent, {
                paddingBottom: insets.bottom + 20,
                paddingRight: insets.right + 16,
              }]}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="alarm-outline" size={36} color={subColor} />
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No alarms yet</Text>
                  <Text style={[styles.emptyText, { color: subColor }]}>Tap + to add your first alarm</Text>
                </View>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => editAlarm(item)}
                  style={[styles.card, {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    opacity: item.active ? 1 : 0.5,
                  }]}
                >
                  <View>
                    <Text style={[styles.cardTime, { color: textColor, fontSize: base * 0.10 }]}>{item.time}</Text>
                    <Text style={[styles.cardLabel, { color: subColor }]}>{item.label}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Switch
                      value={item.active}
                      onValueChange={() => toggle(item.id)}
                      trackColor={{ false: isDark ? '#334155' : '#e2e8f0', true: 'rgba(34,197,94,0.4)' }}
                      thumbColor={item.active ? '#22c55e' : (isDark ? '#64748b' : '#94a3b8')}
                    />
                    <Pressable onPress={() => deleteAlarm(item.id)} style={styles.deleteBtn} hitSlop={8}>
                      <Ionicons name="trash-outline" size={15} color="#ef4444" />
                    </Pressable>
                  </View>
                </Pressable>
              )}
            />
          </View>

        ) : (
          /* ── PORTRAIT: original stacked layout ── */
          <>
            <View style={[styles.header, {
              borderBottomColor: dividerColor,
              paddingTop: insets.top + 16,
            }]}>
              <View style={styles.headerLeft}>
                <Text style={[styles.nextLabel, { color: subColor }]}>NEXT ALARM</Text>
                <Text style={[styles.nextTime, { color: textColor, fontSize: base * 0.13 }]}>
                  {nextAlarm.time}
                </Text>
                <Text style={[styles.nextSub, { color: subColor }]}>{nextAlarm.subtitle}</Text>
              </View>
              <View style={styles.headerRight}>
                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.badgeText, { color: subColor }]}>{activeCount} on</Text>
                </View>
                <AnimatedPressable
                  onPressIn={() => { addBtnScale.value = withTiming(0.9, { duration: 100 }); }}
                  onPressOut={() => { addBtnScale.value = withSpring(1, { damping: 10, stiffness: 160 }); }}
                  onPress={handleAddToggle}
                  style={[
                    styles.addFab, animAddBtn,
                    {
                      backgroundColor: addOpen
                        ? (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)')
                        : (isDark ? 'rgba(34,197,94,0.15)'  : 'rgba(34,197,94,0.08)'),
                      borderColor: addOpen ? '#ef4444' : '#22c55e',
                    },
                  ]}
                >
                  <Ionicons name={addOpen ? 'close' : 'add'} size={24} color={addOpen ? '#ef4444' : '#22c55e'} />
                </AnimatedPressable>
              </View>
            </View>

            <FormPanel />

            <FlatList
              data={alarms}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 60 }]}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="alarm-outline" size={40} color={subColor} />
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No alarms yet</Text>
                  <Text style={[styles.emptyText,  { color: subColor }]}>Tap + to add your first alarm</Text>
                </View>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => editAlarm(item)}
                  style={[styles.card, {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    opacity: item.active ? 1 : 0.5,
                  }]}
                >
                  <View>
                    <Text style={[styles.cardTime, { color: textColor, fontSize: base * 0.09 }]}>{item.time}</Text>
                    <Text style={[styles.cardLabel, { color: subColor }]}>{item.label}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Switch
                      value={item.active}
                      onValueChange={() => toggle(item.id)}
                      trackColor={{ false: isDark ? '#334155' : '#e2e8f0', true: 'rgba(34,197,94,0.4)' }}
                      thumbColor={item.active ? '#22c55e' : (isDark ? '#64748b' : '#94a3b8')}
                    />
                    <Pressable onPress={() => deleteAlarm(item.id)} style={styles.deleteBtn} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                </Pressable>
              )}
            />

            <Text style={[styles.hint, { color: subColor, paddingBottom: insets.bottom + 8 }]}>
              Double tap to {isDark ? 'light' : 'dark'} mode
            </Text>
          </>
        )}

      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Portrait header
  header:    {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 28, paddingBottom: 24, borderBottomWidth: 1,
  },
  headerLeft:  { gap: 2 },
  headerRight: { alignItems: 'flex-end', gap: 12 },

  // Landscape two-column root
  landscapeRoot: { flex: 1, flexDirection: 'row' },
  leftPanel: {
    width: '38%',
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  leftActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
  rightPanel: { flex: 1 },

  // Shared next-alarm text
  nextLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  nextTime:  { fontWeight: 'bold', letterSpacing: 2 },
  nextSub:   { fontSize: 11, marginTop: 2 },

  badge:     { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  addFab:    { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  // Form
  form:           { marginHorizontal: 20, marginTop: 16, borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },
  formLandscape:  { marginHorizontal: 0, marginTop: 10, padding: 14, gap: 10 },
  formTitle:      { fontSize: 13, fontWeight: '600', letterSpacing: 0.4 },
  formRow:        { flexDirection: 'row', gap: 10 },
  formRowLandscape: { flexDirection: 'column', gap: 8 },
  formInput:      { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  formTextInput:  { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  formActions:    { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  formBtn:        { borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
  formBtnText:    { fontSize: 13, fontWeight: '600' },

  // List
  listContent:{ paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  card:       { borderRadius: 18, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTime:   { fontWeight: 'bold', letterSpacing: 1 },
  cardLabel:  { fontSize: 11, marginTop: 2 },
  cardRight:  { alignItems: 'flex-end', gap: 8 },
  deleteBtn:  { padding: 6 },

  emptyWrap:  { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText:  { fontSize: 12 },
  hint:       { fontSize: 10, letterSpacing: 0.5, opacity: 0.6, textAlign: 'center', paddingTop: 8 },
});