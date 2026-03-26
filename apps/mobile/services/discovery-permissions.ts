import { PermissionsAndroid, Platform } from "react-native";

const ANDROID_NEARBY_WIFI_DEVICES_PERMISSION =
  "android.permission.NEARBY_WIFI_DEVICES";
const ANDROID_FINE_LOCATION_PERMISSION = "android.permission.ACCESS_FINE_LOCATION";

function getAndroidApiLevel(): number {
  if (Platform.OS !== "android") return 0;
  if (typeof Platform.Version === "number") return Platform.Version;
  const parsed = Number.parseInt(String(Platform.Version), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function ensureDiscoveryPermissions(): Promise<{
  granted: boolean;
  details: string;
}> {
  if (Platform.OS !== "android") {
    return { granted: true, details: "platform=non-android" };
  }

  const apiLevel = getAndroidApiLevel();
  if (apiLevel >= 33) {
    const permission =
      ANDROID_NEARBY_WIFI_DEVICES_PERMISSION as Parameters<
        typeof PermissionsAndroid.check
      >[0];
    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) {
      return { granted: true, details: `api=${apiLevel} nearby=granted` };
    }

    const result = await PermissionsAndroid.request(permission, {
      title: "Allow Nearby Devices",
      message:
        "LearnifyTube needs Nearby devices permission to discover your desktop app on local Wi-Fi.",
      buttonPositive: "Allow",
      buttonNegative: "Not now",
    });

    return {
      granted: result === PermissionsAndroid.RESULTS.GRANTED,
      details: `api=${apiLevel} nearby=${result}`,
    };
  }

  const permission =
    ANDROID_FINE_LOCATION_PERMISSION as Parameters<
      typeof PermissionsAndroid.check
    >[0];
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return { granted: true, details: `api=${apiLevel} location=granted` };
  }

  const result = await PermissionsAndroid.request(permission, {
    title: "Allow Location for Nearby Discovery",
    message:
      "Android requires Location permission for local network discovery on this version. LearnifyTube only uses it to find your desktop app on Wi-Fi.",
    buttonPositive: "Allow",
    buttonNegative: "Not now",
  });

  return {
    granted: result === PermissionsAndroid.RESULTS.GRANTED,
    details: `api=${apiLevel} location=${result}`,
  };
}
