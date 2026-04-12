import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Stopwatch() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  const intervalRef = useRef<any>(null);
  const scale = useSharedValue(1);

  function start() {
    if (running) return;
    setRunning(true);

    intervalRef.current = setInterval(() => {
      setTime((prev) => prev + 10); // 10ms precision
    }, 10);
  }

  function pause() {
    setRunning(false);
    clearInterval(intervalRef.current);
  }

  function reset() {
    setRunning(false);
    clearInterval(intervalRef.current);
    setTime(0);
    setLaps([]);
  }

  function lap() {
    if (!running) return;
    setLaps((prev) => [time, ...prev]);
  }

  function format(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#7dd3fc', '#3b82f6', '#1e3a8a']}
        style={styles.gradient}
      />

      {/* Timer */}
      <Text style={styles.time}>{format(time)}</Text>

      {/* Buttons */}
      <View style={styles.controls}>
        <AnimatedPressable
          onPressIn={() => (scale.value = withTiming(0.95))}
          onPressOut={() => (scale.value = withSpring(1))}
          onPress={running ? pause : start}
          style={({ pressed }) => [
            styles.button,
            animStyle,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {running ? "Pause" : "Start"}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPressIn={() => (scale.value = withTiming(0.95))}
          onPressOut={() => (scale.value = withSpring(1))}
          onPress={lap}
          style={({ pressed }) => [
            styles.button,
            animStyle,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>Lap</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPressIn={() => (scale.value = withTiming(0.95))}
          onPressOut={() => (scale.value = withSpring(1))}
          onPress={reset}
          style={({ pressed }) => [
            styles.button,
            animStyle,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </AnimatedPressable>
      </View>

      {/* Lap List */}
      <FlatList
        data={laps}
        keyExtractor={(_, i) => i.toString()}
        style={styles.lapList}
        renderItem={({ item, index }) => (
          <View style={styles.lapItem}>
            <Text style={styles.lapText}>Lap {laps.length - index}</Text>
            <Text style={styles.lapText}>{format(item)}</Text>
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

  time: {
    marginTop: 100,
    fontSize: width * 0.18,
    color: "#fff",
    fontWeight: 'bold',
  },

  controls: {
    flexDirection: 'row',
    marginTop: 40,
    width: '85%',
    justifyContent: 'space-between',
  },

  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: '700',
  },

  lapList: {
    marginTop: 30,
    width: '85%',
  },

  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },

  lapText: {
    color: "#fff",
    fontSize: 14,
  },

  pressed: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});