/**
 * Pemetaan video YouTube untuk koridor Svarga / Jejak Wangi.
 *
 * Koridor yang memiliki video survei/drone:
 * - Koridor 2 (Kalilo): https://youtu.be/x3LkcK1OKkM
 * - Koridor 4 (Blambangan): https://youtu.be/mhafGKnRSBQ
 * - Koridor 5 (Pecinan): https://youtu.be/pubQrc7iaLE
 * - Koridor 6 (Marina Boom): https://youtu.be/IWQeqMmaO-Q
 * - Koridor 7 (Pasar Induk): https://youtu.be/rrbi25AsoXA
 *
 * Koridor yang belum memiliki video (null -> fallback ke hero_image):
 * - Koridor 1 (Sritanjung)
 * - Koridor 3 (Perliman)
 */

export const KORIDOR_VIDEO_MAP = {
  2: "https://youtu.be/x3LkcK1OKkM", // Kalilo
  4: "https://youtu.be/mhafGKnRSBQ", // Blambangan
  5: "https://youtu.be/pubQrc7iaLE", // Pecinan
  6: "https://youtu.be/IWQeqMmaO-Q", // Marina Boom
  7: "https://youtu.be/rrbi25AsoXA", // Pasar Induk
};

/**
 * Ekstraksi 11-karakter YouTube Video ID dari berbagai variasi URL:
 * - youtu.be/<id>
 * - youtube.com/watch?v=<id>
 * - youtube.com/embed/<id>
 * - bare ID 11 karakter
 */
export function getYouTubeVideoId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch) return shortMatch[1];

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (watchMatch) return watchMatch[1];

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Ambil URL video koridor, memprioritaskan properti `koridor.video_url`
 * lalu fallback ke pemetaan id atau pencocokan nama.
 */
export function getKoridorVideoUrl(koridor) {
  if (!koridor) return null;
  if (koridor.video_url) return koridor.video_url;

  const id = Number(koridor.id);
  if (id && KORIDOR_VIDEO_MAP[id]) {
    return KORIDOR_VIDEO_MAP[id];
  }

  const name = `${koridor.short_name || ""} ${koridor.formal_name || ""}`.toLowerCase();
  if (name.includes("boom")) return KORIDOR_VIDEO_MAP[6];
  if (name.includes("pasar")) return KORIDOR_VIDEO_MAP[7];
  if (name.includes("pecinan")) return KORIDOR_VIDEO_MAP[5];
  if (name.includes("kalilo")) return KORIDOR_VIDEO_MAP[2];
  if (name.includes("blambangan")) return KORIDOR_VIDEO_MAP[4];

  return null;
}

/**
 * Bangun URL embed YouTube dengan parameter autoplay, mute (wajib untuk browser modern),
 * loop, controls, dan rel=0.
 */
export function buildYouTubeEmbedUrl(videoId) {
  if (!videoId) return null;
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
    controls: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
