import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';


export const unstable_settings = {
  initialRouteName: 'welcome',
};

export default function RootLayout() {

  return (
    <ThemeProvider value={DefaultTheme}>
      {/* hide native headers for all stack screens here so page-level headerShown isn't ignored */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* index redirects to welcome */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* welcome screen first */}
        <Stack.Screen name="welcome" />
        {/* entry screens */}
        <Stack.Screen name="login" />
        {/* groups */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(kitchen-tabs)" />
        <Stack.Screen name="(delivery-tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

