import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

function getTime() {
  const now = new Date();
  return {
    h: String(now.getHours()).padStart(2, '0'),
    m: String(now.getMinutes()).padStart(2, '0'),
    s: String(now.getSeconds()).padStart(2, '0'),
  };
}

function getDateParts() {
  const now = new Date();
  return {
    weekday: now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
    day:     String(now.getDate()).padStart(2, '0'),
    month:   now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
}

export default function Focus() {
  const [time, setTime]   = useState(getTime);
  const [date, setDate]   = useState(getDateParts);
  const { width, height } = useWindowDimensions();
  const insets            = useSafeAreaInsets();
  const isLandscape       = width > height;
  const base              = Math.min(width, height);

  const { isDark, toggleDark, animatedBg, textColor, subColor } = useTheme();

  // Accent colours flip with theme so Focus stays readable in both modes
  const accentColor  = isDark ? '#60a5fa' : '#2563eb';
  const accentSub    = isDark ? '#93c5fd' : '#3b82f6';

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getTime());
      setDate(getDateParts());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const doubleTap = Gesture.Tap().numberOfTaps(2).onStart(() => runOnJS(toggleDark)());

  const timeFontSize = isLandscape ? height * 0.28 : base * 0.22;
  const secFontSize  = isLandscape ? height * 0.07 : base * 0.06;
  const dateFontSize = isLandscape ? height * 0.05 : base * 0.05;
  const dayFontSize  = isLandscape ? height * 0.03 : base * 0.032;

  return (
    <GestureDetector gesture={doubleTap}>
      <Animated.View
        style={[
          styles.container,
          animatedBg,
          {
            flexDirection: isLandscape ? 'row' : 'column',
            paddingTop:    insets.top    + base * 0.05,
            paddingBottom: insets.bottom + base * 0.05,
            paddingLeft:   insets.left   + base * 0.06,
            paddingRight:  insets.right  + base * 0.06,
          },
        ]}
      >
        {/* ── Time block ─────────────────────────────────────────────── */}
        <View style={[styles.timeBlock, isLandscape ? styles.timeBlockLandscape : styles.timeBlockPortrait]}>
          <View style={styles.timeRow}>
            <Text style={[styles.timeMain, { color: accentColor, fontSize: timeFontSize }]}>
              {time.h}:{time.m}
            </Text>
            <Text style={[styles.timeSec, { color: accentSub, fontSize: secFontSize }]}>
              {time.s}
            </Text>
          </View>
          <Text style={[styles.hint, { color: subColor }]}>
            Double tap · {isDark ? 'light' : 'dark'} mode
          </Text>
        </View>

        {/* ── Date block ─────────────────────────────────────────────── */}
        <View style={[styles.dateBlock, isLandscape ? styles.dateBlockLandscape : styles.dateBlockPortrait]}>
          <Text style={[styles.dateDay, { color: textColor, fontSize: dateFontSize }]}>
            {date.day}
          </Text>
          <Text style={[styles.dateMonth, { color: accentSub, fontSize: dayFontSize }]}>
            {date.month}
          </Text>
          <Text style={[styles.dateWeekday, { color: subColor, fontSize: dayFontSize * 0.85 }]}>
            {date.weekday}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Portrait
  timeBlockPortrait:  { alignItems: 'center', justifyContent: 'center', flex: 1 },
  dateBlockPortrait:  { alignItems: 'center', paddingBottom: 16 },

  // Landscape
  timeBlockLandscape: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  dateBlockLandscape: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 8 },

  // Shared
  timeBlock: {},
  dateBlock: {},

  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  timeMain: { fontWeight: 'bold', letterSpacing: 2 },
  timeSec:  { fontWeight: '500', marginBottom: 10 },

  dateDay:     { fontWeight: 'bold', letterSpacing: 1 },
  dateMonth:   { fontWeight: '600', letterSpacing: 2, marginTop: 4 },
  dateWeekday: { letterSpacing: 1.5, marginTop: 4 },

  hint: { fontSize: 11, letterSpacing: 0.5, opacity: 0.6, marginTop: 12 },
});