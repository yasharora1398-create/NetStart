// Expo push notification registration. Call registerForPush(userId) once
// the user is signed in; it asks for permission, gets the Expo token,
// and stores it in the user's profile via the set_expo_push_token RPC.

import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export const registerForPush = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    // Push doesn't work on the iOS simulator / Android emulator.
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#60a5fa",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const projectId =
      // Pulled from app.json -> extra.eas.projectId at runtime; null in
      // local dev which is fine - getExpoPushTokenAsync still issues a
      // legacy token suitable for the Expo push service.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Notifications as any).expoConfig?.extra?.eas?.projectId;
    const tokenResp = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResp.data;
    if (!token) return null;
    const { error } = await supabase.rpc("set_expo_push_token", { token });
    if (error) {
      console.warn("set_expo_push_token failed", error.message);
      return null;
    }
    return token;
  } catch (err) {
    console.warn("registerForPush failed", err);
    return null;
  }
};

export const clearPushToken = async (): Promise<void> => {
  try {
    await supabase.rpc("set_expo_push_token", { token: "" });
  } catch (err) {
    console.warn("clearPushToken failed", err);
  }
};
