import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
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
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESETS = [1, 5, 10, 25];

export default function Timer() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { isDark, toggleDark, animatedBg, textColor, subColor, pillBg, pillActiveBg, inputBg, inputBorder } = useTheme();

  const [seconds, setSeconds] = useState(60);
  const [inputMin, setInputMin] = useState(1);
  const [customMin, setCustomMin] = useState('1');
  const [running, setRunning] = useState(false);

  const startScale = useSharedValue(1);
  const resetScale = useSharedValue(1);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) { setRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return { m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') };
  }

  function handleStartStop() {
    if (seconds === 0) { setSeconds(inputMin * 60); setRunning(true); return; }
    setRunning((r) => !r);
  }

  function handleReset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(inputMin * 60);
  }

  function handlePreset(min: number) {
    clearInterval(intervalRef.current);
    setRunning(false);
    setInputMin(min);
    setCustomMin(String(min));
    setSeconds(min * 60);
  }

  function handleApplyCustom() {
    const parsed = parseInt(customMin, 10);
    if (isNaN(parsed)) return;
    const safe = Math.min(Math.max(parsed, 1), 999);
    handlePreset(safe);
    setCustomMin(String(safe));
  }

  const doubleTap = Gesture.Tap().numberOfTaps(2).onStart(() => runOnJS(toggleDark)());

  const animatedStart = useAnimatedStyle(() => ({ transform: [{ scale: startScale.value }] }));
  const animatedReset = useAnimatedStyle(() => ({ transform: [{ scale: resetScale.value }] }));

  const { m, s } = formatTime(seconds);
  const isDone   = seconds === 0 && !running;
  const progress = inputMin > 0 ? seconds / (inputMin * 60) : 0;

  const startBg        = running ? (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)') : (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)');
  const startBorder    = running ? '#ef4444' : '#22c55e';
  const startIconColor = running ? '#ef4444' : '#22c55e';
  const resetBorder    = isDark  ? 'rgba(255,255,255,0.2)'  : 'rgba(30,41,59,0.15)';

  const timeFontSize  = isLandscape ? height * 0.26 : width * 0.28;
  const colonFontSize = isLandscape ? height * 0.20 : width * 0.20;

  const TimeDisplay = (
    <View style={styles.timeContainer}>
      <Text style={[styles.timeText, { color: textColor, fontSize: timeFontSize }]}>{m}</Text>
      <Text style={[styles.colon,    { color: subColor,  fontSize: colonFontSize }]}>:</Text>
      <Text style={[styles.timeText, { color: textColor, fontSize: timeFontSize }]}>{s}</Text>
    </View>
  );

  const ProgressBar = (
    <View style={[styles.progressTrack, { backgroundColor: pillBg }]}>
      <Animated.View style={[styles.progressFill, {
        width: `${Math.max(progress * 100, 0)}%`,
        backgroundColor: running ? '#22c55e' : isDark ? '#475569' : '#cbd5e1',
      }]} />
    </View>
  );

  const StatusLabel = (
    <Text style={[styles.status, { color: subColor }]}>
      {isDone ? '✓ Done' : running ? 'Running' : 'Paused'}
    </Text>
  );

  const PresetPills = (
    <View style={[styles.presetsRow, isLandscape && styles.presetsRowLandscape]}>
      {PRESETS.map((min) => (
        <Pressable key={min} onPress={() => handlePreset(min)}
          style={[styles.pill, { backgroundColor: inputMin === min ? pillActiveBg : pillBg }]}>
          <Text style={[styles.pillText, {
            color: inputMin === min ? textColor : subColor,
            fontWeight: inputMin === min ? '700' : '400',
          }]}>{min}m</Text>
        </Pressable>
      ))}
    </View>
  );

  const CustomInput = (
    <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder },
      isLandscape && styles.inputRowLandscape]}>
      <TextInput
        value={customMin}
        onChangeText={(t) => setCustomMin(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad" maxLength={3} placeholder="min"
        placeholderTextColor={subColor}
        style={[styles.input, { color: textColor }]}
        returnKeyType="done" onSubmitEditing={handleApplyCustom}
      />
      <Text style={[styles.inputUnit, { color: subColor }]}>min</Text>
      <Pressable onPress={handleApplyCustom} style={[styles.setBtn, { borderColor: inputBorder }]}>
        <Text style={[styles.setBtnText, { color: textColor }]}>Set</Text>
      </Pressable>
    </View>
  );

  const Controls = (
    <View style={[styles.controls, isLandscape && styles.controlsLandscape]}>
      <AnimatedPressable
        onPressIn={() => { resetScale.value = withTiming(0.9, { duration: 100 }); }}
        onPressOut={() => { resetScale.value = withSpring(1, { damping: 10, stiffness: 160 }); }}
        onPress={handleReset}
        style={[styles.iconBtn, animatedReset, { backgroundColor: pillBg, borderColor: resetBorder }]}
      >
        <Ionicons name="refresh" size={22} color={subColor} />
      </AnimatedPressable>

      <AnimatedPressable
        onPressIn={() => { startScale.value = withTiming(0.92, { duration: 100 }); }}
        onPressOut={() => { startScale.value = withSpring(1, { damping: 10, stiffness: 160 }); }}
        onPress={handleStartStop}
        style={[styles.mainBtn, animatedStart, { backgroundColor: startBg, borderColor: startBorder },
          isLandscape && styles.mainBtnLandscape]}
      >
        <Ionicons name={running ? 'pause' : 'play'} size={isLandscape ? 24 : 30} color={startIconColor} />
      </AnimatedPressable>

      <View style={[styles.iconBtn, { opacity: 0 }]} />
    </View>
  );

  const Hint = <Text style={[styles.hint, { color: subColor }]}>Double tap to {isDark ? 'light' : 'dark'} mode</Text>;

  return (
    <GestureDetector gesture={doubleTap}>
      <Animated.View style={[styles.container, animatedBg, isLandscape && styles.containerLandscape]}>
        {isLandscape ? (
          <>
            <View style={styles.lsLeft}>{TimeDisplay}{ProgressBar}{StatusLabel}{Hint}</View>
            <View style={styles.lsRight}>{PresetPills}{CustomInput}{Controls}</View>
          </>
        ) : (
          <>{TimeDisplay}{ProgressBar}{StatusLabel}{PresetPills}{CustomInput}{Controls}{Hint}</>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  containerLandscape:{ flex: 1, flexDirection: 'row', paddingHorizontal: 0 },
  lsLeft:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  lsRight: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  timeText: { fontWeight: 'bold', letterSpacing: 2 },
  colon:    { fontWeight: 'bold', marginHorizontal: 2, marginBottom: 8 },
  progressTrack: { width: '80%', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: '100%', borderRadius: 2 },
  status: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 },
  presetsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  presetsRowLandscape: { marginBottom: 12 },
  pill:     { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  pillText: { fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 28, width: '75%', maxWidth: 300, gap: 8 },
  inputRowLandscape: { marginBottom: 20, width: '85%' },
  input:    { flex: 1, fontSize: 17, fontWeight: '600', padding: 0 },
  inputUnit:{ fontSize: 12 },
  setBtn:   { borderLeftWidth: 1, paddingLeft: 12 },
  setBtnText:{ fontSize: 13, fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 },
  controlsLandscape: { marginBottom: 0 },
  mainBtn:  { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  mainBtnLandscape: { width: 58, height: 58, borderRadius: 29 },
  iconBtn:  { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hint:     { fontSize: 11, letterSpacing: 0.5, opacity: 0.6, marginTop: 4 },
});