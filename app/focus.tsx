import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function Focus() {
  const [time, setTime] = useState(getTime());

  // glow animation value
  const glow = useSharedValue(0.6);

  function getTime() {
    const now = new Date();
    return {
      h: String(now.getHours()).padStart(2, '0'),
      m: String(now.getMinutes()).padStart(2, '0'),
      s: String(now.getSeconds()).padStart(2, '0'),
    };
  }

  useEffect(() => {
    // 🔒 Lock to landscape
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );

    const interval = setInterval(() => {
      setTime(getTime());
    }, 1000);

    // ✨ Glow pulse animation
    glow.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );

    return () => {
      clearInterval(interval);

      // 🔓 Unlock back when leaving screen
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={styles.container}>
      {/* Dark Background */}
      <LinearGradient
        colors={['#000000', '#020617']}
        style={styles.gradient}
      />

      {/* CLOCK */}
      <View style={styles.row}>
        <Animated.Text style={[styles.hour, glowStyle]}>
          {time.h}
        </Animated.Text>

        <Text style={styles.colon}>:</Text>

        <Animated.Text style={[styles.minute, glowStyle]}>
          {time.m}
        </Animated.Text>

        <Text style={styles.colon}>:</Text>

        <Animated.Text style={[styles.second, glowStyle]}>
          {time.s}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  hour: {
    fontSize: width * 0.22,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  minute: {
    fontSize: width * 0.22,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  second: {
    fontSize: width * 0.08,
    color: '#ffffff',
    marginBottom: 10,
    marginLeft: 8,
  },

  colon: {
    fontSize: width * 0.2,
    color: '#ffffff',
    marginHorizontal: 5,
  },
});