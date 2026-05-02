
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const NOTIF_KEY = 'ticktick_notifications_enabled';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedDigit({ value, isLandscape, width, height, isVertical, textColor }: {
  value: string; isLandscape: boolean; width: number; height: number; isVertical?: boolean; textColor: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (prev.current !== value) {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(-15, { duration: 150 });
      setTimeout(() => {
        setDisplay(value);
        translateY.value = 15;
        opacity.value = withTiming(1, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        prev.current = value;
      }, 150);
    }
  }, [value]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const fontSize = isLandscape ? height * 0.30 : (isVertical ? width * 0.35 : width * 0.16);

  return (
    <Animated.Text style={[{ fontWeight: 'bold', letterSpacing: 2, color: textColor }, style, { fontSize }]}>
      {display}
    </Animated.Text>
  );
}

export default function Clock() {
  const [is24Hour, setIs24Hour] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const colonFontSize = isLandscape ? height * 0.22 : 80;

  const { isDark, toggleDark, animatedBg, textColor, subColor } = useTheme();

  // Load saved notification preference
  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then((val) => {
      const enabled = val !== 'false';
      setNotifEnabled(enabled);
      applyNotificationHandler(enabled);
    });
  }, []);

  const applyNotificationHandler = (enabled: boolean) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: enabled,
        shouldPlaySound: enabled,
        shouldSetBadge: enabled,
        shouldShowBanner: enabled,
        shouldShowList: enabled,
      }),
    });
  };

  const toggleNotifications = async () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    applyNotificationHandler(next);
    await AsyncStorage.setItem(NOTIF_KEY, String(next));
  };

  const notifScale = useSharedValue(1);
  const notifAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: notifScale.value }] }));

  const getTime = useCallback(() => {
    const now = new Date();
    let hours = now.getHours();
    let ampm = '';
    if (!is24Hour) {
      ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
    }
    return {
      h: String(hours).padStart(2, '0'),
      m: String(now.getMinutes()).padStart(2, '0'),
      s: String(now.getSeconds()).padStart(2, '0'),
      ampm,
    };
  }, [is24Hour]);

  const [time, setTime] = useState(getTime());
  const scale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(interval);
  }, [getTime]);

  const animatedButton = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const doubleTap = Gesture.Tap().numberOfTaps(2).onStart(() => runOnJS(toggleDark)());

  const colonColor = isDark ? '#e2e8f0' : '#1e293b';
  const toggleBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30,41,59,0.08)';

  return (
    <GestureDetector gesture={doubleTap}>
      <Animated.View style={[styles.container, animatedBg] as any}>

        {/* Notification Toggle — top-right */}
        <AnimatedPressable
          onPressIn={() => { notifScale.value = withTiming(0.88, { duration: 100 }); }}
          onPressOut={() => { notifScale.value = withSpring(1, { damping: 10, stiffness: 180 }); }}
          onPress={toggleNotifications}
          style={[styles.notifBtn, notifAnimStyle, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          }]}
          accessibilityLabel={notifEnabled ? 'Mute notifications' : 'Unmute notifications'}
        >
          <Ionicons
            name={notifEnabled ? 'notifications-outline' : 'notifications-off-outline'}
            size={22}
            color={notifEnabled ? textColor : (isDark ? '#fc8181' : '#e53e3e')}
          />
        </AnimatedPressable>

        {/* Clock */}
        <View style={isLandscape ? styles.row : styles.column}>
          <AnimatedDigit value={time.h} isLandscape={isLandscape} width={width} height={height} isVertical={!isLandscape} textColor={textColor} />
          {isLandscape ? <Text style={[styles.colonLandscape, { color: colonColor, fontSize: colonFontSize }]}>:</Text> : null}
          <AnimatedDigit value={time.m} isLandscape={isLandscape} width={width} height={height} isVertical={!isLandscape} textColor={textColor} />
          {isLandscape ? <Text style={[styles.colonLandscape, { color: colonColor, fontSize: colonFontSize }]}>:</Text> : null}
          <AnimatedDigit value={time.s} isLandscape={isLandscape} width={width} height={height} isVertical={!isLandscape} textColor={textColor} />
          {!is24Hour && (
            <Text style={[
              styles.ampm,
              isLandscape ? styles.ampmLandscape : styles.ampmVertical,
              { color: subColor },
            ]}>
              {time.ampm}
            </Text>
          )}
        </View>

        <Text style={[styles.hint, { color: subColor }]}>
          Double tap to {isDark ? 'light' : 'dark'} mode
        </Text>

        {/* 12H/24H Toggle Button */}
        <AnimatedPressable
          onPressIn={() => { scale.value = withTiming(0.92, { duration: 120 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 150 }); }}
          onPress={() => setIs24Hour(!is24Hour)}
          style={[styles.toggle, animatedButton, isLandscape && styles.toggleLandscape, { backgroundColor: toggleBg }]}
        >
          <Text style={[styles.toggleText, isLandscape && styles.toggleTextLandscape, { color: textColor }]}>
            {is24Hour ? 'Switch to 12H' : 'Switch to 24H'}
          </Text>
        </AnimatedPressable>

      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  column: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  ampm: { marginLeft: 8, marginTop: 10 },
  ampmVertical: { marginTop: 10, fontSize: 24, fontWeight: 'bold' },
  ampmLandscape: { fontSize: 32 },
  colonLandscape: { fontWeight: 'bold', marginHorizontal: 4 },
  hint: { marginTop: 16, fontSize: 12, letterSpacing: 0.5, opacity: 0.6 },
  toggle: { marginTop: 32, paddingVertical: 14, paddingHorizontal: 30, borderRadius: 25 },
  toggleText: { fontSize: 15, fontWeight: '600' },
  toggleLandscape: { marginTop: 20 },
  toggleTextLandscape: { fontSize: 14 },
  notifBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
