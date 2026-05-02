import { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts, OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { useColorScheme } from "@/hooks/use-color-scheme";
import AnimatedSplash from "@/features/splash/SplashScreen";

SplashScreen.preventAutoHideAsync();

export default function RootNavigationLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({ OpenSans_400Regular });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const RNText = Text as unknown as { defaultProps?: { style?: unknown } };
    RNText.defaultProps = RNText.defaultProps || {};
    RNText.defaultProps.style = [{ fontFamily: "OpenSans_400Regular" }, RNText.defaultProps.style];

    const RNTextInput = TextInput as unknown as { defaultProps?: { style?: unknown } };
    RNTextInput.defaultProps = RNTextInput.defaultProps || {};
    RNTextInput.defaultProps.style = [
      { fontFamily: "OpenSans_400Regular" },
      RNTextInput.defaultProps.style,
    ];
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </ThemeProvider>
  );
}
