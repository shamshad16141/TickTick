import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

function AutoHideTabBar({ visible, ...props }: BottomTabBarProps & { visible: boolean }) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 260 });
    translateY.value = withTiming(visible ? 0 : 20, { duration: 260 });
  }, [visible, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle} pointerEvents={visible ? 'auto' : 'none'}>
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startFadeTimer = useCallback(() => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      setTabBarVisible(false);
    }, 2200);
  }, []);

  const handleScreenTouch = useCallback(() => {
    setTabBarVisible(true);
    startFadeTimer();
  }, [startFadeTimer]);

  useEffect(() => {
    startFadeTimer();
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [startFadeTimer]);

  return (
    <View style={styles.container} onTouchStart={handleScreenTouch}>
      <Tabs
        tabBar={(props) => <AutoHideTabBar {...props} visible={tabBarVisible} />}
        screenOptions={({ route }) => ({
          headerShown: false,
          animation: 'fade',

          sceneStyle: {
            backgroundColor: 'transparent',
          },

          // Floating glass tab bar
          tabBarStyle: {
            position: 'absolute',
            bottom: 20,
            left: 40,
            right: 40,
            height: 75,
            borderRadius: 30,
            overflow: 'hidden',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },

          // Blur background
          tabBarBackground: () => (
            <BlurView
              intensity={100}
              tint="dark"
              style={styles.blur}
            />
          ),

          tabBarActiveTintColor: '#60a5fa',
          tabBarInactiveTintColor: '#94a3b8',

          tabBarLabelStyle: {
            fontSize: 11,
            marginBottom: 5,
          },

          tabBarIconStyle: {
            marginTop: 6,
          },

          tabBarIcon: ({ color, focused }) => {
            let icon: any;

            if (route.name === 'clock') icon = 'time';
            if (route.name === 'stopwatch') icon = 'timer';
            if (route.name === 'timer') icon = 'hourglass';
            if (route.name === 'alarm') icon = 'alarm';

            return (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={{ transform: [{ scale: focused ? 1.15 : 1 }] }}
              >
                <Ionicons name={icon} size={focused ? 26 : 22} color={color} />
              </Animated.View>
            );
          },
        })}
      >
        <Tabs.Screen name="clock" options={{ title: 'Clock' }} />
        <Tabs.Screen name="stopwatch" options={{ title: 'Stopwatch' }} />
        <Tabs.Screen name="timer" options={{ title: 'Timer' }} />
        <Tabs.Screen name="alarm" options={{ title: 'Alarm' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  blur: {
    flex: 1,
    borderRadius: 30,
  },
});