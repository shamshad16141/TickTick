import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [inputMin, setInputMin] = useState(1);
  const [customMin, setCustomMin] = useState('1');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let interval: any;

    if (running && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [running, seconds]);

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function handleStart() {
    if (seconds === 0) {
      setSeconds(inputMin * 60);
    }
    setRunning(true);
  }

  function handleStop() {
    setRunning(false);
  }

  function handleReset() {
    setRunning(false);
    setSeconds(inputMin * 60);
  }

  function handleApplyCustom() {
    const parsed = Number.parseInt(customMin, 10);
    if (Number.isNaN(parsed)) return;

    const safeMin = Math.min(Math.max(parsed, 1), 999);
    setInputMin(safeMin);
    setCustomMin(String(safeMin));
    setSeconds(safeMin * 60);
    setRunning(false);
  }

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#7dd3fc', '#3b82f6', '#1e3a8a']}
        style={styles.gradient}
      />

      {/* Timer */}
      <Text style={styles.time}>{formatTime(seconds)}</Text>

      {/* Quick Presets */}
      <View style={styles.quickRow}>
        {[1, 5, 10, 25].map((min) => (
          <Pressable
            key={min}
            onPress={() => {
              setInputMin(min);
              setCustomMin(String(min));
              setSeconds(min * 60);
              setRunning(false);
            }}
            style={({ pressed }) => [
              styles.quickBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.quickText}>{min}m</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.customRow}>
        <TextInput
          value={customMin}
          onChangeText={(text) => setCustomMin(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={3}
          placeholder="Custom min"
          placeholderTextColor="#94a3b8"
          style={styles.customInput}
        />
        <Pressable
          onPress={handleApplyCustom}
          style={({ pressed }) => [
            styles.customApplyBtn,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.customApplyText}>Apply</Text>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.startBtn,
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={styles.actionText}>Start</Text>
        </Pressable>

        <Pressable
          onPress={handleStop}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.stopBtn,
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={styles.actionText}>Stop</Text>
        </Pressable>

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.resetBtn,
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={styles.actionText}>Reset</Text>
        </Pressable>
      </View>

      <Text style={styles.statusText}>{running ? 'Running' : 'Paused'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: 'center',
    alignItems: 'center',
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  time: {
    fontSize: width * 0.22,
    color: "#fff",
    fontWeight: 'bold',
    marginBottom: 20,
  },

  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
  },

  quickBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  quickText: {
    color: "#fff",
    fontSize: 13,
  },

  pressed: {
    opacity: 0.82,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  customRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    width: '76%',
    maxWidth: 360,
  },

  customInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#8b93f8',
    backgroundColor: 'rgba(248,248,253,0.95)',
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  customApplyBtn: {
    borderRadius: 14,
    backgroundColor: '#1f35ff',
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  customApplyText: {
    color: '#f8f8fd',
    fontSize: 15,
    fontWeight: '800',
  },

  actionBtn: {
    borderRadius: 999,
    borderWidth: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 94,
    alignItems: 'center',
  },

  startBtn: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },

  stopBtn: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },

  resetBtn: {
    backgroundColor: '#fef9c3',
    borderColor: '#facc15',
    shadowColor: '#ca8a04',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },

  actionPressed: {
    top: 8,
    shadowOpacity: 0,
    elevation: 0,
  },

  actionText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0011ff',
  },

  statusText: {
    color: '#dbeafe',
    fontSize: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});