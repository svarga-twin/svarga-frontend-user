import { useEffect, useState } from "react";
import SmartImage from "../global/SmartImage";
import Icon from "../global/Icon";
import {
  buildYouTubeEmbedUrl,
  getKoridorVideoUrl,
  getYouTubeVideoId,
} from "../../lib/koridorVideo";

/**
 * Komponen media utama untuk halaman detail koridor.
 *
 * Menampilkan video YouTube yang otomatis diputar (autoplay & mute) jika koridor
 * memiliki tautan video yang valid.
 *
 * Jika video tidak ditemukan / tidak tersedia / terjadi kesalahan (atau koridor belum
 * memiliki video seperti Koridor 1 & 3), komponen secara otomatis beralih menampilkan
 * gambar alternatif (`koridor.hero_image`).
 */
export default function KoridorMedia({ koridor, className = "" }) {
  const [videoError, setVideoError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mode, setMode] = useState("video"); // "video" | "image"

  const rawVideoUrl = getKoridorVideoUrl(koridor);
  const videoId = getYouTubeVideoId(rawVideoUrl);

  // Reset state bila koridor berganti
  useEffect(() => {
    setVideoError(false);
    setIsLoaded(false);
    setMode("video");
  }, [koridor?.id, videoId]);

  // Validasi thumbnail YouTube untuk mendeteksi dini video yang dihapus / 404
  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;
    if (typeof window !== "undefined" && typeof Image !== "undefined") {
      const img = new Image();
      img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      img.onload = () => {
        if (cancelled) return;
        // YouTube mengembalikan gambar placeholder 120x90 bila video tidak ditemukan
        if (img.naturalWidth > 0 && img.naturalWidth <= 120) {
          setVideoError(true);
        }
      };
      img.onerror = () => {
        if (!cancelled) setVideoError(true);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Tangkap event kesalahan dari YouTube Player API via window postMessage
  useEffect(() => {
    if (!videoId) return;

    const handleMessage = (event) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        // YouTube onError codes: 2 (invalid param), 5 (HTML5 error), 100 (not found/removed/private), 101/150 (embed forbidden)
        if (
          data &&
          (data.event === "onError" ||
            data.info === 100 ||
            data.info === 101 ||
            data.info === 150)
        ) {
          setVideoError(true);
        }
      } catch {
        // Abaikan pesan selain JSON dari origin lain
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [videoId]);

  const hasValidVideo = Boolean(videoId && !videoError);
  const showVideo = hasValidVideo && mode === "video";

  return (
    <div
      className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-sand-200/80 shadow-sm ${className}`}
      data-testid="koridor-media-container"
    >
      {/* Tampilan Gambar (Alternatif / Fallback atau saat mode foto dipilih) */}
      {!showVideo && (
        <SmartImage
          src={koridor?.hero_image}
          fallbackSrc={koridor?.thumbnail}
          alt={koridor?.formal_name || "Foto Koridor"}
          className="w-full h-full object-cover"
        />
      )}

      {/* Tampilan Video YouTube Autoplay */}
      {showVideo && (
        <>
          {/* Placeholder poster saat iframe sedang menyiapkan stream */}
          {!isLoaded && (
            <SmartImage
              src={koridor?.hero_image}
              fallbackSrc={koridor?.thumbnail}
              alt={koridor?.formal_name || "Memuat video..."}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          <iframe
            ref={(el) => {
              if (el) {
                el.onerror = () => setVideoError(true);
              }
            }}
            src={buildYouTubeEmbedUrl(videoId)}
            title={`Video ${koridor?.formal_name || "Koridor"}`}
            className={`w-full h-full object-cover border-0 transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIsLoaded(true)}
            onError={() => setVideoError(true)}
          />
        </>
      )}

      {/* Tombol beralih Video <-> Foto bila koridor memiliki video */}
      {hasValidVideo && (
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-ink-900/70 backdrop-blur-sm rounded-full p-0.5 text-[0.65rem] text-white">
          <button
            type="button"
            onClick={() => setMode("video")}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 font-medium transition-colors ${
              mode === "video"
                ? "bg-canopy-700 text-white shadow-sm"
                : "text-white/80 hover:text-white"
            }`}
            aria-label="Tampilkan Video"
          >
            <Icon name="play" size={11} />
            <span>Video</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("image")}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1 font-medium transition-colors ${
              mode === "image"
                ? "bg-canopy-700 text-white shadow-sm"
                : "text-white/80 hover:text-white"
            }`}
            aria-label="Tampilkan Foto"
          >
            <Icon name="camera" size={11} />
            <span>Foto</span>
          </button>
        </div>
      )}
    </div>
  );
}
