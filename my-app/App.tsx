import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts, OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import HomePageScreen from "./src/features/home/screens/HomePageScreen";

export default function App() {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
  });

  useEffect(() => {
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [{ fontFamily: "OpenSans_400Regular" }, Text.defaultProps.style];

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [{ fontFamily: "OpenSans_400Regular" }, TextInput.defaultProps.style];
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#faf9f7" translucent={false} hidden={false} />
      <HomePageScreen />
    </>
  );
}
