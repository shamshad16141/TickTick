import { ThemeProvider } from '../context/ThemeContext';
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerType: 'slide',
          overlayColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ title: 'Home' }} />
        <Drawer.Screen name="focus"  options={{ title: 'Focus Mode' }} />
        <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
      </Drawer>
    </ThemeProvider>
  );
}