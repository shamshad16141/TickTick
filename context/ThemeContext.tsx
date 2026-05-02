import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type ThemeContextType = {
  isDark: boolean;
  toggleDark: () => void;
  animatedBg: ReturnType<typeof useAnimatedStyle>;
  textColor: string;
  subColor: string;
  pillBg: string;
  pillActiveBg: string;
  inputBg: string;
  inputBorder: string;
  cardBg: string;
  cardBorder: string;
  dividerColor: string;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

const THEME_KEY = 'app_theme_dark';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const bgAnim = useSharedValue(0);

  // ── Load persisted theme on mount ──────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'true') {
        setIsDark(true);
        bgAnim.value = 1;
      }
    });
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    bgAnim.value = withTiming(next ? 1 : 0, { duration: 400 });
    AsyncStorage.setItem(THEME_KEY, String(next));
  };

  const animatedBg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(bgAnim.value, [0, 1], ['#ffffff', '#000000']),
  }));

  const textColor    = isDark ? '#f1f5f9' : '#1e293b';
  const subColor     = isDark ? '#64748b'  : '#94a3b8';
  const pillBg       = isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(30,41,59,0.06)';
  const pillActiveBg = isDark ? 'rgba(255,255,255,0.18)'  : 'rgba(30,41,59,0.14)';
  const inputBg      = isDark ? 'rgba(255,255,255,0.07)'  : 'rgba(30,41,59,0.05)';
  const inputBorder  = isDark ? 'rgba(255,255,255,0.15)'  : 'rgba(30,41,59,0.12)';
  const cardBg       = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(30,41,59,0.05)';
  const cardBorder   = isDark ? 'rgba(255,255,255,0.1)'   : 'rgba(30,41,59,0.08)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(30,41,59,0.07)';

  return (
    <ThemeContext.Provider value={{
      isDark, toggleDark, animatedBg,
      textColor, subColor, pillBg, pillActiveBg,
      inputBg, inputBorder, cardBg, cardBorder, dividerColor,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
