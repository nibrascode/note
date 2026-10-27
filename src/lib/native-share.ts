import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** On Android: write to cache and open the system share sheet. Returns false on web. */
export async function nativeShareFile(blob: Blob, name: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const data = await toBase64(blob);
  const { uri } = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache });
  try {
    await Share.share({ title: name, files: [uri] });
  } catch {
    /* user cancelled */
  }
  return true;
}
