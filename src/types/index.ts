export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution?: string;
  width?: number;
  height?: number;
  fps?: number;
  filesize?: number;
  filesize_approx?: number;
  vcodec?: string;
  acodec?: string;
  format_note?: string;
  is_video: boolean;
  is_audio: boolean;
}

export interface SubtitleInfo {
  lang: string;
  name: string;
  is_auto: boolean;
}

export interface PlaylistEntry {
  id: string;
  title: string;
  url: string;
  duration?: number;
  uploader?: string;
  thumbnail?: string;
  selected?: boolean;
  is_playlist?: boolean;
  playlist_count?: number;
  entry_type?: 'video' | 'playlist' | 'channel';
  subscriber_count?: string;
  description?: string;
  is_verified?: boolean;
  channel_url?: string;
}

export interface MediaInfo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  duration_str: string;
  uploader: string;
  channel_url?: string;
  view_count?: number;
  description?: string;
  formats: VideoFormat[];
  subtitles: SubtitleInfo[];
  is_playlist: boolean;
  playlist_count?: number;
  entries?: PlaylistEntry[];
}

export interface DownloadRequest {
  id: string;
  url: string;
  title: string;
  download_type: 'video' | 'audio' | 'custom';
  quality: string; // 'best' | '4320p' | '2160p' | '1440p' | '1080p' | '720p' | '480p' | '360p'
  format_id?: string;
  video_container?: string; // 'mp4' | 'mkv' | 'webm' | 'mov'
  video_codec?: string; // 'h264' | 'hevc' | 'av1' | 'vp9'
  audio_format?: string; // 'mp3' | 'm4a' | 'flac' | 'wav' | 'opus' | 'ogg'
  audio_quality?: string; // '320K' | '256K' | '192K' | '128K' | '0'
  audio_normalize?: boolean;
  output_dir: string;
  custom_filename?: string;
  embed_subtitles: boolean;
  embed_thumbnail: boolean;
  embed_metadata: boolean;
  sponsorblock: boolean;
  cookies_browser?: string;
  trim_start?: string;
  trim_end?: string;
  custom_args?: string;
  /** Referer captured from the browser page that requested a direct stream. */
  referer?: string;
  /** Marks a URL as a direct media/HLS/DASH stream instead of a normal webpage. */
  direct_stream?: boolean;
}

export interface SniffedStreamPayload {
  stream_url: string;
  page_url: string;
  page_title: string;
  source_type: string;
}

export interface DownloadProgressEvent {
  task_id: string;
  percent: f64;
  speed: string;
  eta: string;
  total_size: string;
  status: 'downloading' | 'merging' | 'completed' | 'error' | 'cancelled';
  error_message?: string;
  output_path?: string;
}

export interface DownloadTask {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  type: 'video' | 'audio' | 'custom';
  quality: string;
  outputDir: string;
  percent: number;
  speed: string;
  eta: string;
  totalSize: string;
  status: 'queued' | 'downloading' | 'merging' | 'completed' | 'error' | 'cancelled';
  createdAt: number;
  completedAt?: number;
  errorMessage?: string;
  outputPath?: string;
}

export interface AppSettings {
  defaultDownloadDir: string;
  maxConcurrentDownloads: number;
  defaultVideoQuality: string;
  defaultAudioFormat: string;
  defaultAudioQuality: string;
  embedMetadata: boolean;
  embedThumbnail: boolean;
  embedSubtitles: boolean;
  sponsorBlock: boolean;
  cookiesBrowser: string;
  speedLimit: string;
  theme: 'dark' | 'light' | 'neon';
  notifications: boolean;
}

export interface EngineStatus {
  ytdlp_available: boolean;
  ytdlp_version: string;
  ytdlp_path: string;
  ffmpeg_available: boolean;
  ffmpeg_version: string;
  ffmpeg_path: string;
  custom_ytdlp_path?: string;
  custom_ffmpeg_path?: string;
  detected_ytdlp_paths?: string[];
}

export interface CustomDomainRule {
  id: string;
  domain: string;
  name: string;
  original_url: string;
  referer: string;
  is_enabled: boolean;
  added_at: string;
  note?: string;
}

export interface CustomPluginInfo {
  id: string;
  name: string;
  filename: string;
  path: string;
  size: number;
  size_str: string;
  modified_at: string;
  is_enabled: boolean;
  description?: string;
}

type f64 = number;
