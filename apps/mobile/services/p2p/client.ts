import * as FileSystemLegacy from "expo-file-system/legacy";
import { Paths, Directory, File } from "expo-file-system";
import type { DiscoveredPeer, PeerVideo, VideoMeta } from "../../types";

const TIMEOUT = 10000;

const log = (message: string, data?: unknown) => {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 12);
  if (data) {
    console.log(`[${timestamp}] [P2P Client] ${message}`, data);
  } else {
    console.log(`[${timestamp}] [P2P Client] ${message}`);
  }
};

function getPeerUrl(peer: DiscoveredPeer): string {
  const url = `http://${peer.host}:${peer.port}`;
  log(`Peer URL: ${url}`);
  return url;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function getPeerInfo(
  peer: DiscoveredPeer
): Promise<{ name: string; videoCount: number }> {
  log(`Getting peer info from ${peer.name}`);
  const url = getPeerUrl(peer);
  const response = await fetchWithTimeout(`${url}/info`);

  if (!response.ok) {
    log(`Failed to get peer info: HTTP ${response.status}`);
    throw new Error(`HTTP ${response.status}`);
  }

  const info = await response.json();
  log(`Peer info received:`, info);
  return info;
}

export async function getPeerVideos(peer: DiscoveredPeer): Promise<PeerVideo[]> {
  log(`Getting videos from ${peer.name}`);
  const url = getPeerUrl(peer);
  const response = await fetchWithTimeout(`${url}/videos`);

  if (!response.ok) {
    log(`Failed to get videos: HTTP ${response.status}`);
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  log(`Received ${data.videos.length} videos from peer`);
  return data.videos;
}

export async function getVideoMeta(
  peer: DiscoveredPeer,
  videoId: string
): Promise<VideoMeta> {
  const url = getPeerUrl(peer);
  const response = await fetchWithTimeout(`${url}/video/${videoId}/meta`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function ensureVideosDir(): Promise<Directory> {
  const videosDir = new Directory(Paths.document, "videos");
  if (!videosDir.exists) {
    videosDir.create();
  }
  return videosDir;
}

export async function downloadVideoFromPeer(
  peer: DiscoveredPeer,
  videoId: string,
  onProgress: (progress: number) => void
): Promise<{ videoPath: string; meta: VideoMeta }> {
  const videosDir = await ensureVideosDir();
  const videoFile = new File(videosDir, `${videoId}.mp4`);
  const url = getPeerUrl(peer);
  const videoUrl = `${url}/video/${videoId}/file`;

  log(`Starting download from peer: ${videoUrl}`);

  // Signal that download is starting
  onProgress(0);

  try {
    // Use legacy FileSystem API for downloading with progress
    const downloadResumable = FileSystemLegacy.createDownloadResumable(
      videoUrl,
      videoFile.uri,
      {},
      (downloadProgress) => {
        const progress = Math.round(
          (downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite) *
            100
        );
        onProgress(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (!result || result.status !== 200) {
      throw new Error(`Download failed: ${result?.status || "unknown error"}`);
    }

    log(`Download complete: ${result.uri}`);
    onProgress(100);

    // Fetch video metadata including transcript
    const meta = await getVideoMeta(peer, videoId);

    return {
      videoPath: videoFile.uri,
      meta,
    };
  } catch (error) {
    log(`Download error:`, error);
    throw error;
  }
}
