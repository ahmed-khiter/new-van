import { StatusBar } from "expo-status-bar";
import HomePageScreen from "./src/features/home/screens/HomePageScreen";

export default function App() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#faf9f7" translucent={false} hidden={false} />
      <HomePageScreen />
    </>
  );
}
