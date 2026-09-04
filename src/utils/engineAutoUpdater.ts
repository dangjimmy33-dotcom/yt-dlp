// Helper to check official yt-dlp release updates from GitHub
export interface EngineUpdateCheckResult {
  hasNewVersion: boolean;
  latestVersion: string;
  currentVersion: string;
}

export async function checkYtdlpEngineUpdate(
  currentVersion?: string
): Promise<EngineUpdateCheckResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const latestVersion = (data.tag_name || "").trim();
    if (!latestVersion) return null;

    const cur = (currentVersion || "").trim();
    if (!cur || cur === "-") {
      return {
        hasNewVersion: true,
        latestVersion,
        currentVersion: cur,
      };
    }

    const hasNew = isNewerEngineVersion(latestVersion, cur);
    return {
      hasNewVersion: hasNew,
      latestVersion,
      currentVersion: cur,
    };
  } catch {
    return null;
  }
}

// Compare yt-dlp version formats, which are usually date-based e.g. "2025.02.19" or "2024.12.23"
function isNewerEngineVersion(remote: string, current: string): boolean {
  if (!remote || !current) return false;
  if (remote === current) return false;

  const cleanRemote = remote.replace(/^[^0-9]*/, "");
  const cleanCurrent = current.replace(/^[^0-9]*/, "");

  const rParts = cleanRemote.split(".").map((n) => parseInt(n, 10) || 0);
  const cParts = cleanCurrent.split(".").map((n) => parseInt(n, 10) || 0);

  const len = Math.max(rParts.length, cParts.length);
  for (let i = 0; i < len; i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }

  return false;
}
