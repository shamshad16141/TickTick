
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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

function AnimatedColon({ color, fontSize }: { color: string; fontSize: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.45, { duration: 900 }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.96 + pulse.value * 0.06 }],
  }));

  return (
    <Animated.Text style={[styles.colonLandscape, { color, fontSize }, animatedStyle]}>
      :
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  const [buttonVisible, setButtonVisible] = useState(false);
  const scale = useSharedValue(1);
  const buttonOpacity = useSharedValue(0);
  const backgroundPulse = useSharedValue(0);
  const hideButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(interval);
  }, [getTime]);

  useEffect(() => {
    backgroundPulse.value = 0;
    backgroundPulse.value = withTiming(1, { duration: 1000 });
  }, [time.s]);

  const showButton = useCallback(() => {
    if (hideButtonTimeoutRef.current) {
      clearTimeout(hideButtonTimeoutRef.current);
    }
    setButtonVisible(true);
    buttonOpacity.value = withTiming(1, { duration: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideButtonTimeoutRef.current = setTimeout(() => {
      buttonOpacity.value = withTiming(0, { duration: 200 });
      setButtonVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideButtonTimeoutRef.current) {
        clearTimeout(hideButtonTimeoutRef.current);
      }
    };
  }, []);

  const animatedButton = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const buttonAnimStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));
  const backgroundPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.14 + (backgroundPulse.value * 0.12),
    transform: [{ scale: 1.08 + (backgroundPulse.value * 0.04) }],
  }));
  const backgroundPulseStyleAlt = useAnimatedStyle(() => ({
    opacity: 0.09 + ((1 - backgroundPulse.value) * 0.09),
    transform: [{ scale: 1.02 + ((1 - backgroundPulse.value) * 0.03) }],
  }));

  const doubleTap = Gesture.Tap().numberOfTaps(2).onStart(() => runOnJS(toggleDark)());

  const colonColor = isDark ? '#e2e8f0' : '#1e293b';
  const toggleBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30,41,59,0.08)';

  return (
    <GestureDetector gesture={doubleTap}>
      <Animated.View style={[styles.container, animatedBg] as any} onTouchEnd={showButton}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backgroundOrbs,
            {
              backgroundColor: 'transparent',
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backgroundOrbTopLeft,
            {
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.26)' : 'rgba(59, 130, 246, 0.18)',
            },
            backgroundPulseStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backgroundOrbBottomRight,
            {
              backgroundColor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(14, 165, 233, 0.12)',
            },
            backgroundPulseStyleAlt,
          ]}
        />

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
          {isLandscape ? <AnimatedColon color={colonColor} fontSize={colonFontSize} /> : null}
          <AnimatedDigit value={time.m} isLandscape={isLandscape} width={width} height={height} isVertical={!isLandscape} textColor={textColor} />
          {isLandscape ? <AnimatedColon color={colonColor} fontSize={colonFontSize} /> : null}
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
          onPress={() => {
            setIs24Hour(!is24Hour);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          style={[styles.toggle, animatedButton, buttonAnimStyle, isLandscape && styles.toggleLandscape, { backgroundColor: toggleBg }]}
          pointerEvents={buttonVisible ? 'auto' : 'none'}
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
  backgroundOrbs: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundOrbTopLeft: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -60,
    left: -70,
  },
  backgroundOrbBottomRight: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    right: -120,
    bottom: -120,
  },
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
