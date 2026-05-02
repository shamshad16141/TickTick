import { Tabs, usePathname, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

const routeOrder = ['clock', 'stopwatch', 'timer', 'alarm'] as const;
const routePathMap = {
  clock:     '/(tabs)/clock',
  stopwatch: '/(tabs)/stopwatch',
  timer:     '/(tabs)/timer',
  alarm:     '/(tabs)/alarm',
} as const;

export default function TabLayout() {
  const router   = useRouter();
  const pathname = usePathname();

  const navigateTab = (direction: 'left' | 'right') => {
    const current      = pathname.split('/').pop() || 'clock';
    const currentIndex = routeOrder.findIndex((r) => r === current);
    const index        = currentIndex === -1 ? 0 : currentIndex;

    if (direction === 'left' && index < routeOrder.length - 1) {
      router.replace(routePathMap[routeOrder[index + 1]]);
    }
    if (direction === 'right' && index > 0) {
      router.replace(routePathMap[routeOrder[index - 1]]);
    }
  };

  const panGesture = Gesture.Pan()
    .onEnd((e) => {
      if (Math.abs(e.translationX) < 60) return;
      runOnJS(navigateTab)(e.translationX < 0 ? 'left' : 'right');
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <Tabs
          tabBar={() => null}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            sceneStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Tabs.Screen name="clock"     options={{ title: 'Clock' }} />
          <Tabs.Screen name="stopwatch" options={{ title: 'Stopwatch' }} />
          <Tabs.Screen name="timer"     options={{ title: 'Timer' }} />
          <Tabs.Screen name="alarm"     options={{ title: 'Alarm' }} />
        </Tabs>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});