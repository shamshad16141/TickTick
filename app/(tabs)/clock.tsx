import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedDigit({ value }: { value: string }) {
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
  }, [value, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.time, style]}>
      {display}
    </Animated.Text>
  );
}

export default function Clock() {
  const [is24Hour, setIs24Hour] = useState(true);
  const getTime = useCallback(() => {
    const now = new Date();
    let hours = now.getHours();
    let ampm = "";

    if (!is24Hour) {
      ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
    }

    return {
      h: String(hours).padStart(2, '0'),
      m: String(now.getMinutes()).padStart(2, '0'),
      s: String(now.getSeconds()).padStart(2, '0'),
      ampm,
    };
  }, [is24Hour]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    return {
      h: String(hours).padStart(2, '0'),
      m: String(now.getMinutes()).padStart(2, '0'),
      s: String(now.getSeconds()).padStart(2, '0'),
      ampm: '',
    };
  });

  const scale = useSharedValue(1);

  useEffect(() => {
    setTime(getTime());

    const interval = setInterval(() => {
      setTime(getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [getTime]);

  const animatedButton = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* 🎨 Gradient */}
      <LinearGradient
        colors={['#7dd3fc', '#3b82f6', '#1e3a8a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Clock */}
      <View style={styles.row}>
        <AnimatedDigit value={time.h} />
        <Text style={styles.colon}>:</Text>
        <AnimatedDigit value={time.m} />
        <Text style={styles.colon}>:</Text>
        <AnimatedDigit value={time.s} />

        {!is24Hour && (
          <Text style={styles.ampm}>{time.ampm}</Text>
        )}
      </View>

      {/* 🔘 Animated Toggle Button */}
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withTiming(0.92, { duration: 120 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, {
            damping: 10,
            stiffness: 150,
          });
        }}
        onPress={() => setIs24Hour(!is24Hour)}
        style={[styles.toggle, animatedButton]}
      >
        <Text style={styles.toggleText}>
          {is24Hour ? "Switch to 12H" : "Switch to 24H"}
        </Text>
      </AnimatedPressable>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: width * 0.16,
    color: "#ffffff",
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  colon: {
    fontSize: width * 0.16,
    color: "#ffffff",
    marginHorizontal: 4,
    fontWeight: 'bold',
  },
  ampm: {
    fontSize: 20,
    color: "#e2e8f0",
    marginLeft: 8,
    marginTop: 10,
  },

  // 🔘 Button
  toggle: {
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toggleText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: '600',
  },
});