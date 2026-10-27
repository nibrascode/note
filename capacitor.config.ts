import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.nibras.note",
  appName: "Nibras Note",
  webDir: "dist",
  android: { allowMixedContent: false },
};
export default config;
