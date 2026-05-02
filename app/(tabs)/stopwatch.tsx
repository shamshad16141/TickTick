import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { FlatList, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function format(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis  = Math.floor((ms % 1000) / 10);
  return {
    main: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    ms:   String(millis).padStart(2, '0'),
  };
}

export default function Stopwatch() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { isDark, toggleDark, animatedBg, textColor, subColor, pillBg, dividerColor } = useTheme();

  const [time, setTime]       = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps]       = useState<number[]>([]);

  const intervalRef = useRef<any>(null);
  const startScale  = useSharedValue(1);
  const lapScale    = useSharedValue(1);
  const resetScale  = useSharedValue(1);

  function startStop() {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      setRunning(true);
      intervalRef.current = setInterval(() => setTime((prev) => prev + 10), 10);
    }
  }

  function lapFn() {
    if (!running) return;
    setLaps((prev) => [time, ...prev]);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setTime(0);
    setLaps([]);
  }

  const doubleTap = Gesture.Tap().numberOfTaps(2).onStart(() => runOnJS(toggleDark)());

  const animStart = useAnimatedStyle(() => ({ transform: [{ scale: startScale.value }] }));
  const animLap   = useAnimatedStyle(() => ({ transform: [{ scale: lapScale.value }] }));
  const animReset = useAnimatedStyle(() => ({ transform: [{ scale: resetScale.value }] }));

  const startBg        = running ? (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)') : (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)');
  const startBorder    = running ? '#ef4444' : '#22c55e';
  const startIconColor = running ? '#ef4444' : '#22c55e';
  const lapBgFinal     = running ? (isDark ? 'rgba(56,189,248,0.12)' : 'rgba(56,189,248,0.08)') : pillBg;
  const lapBorderFinal = running ? '#38bdf8' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(30,41,59,0.12)');
  const lapIcon        = running ? '#38bdf8' : subColor;
  const resetBorder    = isDark  ? 'rgba(255,255,255,0.18)' : 'rgba(30,41,59,0.12)';

  const timeFontSize = isLandscape ? height * 0.3  : width * 0.22;
  const msFontSize   = isLandscape ? height * 0.13 : width * 0.1;

  const bestLap  = laps.length > 1 ? Math.min(...laps) : null;
  const worstLap = laps.length > 1 ? Math.max(...laps) : null;

  const { main, ms } = format(time);

  const Display = (
    <View style={styles.displayWrap}>
      <View style={styles.displayRow}>
        <Text style={[styles.mainTime, { color: textColor, fontSize: timeFontSize }]}>{main}</Text>
        <Text style={[styles.msTime,   { color: subColor,  fontSize: msFontSize   }]}>.{ms}</Text>
      </View>
      <Text style={[styles.statusLabel, { color: subColor }]}>
        {running ? 'Running' : time > 0 ? 'Paused' : 'Ready'}
      </Text>
    </View>
  );

  const Controls = (
    <View style={[styles.controls, isLandscape && styles.controlsLandscape]}>
      <AnimatedPressable
        onPressIn={() => { resetScale.value = withTiming(0.88, { duration: 100 }); }}
        onPressOut={() => { resetScale.value = withSpring(1, { damping: 10, stiffness: 160 }); }}
        onPress={reset}
        style={[styles.iconBtn, animReset, { backgroundColor: pillBg, borderColor: resetBorder }]}
      >
        <Ionicons name="refresh" size={20} color={subColor} />
      </AnimatedPressable>

      <AnimatedPressable
        onPressIn={() => { startScale.value = withTiming(0.92, { duration: 100 }); }}
        onPressOut={() => { startScale.value = withSpring(1, { damping: 10, stiffness: 160 }); }}
        onPress={startStop}
        style={[styles.mainBtn, animStart, { backgroundColor: startBg, borderColor: startBorder },
          isLandscape && styles.mainBtnLandscape]}
      >
        <Ionicons name={running ? 'pause' : 'play'} size={isLandscape ? 26 : 32} color={startIconColor} />
      </AnimatedPressable>

      <AnimatedPressable
        onPressIn={() => { lapScale.value = withTiming(0.88, { duration: 100 }); }}
        onPressOut={() => { lapScale.value = withSpring(1, { damping: 10, stiffness: 160 }); }}
        onPress={lapFn}
        style={[styles.iconBtn, animLap, { backgroundColor: lapBgFinal, borderColor: lapBorderFinal }]}
      >
        <Ionicons name="flag-outline" size={20} color={lapIcon} />
      </AnimatedPressable>
    </View>
  );

  const LapList = (
    <FlatList
      data={laps}
      keyExtractor={(_, i) => i.toString()}
      style={styles.lapList}
      contentContainerStyle={{ paddingBottom: 100 }}
      ListHeaderComponent={laps.length > 0
        ? <Text style={[styles.lapHeader, { color: subColor, borderBottomColor: dividerColor }]}>
            {laps.length} {laps.length === 1 ? 'Lap' : 'Laps'}
          </Text>
        : null}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Ionicons name="flag-outline" size={32} color={subColor} />
          <Text style={[styles.emptyText, { color: subColor }]}>Laps appear here</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const lapFmt  = format(item);
        const isBest  = item === bestLap;
        const isWorst = item === worstLap;
        return (
          <View style={[styles.lapRow, { borderBottomColor: dividerColor }]}>
            <Text style={[styles.lapNum, { color: subColor }]}>Lap {laps.length - index}</Text>
            <Text style={[styles.lapTime, { color: isBest ? '#22c55e' : isWorst ? '#ef4444' : textColor }]}>
              {lapFmt.main}.{lapFmt.ms}
            </Text>
          </View>
        );
      }}
    />
  );

  const Hint = (
    <Text style={[styles.hint, { color: subColor }]}>
      Double tap · {isDark ? 'light' : 'dark'} mode
    </Text>
  );

  return (
    <GestureDetector gesture={doubleTap}>
      <Animated.View style={[styles.container, animatedBg, isLandscape && styles.containerLandscape]}>
        {isLandscape ? (
          <>
            <View style={styles.lsLeft}>{Display}{Controls}{Hint}</View>
            <View style={[styles.lsRight, { borderLeftColor: dividerColor }]}>{LapList}</View>
          </>
        ) : (
          <>{Display}{Controls}{LapList}{Hint}</>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, alignItems: 'center' },
  containerLandscape: { flexDirection: 'row' },
  lsLeft:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  lsRight: { flex: 1, borderLeftWidth: 1 },
  displayWrap: { alignItems: 'center', marginTop: 60, marginBottom: 12 },
  displayRow:  { flexDirection: 'row', alignItems: 'flex-end' },
  mainTime:    { fontWeight: 'bold', letterSpacing: 2 },
  msTime:      { fontWeight: '600', marginBottom: 8, marginLeft: 2 },
  statusLabel: { fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 6 },
  controls:   { flexDirection: 'row', alignItems: 'center', gap: 28, marginTop: 32, marginBottom: 28 },
  controlsLandscape: { marginTop: 20, marginBottom: 12 },
  mainBtn:  { width: 76, height: 76, borderRadius: 38, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  mainBtnLandscape: { width: 60, height: 60, borderRadius: 30 },
  iconBtn:  { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lapList:  { width: '88%', alignSelf: 'center', flex: 1 },
  lapHeader:{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', paddingBottom: 10, marginBottom: 4, borderBottomWidth: 1 },
  lapRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  lapNum:   { fontSize: 13 },
  lapTime:  { fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  emptyWrap:{ alignItems: 'center', marginTop: 40, gap: 10 },
  emptyText:{ fontSize: 13 },
  hint:     { fontSize: 11, letterSpacing: 0.5, opacity: 0.6, marginBottom: 12 },
});