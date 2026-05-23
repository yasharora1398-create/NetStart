import { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
 useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useTheme } from "@/lib/themeMode";
import { scrollProgress } from "@/lib/scrollProgress";

type ScreenProps = {
 children: ReactNode;
 scroll?: boolean;
};

// paddingBottom clears the floating tab bar (24px gap + ~68px height + slack).
const CONTENT_STYLE = { padding: 20, paddingBottom: 120 };

export const Screen = ({ children, scroll = true }: ScreenProps) => {
 const { theme } = useTheme();

 // Update the global scrollProgress so the tab bar's rim sheens
 // translate as the user scrolls within this screen.
 const scrollHandler = useAnimatedScrollHandler({
 onScroll: (e) => {
 "worklet";
 const max = e.contentSize.height - e.layoutMeasurement.height;
 if (max > 0) {
 const t = e.contentOffset.y / max;
 const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
 // Direct mapping — no withTiming, so the sheen stops the
 // instant scrolling stops. Visual speed is controlled by the
 // sheen's translation range in (tabs)/_layout.tsx.
 scrollProgress.value = clamped;
 }
 },
 });

 return (
 <SafeAreaView
 style={{ flex: 1, backgroundColor: theme.bg }}
 edges={["top"]}
 >
 {scroll ? (
 <Animated.ScrollView
 contentContainerStyle={CONTENT_STYLE}
 keyboardShouldPersistTaps="handled"
 onScroll={scrollHandler}
 scrollEventThrottle={16}
 >
 {children}
 </Animated.ScrollView>
 ) : (
 <View style={CONTENT_STYLE}>{children}</View>
 )}
 </SafeAreaView>
 );
};
