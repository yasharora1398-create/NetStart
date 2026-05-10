// Module-level Reanimated shared value driven by the topmost scrollable
// screen. 0 = top, 1 = bottom (proportional to scrollable distance).
// Tab bar's animated rim sheens read from this to translate.
import { makeMutable } from "react-native-reanimated";

export const scrollProgress = makeMutable(0);
