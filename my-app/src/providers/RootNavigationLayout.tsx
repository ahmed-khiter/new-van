import { useEffect, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import {
  useFonts,
  OpenSans_400Regular,
  OpenSans_400Regular_Italic,
  OpenSans_600SemiBold,
  OpenSans_600SemiBold_Italic,
  OpenSans_700Bold,
  OpenSans_700Bold_Italic,
} from "@expo-google-fonts/open-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import AnimatedSplash from "@/features/splash/SplashScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const applyDefaultFont = () => {
  const RNText = Text as unknown as { defaultProps?: { style?: unknown } };
  RNText.defaultProps = RNText.defaultProps || {};
  RNText.defaultProps.style = [{ fontFamily: "OpenSans_400Regular" }, RNText.defaultProps.style];

  const RNTextInput = TextInput as unknown as { defaultProps?: { style?: unknown } };
  RNTextInput.defaultProps = RNTextInput.defaultProps || {};
  RNTextInput.defaultProps.style = [
    { fontFamily: "OpenSans_400Regular" },
    RNTextInput.defaultProps.style,
  ];
};

export default function RootNavigationLayout() {
  const [fontsLoaded, fontError] = useFonts({
    OpenSans_400Regular,
    OpenSans_400Regular_Italic,
    OpenSans_600SemiBold,
    OpenSans_600SemiBold_Italic,
    OpenSans_700Bold,
    OpenSans_700Bold_Italic,
  });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      applyDefaultFont();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Force pure white background at system level
  useEffect(() => {
    SystemUI.setBackgroundColorAsync("#FFFFFF");
  }, []);

  // Imperative status bar control for maximum reliability
  useEffect(() => {
    if (splashDone) {
      // Small delay to ensure the screen has transitioned
      const timer = setTimeout(() => {
        setStatusBarStyle("dark");
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setStatusBarStyle("light");
    }
  }, [splashDone]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaProvider>
        <ThemeProvider value={DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>

          <StatusBar
            key={splashDone ? "app-status" : "splash-status"}
            style={splashDone ? "dark" : "light"}
          />

          {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
        </ThemeProvider>
      </SafeAreaProvider>
    </View>
  );
}
