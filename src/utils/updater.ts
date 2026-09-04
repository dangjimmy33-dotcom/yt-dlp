// GitHub Release update checker with automatic bell chime notification

export interface GithubReleaseInfo {
  version: string;
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
  hasUpdate: boolean;
  downloadUrl?: string;
}

export const CURRENT_VERSION = "v1.0.0";
export const GITHUB_REPO = "dangjimmy33-dotcom/yt-dlp";

export async function checkForGithubUpdates(): Promise<GithubReleaseInfo | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const data = await response.json();
    const tagName = data.tag_name || "";
    const cleanTag = tagName.startsWith("v") ? tagName.slice(1) : tagName;
    const currentClean = CURRENT_VERSION.startsWith("v") ? CURRENT_VERSION.slice(1) : CURRENT_VERSION;

    const hasUpdate = isNewerVersion(cleanTag, currentClean);

    // Find Windows installer asset if present
    let downloadUrl = data.html_url;
    if (Array.isArray(data.assets)) {
      const exeAsset = data.assets.find((a: any) =>
        a.name && (a.name.endsWith(".exe") || a.name.endsWith(".msi"))
      );
      if (exeAsset && exeAsset.browser_download_url) {
        downloadUrl = exeAsset.browser_download_url;
      }
    }

    return {
      version: cleanTag,
      tagName,
      name: data.name || tagName,
      body: data.body || "",
      publishedAt: data.published_at || "",
      htmlUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
      hasUpdate,
      downloadUrl,
    };
  } catch (err) {
    console.warn("Check GitHub update error:", err);
    return null;
  }
}

function isNewerVersion(remote: string, current: string): boolean {
  if (!remote) return false;
  if (remote === current) return false;

  const rParts = remote.split(".").map((n) => parseInt(n, 10) || 0);
  const cParts = current.split(".").map((n) => parseInt(n, 10) || 0);

  const len = Math.max(rParts.length, cParts.length);
  for (let i = 0; i < len; i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}
