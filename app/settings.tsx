import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  dividerColor: string;
  subColor: string;
  textColor: string;
};

function SettingRow({ icon, label, sublabel, right, dividerColor, subColor, textColor }: SettingRowProps) {
  return (
    <View style={[styles.row, { borderBottomColor: dividerColor }]}>
      <Ionicons name={icon} size={20} color={subColor} style={styles.rowIcon} />
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSublabel, { color: subColor }]}>{sublabel}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export default function Settings() {
  const insets  = useSafeAreaInsets();
  const {
    isDark, toggleDark, animatedBg,
    textColor, subColor, cardBg, cardBorder, dividerColor,
  } = useTheme();

  const toggleScale = useSharedValue(1);
  const toggleAnim  = useAnimatedStyle(() => ({ transform: [{ scale: toggleScale.value }] }));

  const thumbBg    = isDark ? '#22c55e' : '#94a3b8';
  const trackBg    = isDark ? 'rgba(34,197,94,0.25)' : 'rgba(30,41,59,0.1)';
  const trackBorder = isDark ? '#22c55e' : 'rgba(30,41,59,0.15)';

  return (
    <Animated.View style={[styles.container, animatedBg]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.title, { color: textColor }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: subColor }]}>Preferences & information</Text>

        {/* Appearance Section */}
        <Text style={[styles.sectionHeader, { color: subColor }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            sublabel={isDark ? 'On — double tap any screen to toggle' : 'Off — double tap any screen to toggle'}
            dividerColor="transparent"
            subColor={subColor}
            textColor={textColor}
            right={
              <AnimatedPressable
                onPressIn={() => { toggleScale.value = withTiming(0.88, { duration: 100 }); }}
                onPressOut={() => { toggleScale.value = withSpring(1, { damping: 10, stiffness: 160 }); }}
                onPress={toggleDark}
                style={[styles.toggle, toggleAnim, { backgroundColor: trackBg, borderColor: trackBorder }]}
              >
                <Animated.View style={[
                  styles.thumb,
                  { backgroundColor: thumbBg },
                  isDark ? styles.thumbOn : styles.thumbOff,
                ]} />
              </AnimatedPressable>
            }
          />
        </View>

        {/* Navigation Section */}
        <Text style={[styles.sectionHeader, { color: subColor }]}>NAVIGATION</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <SettingRow
            icon="swap-horizontal-outline"
            label="Swipe to switch screens"
            sublabel="Swipe left/right anywhere to navigate between Clock, Stopwatch, Timer & Alarm"
            dividerColor={dividerColor}
            subColor={subColor}
            textColor={textColor}
          />
          <SettingRow
            icon="sunny-outline"
            label="Toggle dark mode"
            sublabel="Double tap anywhere on any screen"
            dividerColor="transparent"
            subColor={subColor}
            textColor={textColor}
          />
        </View>

        {/* About Section */}
        <Text style={[styles.sectionHeader, { color: subColor }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <SettingRow
            icon="time-outline"
            label="TickTick"
            sublabel="Version 1.0.0"
            dividerColor={dividerColor}
            subColor={subColor}
            textColor={textColor}
          />
          <SettingRow
            icon="code-slash-outline"
            label="Built with"
            sublabel="Expo SDK 54 · React Native 0.81 · React 19"
            dividerColor={dividerColor}
            subColor={subColor}
            textColor={textColor}
          />
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            sublabel="Alarm notifications require permission"
            dividerColor="transparent"
            subColor={subColor}
            textColor={textColor}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { paddingHorizontal: 24 },
  title:     { fontSize: 34, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
  subtitle:  { fontSize: 14, marginBottom: 32 },
  sectionHeader: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.4,
    textTransform: 'uppercase', marginBottom: 10, marginTop: 4,
  },
  card: {
    borderRadius: 20, borderWidth: 1,
    overflow: 'hidden', marginBottom: 28,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rowIcon:    { marginRight: 14 },
  rowText:    { flex: 1, gap: 2 },
  rowLabel:   { fontSize: 15, fontWeight: '500' },
  rowSublabel:{ fontSize: 12, lineHeight: 17 },
  toggle: {
    width: 50, height: 28, borderRadius: 14,
    borderWidth: 1.5, justifyContent: 'center',
    paddingHorizontal: 3,
  },
  thumb:    { width: 20, height: 20, borderRadius: 10 },
  thumbOn:  { alignSelf: 'flex-end' },
  thumbOff: { alignSelf: 'flex-start' },
});
