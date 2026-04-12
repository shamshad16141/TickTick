import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.3)',
      }}
    >
      {/* Tabs as main screen */}
      <Drawer.Screen name="(tabs)" options={{ title: "Home" }} />

      {/* Extra screens */}
      <Drawer.Screen name="focus" options={{ title: "Focus Mode" }} />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
    </Drawer>
  );
}