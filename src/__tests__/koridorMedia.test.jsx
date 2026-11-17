import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import KoridorMedia from "../components/koridor/KoridorMedia";
import {
  getYouTubeVideoId,
  getKoridorVideoUrl,
  buildYouTubeEmbedUrl,
  KORIDOR_VIDEO_MAP,
} from "../lib/koridorVideo";

afterEach(() => {
  cleanup();
});

describe("koridorVideo helper", () => {
  it("getYouTubeVideoId mengenali berbagai format link YouTube", () => {
    expect(getYouTubeVideoId("https://youtu.be/IWQeqMmaO-Q")).toBe("IWQeqMmaO-Q");
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=rrbi25AsoXA")).toBe("rrbi25AsoXA");
    expect(getYouTubeVideoId("https://www.youtube.com/embed/pubQrc7iaLE")).toBe("pubQrc7iaLE");
    expect(getYouTubeVideoId("mhafGKnRSBQ")).toBe("mhafGKnRSBQ");
    expect(getYouTubeVideoId("")).toBeNull();
    expect(getYouTubeVideoId(null)).toBeNull();
    expect(getYouTubeVideoId("not-a-valid-url")).toBeNull();
  });

  it("getKoridorVideoUrl memetakan video sesuai koridor yang tersedia", () => {
    // Koridor dengan video yang disediakan
    expect(getKoridorVideoUrl({ id: 2, formal_name: "Koridor 2: Kalilo" })).toBe(KORIDOR_VIDEO_MAP[2]);
    expect(getKoridorVideoUrl({ id: 4, formal_name: "Koridor 4: Blambangan" })).toBe(KORIDOR_VIDEO_MAP[4]);
    expect(getKoridorVideoUrl({ id: 5, formal_name: "Koridor 5: Pecinan" })).toBe(KORIDOR_VIDEO_MAP[5]);
    expect(getKoridorVideoUrl({ id: 6, formal_name: "Koridor 6: Marina Boom" })).toBe(KORIDOR_VIDEO_MAP[6]);
    expect(getKoridorVideoUrl({ id: 7, formal_name: "Koridor Pasar Induk" })).toBe(KORIDOR_VIDEO_MAP[7]);

    // Koridor tanpa video (fallback ke null)
    expect(getKoridorVideoUrl({ id: 1, formal_name: "Koridor 1: Sritanjung" })).toBeNull();
    expect(getKoridorVideoUrl({ id: 3, formal_name: "Koridor 3: Perliman" })).toBeNull();

    // Properti khusus koridor.video_url diprioritaskan
    expect(getKoridorVideoUrl({ id: 1, video_url: "https://youtu.be/custom12345" })).toBe("https://youtu.be/custom12345");
  });

  it("buildYouTubeEmbedUrl menghasilkan parameter autoplay dan mute untuk browser modern", () => {
    const url = buildYouTubeEmbedUrl("IWQeqMmaO-Q");
    expect(url).toContain("https://www.youtube.com/embed/IWQeqMmaO-Q");
    expect(url).toContain("autoplay=1");
    expect(url).toContain("mute=1");
    expect(url).toContain("loop=1");
    expect(url).toContain("playlist=IWQeqMmaO-Q");
    expect(url).toContain("playsinline=1");
  });
});

describe("KoridorMedia component", () => {
  const koridorDenganVideo = {
    id: 4,
    formal_name: "Koridor 4: Blambangan",
    hero_image: "/images/hero-blambangan.png",
    thumbnail: "/images/thumb-blambangan.png",
    video_url: "https://youtu.be/mhafGKnRSBQ",
  };

  const koridorTanpaVideo = {
    id: 1,
    formal_name: "Koridor 1: Sritanjung",
    hero_image: "/images/hero-sritanjung.png",
    thumbnail: "/images/thumb-sritanjung.png",
    video_url: null,
  };

  it("menampilkan video iframe autoplay jika koridor memiliki video", () => {
    render(<KoridorMedia koridor={koridorDenganVideo} />);

    const iframe = screen.getByTitle("Video Koridor 4: Blambangan");
    expect(iframe).toBeTruthy();
    expect(iframe.tagName.toLowerCase()).toBe("iframe");
    expect(iframe.src).toContain("https://www.youtube.com/embed/mhafGKnRSBQ");
    expect(iframe.src).toContain("autoplay=1");
    expect(iframe.src).toContain("mute=1");

    // Tombol beralih Video / Foto tersedia
    expect(screen.getByRole("button", { name: "Tampilkan Video" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tampilkan Foto" })).toBeTruthy();
  });

  it("dapat beralih ke mode foto saat pengguna menekan tombol Foto", () => {
    render(<KoridorMedia koridor={koridorDenganVideo} />);

    const btnFoto = screen.getByRole("button", { name: "Tampilkan Foto" });
    fireEvent.click(btnFoto);

    // Mode foto aktif: gambar hero_image tampil
    const img = screen.getByAltText("Koridor 4: Blambangan");
    expect(img).toBeTruthy();
    expect(img.tagName.toLowerCase()).toBe("img");
  });

  it("menampilkan gambar alternatif (hero_image) jika video tidak ditemukan / koridor tanpa video", () => {
    render(<KoridorMedia koridor={koridorTanpaVideo} />);

    // Tidak ada iframe
    expect(screen.queryByTitle(/Video/)).toBeNull();
    // Tidak ada tombol toggle karena memang tidak ada video
    expect(screen.queryByRole("button", { name: "Tampilkan Foto" })).toBeNull();

    // Gambar alternatif tampil
    const img = screen.getByAltText("Koridor 1: Sritanjung");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("/images/hero-sritanjung.png");
  });

  it("beralih ke gambar alternatif bila terjadi error pada video via message event", async () => {
    render(<KoridorMedia koridor={koridorDenganVideo} />);

    const iframe = screen.getByTitle("Video Koridor 4: Blambangan");
    expect(iframe).toBeTruthy();

    // Simulasikan event error YouTube Player API (error code 100: video not found)
    fireEvent(
      window,
      new MessageEvent("message", {
        data: JSON.stringify({ event: "onError", info: 100 }),
      })
    );

    // Setelah error, iframe dicopot dan digantikan gambar alternatif
    await waitFor(() => {
      expect(screen.queryByTitle(/Video/)).toBeNull();
    });
    const img = screen.getByAltText("Koridor 4: Blambangan");
    expect(img).toBeTruthy();
  });
});
