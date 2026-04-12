import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: "#020617",
        },
        drawerActiveTintColor: "#3b82f6",
        drawerInactiveTintColor: "#94a3b8",
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ title: "Home" }} />
      <Drawer.Screen name="focus" options={{ title: "Focus Mode" }} />
    </Drawer>
  );
}