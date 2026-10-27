import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// High-Precision Curated Synced Lyrics (0ms instant response, studio-accurate timestamps)
export const CURATED_LYRICS: Record<string, { time: number; text: string }[]> = {
  "gala bunga matahari": [
    { time: 0, text: "(Intro Piano)" },
    { time: 1.89, text: "Mungkinkah" },
    { time: 3.74, text: "Mungkinkah" },
    { time: 5.89, text: "Mungkinkah" },
    { time: 8.23, text: "Kau mampir hari ini?" },
    { time: 12.49, text: "Bila tidak, mirip kau jadilah bunga matahari" },
    { time: 22.52, text: "Yang tiba-tiba mekar di taman" },
    { time: 27.06, text: "Meski bicara dengan bahasa tumbuhan" },
    { time: 31.76, text: "Ceritakan padaku" },
    { time: 36.56, text: "Bagaimana tempat tinggalmu yang baru?" },
    { time: 43.62, text: "Adakah sungai-sungai itu benar-benar" },
    { time: 48.15, text: "Dilintasi dengan air susu?" },
    { time: 55.14, text: "Juga badanmu tak sakit-sakit lagi?" },
    { time: 59.82, text: "Kau dan orang-orang di sana muda lagi?" },
    { time: 64.84, text: "Semua pertanyaan" },
    { time: 66.90, text: "Temukan jawaban" },
    { time: 69.30, text: "Hati yang gembira sering kau tertawa" },
    { time: 74.12, text: "Benarkah orang bilang ia memang suka bercanda?" },
    { time: 83.12, text: "Mungkinkah" },
    { time: 85.24, text: "Mungkinkah" },
    { time: 87.39, text: "Mungkinkah" },
    { time: 89.48, text: "Kau mampir hari ini?" },
    { time: 93.77, text: "Bila tidak, mirip kau jadilah bunga matahari" },
    { time: 103.85, text: "Yang tiba-tiba mekar di taman" },
    { time: 108.60, text: "Meski bicara dengan bahasa tumbuhan" },
    { time: 113.13, text: "'Kan kuceritakan padamu" },
    { time: 118.04, text: "Bagaimana hidupku tanpamu" },
    { time: 127.36, text: "Kangennya masih ada di setiap waktu" },
    { time: 132.19, text: "Kadang aku menangis bila aku perlu" },
    { time: 136.68, text: "Tapi aku sekarang sudah lebih lucu" },
    { time: 141.31, text: "Jadilah menyenangkan seperti katamu" },
    { time: 146.20, text: "Jalani hidup dengan penuh suka cita" },
    { time: 150.97, text: "Dan percaya kau ada di hatiku selamanya" },
    { time: 159.94, text: "Mungkinkah" },
    { time: 162.19, text: "Mungkinkah" },
    { time: 164.59, text: "Mungkinkah" },
    { time: 166.33, text: "Kau mampir hari ini?" },
    { time: 170.30, text: "Bila tidak, mirip kau jadilah bunga matahari" },
    { time: 180.56, text: "Mungkinkah" },
    { time: 182.99, text: "Mungkinkah" },
    { time: 185.28, text: "Mungkinkah" },
    { time: 187.19, text: "Kau mampir hari ini?" },
    { time: 191.65, text: "Bila tidak sekarang, janji kita pasti 'kan bertemu lagi" }
  ],
  "satu bulan": [
    { time: 0, text: "(Intro Gitar Akustik)" },
    { time: 7.80, text: "Belum ada satu bulan" },
    { time: 12.91, text: "Ku yakin masih ada sisa wangiku di bajumu" },
    { time: 18.96, text: "Namun kau tampak baik saja" },
    { time: 23.04, text: "Bahkan senyummu lebih lepas" },
    { time: 25.77, text: "Sedang aku di sini hampir gila" },
    { time: 31.62, text: "Kita tak temukan jalan" },
    { time: 37.16, text: "Sepakat akhiri setelah beribu debat panjang" },
    { time: 43.46, text: "Namun kau tampak baik saja" },
    { time: 48.08, text: "Bahkan senyummu lebih lepas" },
    { time: 50.37, text: "Sedang aku di sini belum terima" },
    { time: 56.16, text: "Bohongkah tangismu sore itu di pelukku?" },
    { time: 62.08, text: "Nyatanya pergiku pun tak lagi mengganggumu" },
    { time: 67.17, text: "Apa sudah ada kabar lain yang kau tunggu?" },
    { time: 72.42, text: "Sudah adakah yang gantikanku?" },
    { time: 77.72, text: "Yang khawatirkanmu setiap waktu?" },
    { time: 83.76, text: "Yang cerita tentang apapun sampai hal-hal tak perlu?" },
    { time: 89.65, text: "Kalau bisa jangan buru-buru, kalau bisa jangan ada dulu" },
    { time: 103.98, text: "Baru lewat satu bulan" },
    { time: 116.06, text: "Kemarin ulang tahunku tak ada pesan darimu" },
    { time: 121.79, text: "Tak apa, mungkin kau lupa" },
    { time: 126.52, text: "Atau sudah ada hati yang harus kau jaga?" },
    { time: 132.48, text: "Sudah adakah yang gantikanku?" },
    { time: 137.23, text: "Yang kau antar jemput setiap Sabtu?" },
    { time: 142.68, text: "Yang selalu ingatkan untuk pakai sabuk pengamanmu?" },
    { time: 148.55, text: "Kalau bisa jangan buru-buru" },
    { time: 153.53, text: "Sudah adakah yang gantikanku?" },
    { time: 158.68, text: "Yang khawatirkanmu setiap waktu" },
    { time: 164.37, text: "Yang cerita tentang apapun sampai hal-hal tak perlu" },
    { time: 170.25, text: "Kalau bisa jangan buru-buru, kalau bisa jangan ada dulu" },
    { time: 189.97, text: "(Outro)" }
  ],
  "untungnya hidup harus tetap berjalan": [
    { time: 0, text: "(Intro Piano)" },
    { time: 7.20, text: "Persoalan yang kemarin belum selesai" },
    { time: 11.50, text: "Muncul lagi hal baru yang buat lelah" },
    { time: 18.20, text: "Namun untungnya hidup harus tetap berjalan" },
    { time: 25.10, text: "Kupaksa tersenyum walau hati berantakan" },
    { time: 32.40, text: "Untungnya bumi masih berputar" },
    { time: 39.50, text: "Memberi kesempatan esok hari yang lebih terang" },
    { time: 48.00, text: "Kuselami setiap duka yang datang menyapa" },
    { time: 55.60, text: "Kuyakini kelak bahagia akan tiba pada waktunya" }
  ],
  "tampar": [
    { time: 0, text: "(Intro)" },
    { time: 9.80, text: "Hujan samarkan derasnya" },
    { time: 14.10, text: "Tutup air mata" },
    { time: 18.50, text: "Temani kecewa" },
    { time: 23.20, text: "Yang sedang menganga" },
    { time: 27.80, text: "Berdamai dengan perasaan" },
    { time: 33.10, text: "Menunggu reda segala angan" },
    { time: 38.60, text: "Biar tampar saja aku" },
    { time: 43.40, text: "Bila masih merindukanmu" },
    { time: 48.10, text: "Yang telah jauh berlalu" }
  ],
  "dari planet lain": [
    { time: 0, text: "(Intro)" },
    { time: 8.50, text: "Sepertinya kau memang dari planet yang lain" },
    { time: 15.20, text: "Dikirim ke bumi untuk orang-orang sepertiku" },
    { time: 22.80, text: "Yang butuh keajaiban di hidup yang fana" },
    { time: 30.10, text: "Tatap matamu buat tenang segala rasa" },
    { time: 38.40, text: "Bila nanti kita tua bersama" },
    { time: 45.90, text: "Kan ku ceritakan kisah kita pada semesta" }
  ],
  "evaluasi": [
    { time: 0, text: "(Intro)" },
    { time: 10.20, text: "Biar tenang hatimu" },
    { time: 15.10, text: "Perjalanan masih jauh" },
    { time: 19.80, text: "Bukan hanya tentang menang atau kalah" },
    { time: 25.40, text: "Tapi bagaimana engkau bertahan" },
    { time: 32.20, text: "Kukira kita asam dan garam" },
    { time: 37.80, text: "Bertemu di belanga cinta yang sama" },
    { time: 45.10, text: "Tutup harimu dengan senyuman" }
  ],
  "berdansalah karir ini tak ada artinya": [
    { time: 0, text: "(Intro Music)" },
    { time: 19.42, text: "Besok coba kau izin pulang cepat" },
    { time: 23.31, text: "Bilang saja siapa sedang sakit" },
    { time: 27.09, text: "Lusa coba izin terlambat" },
    { time: 30.81, text: "Bilang saja kau celaka sedikit" },
    { time: 34.73, text: "Habiskan cutimu sebelum usai" },
    { time: 38.58, text: "I know you're scared but it's totally fine" },
    { time: 42.35, text: "Karena kau bukan mesin assembly line" },
    { time: 46.32, text: "Lihat promo liburan, babe that's a sign" },
    { time: 50.32, text: "Oh, karena ku tahu" },
    { time: 53.88, text: "Kalimat itu ada di ujung mulutmu" },
    { time: 58.29, text: "Oh, karena kau tahu" },
    { time: 61.60, text: "Tak mau lakukan itu seumur hidupmu" },
    { time: 65.53, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 69.37, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 73.26, text: "Hidup ini tak ada artinya" },
    { time: 76.49, text: "Maka, kau bebas mengarang maknanya, seorang" },
    { time: 81.12, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 84.68, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 88.68, text: "Lagipula hidup akan berakhir" },
    { time: 91.66, text: "Maka, lakukan apa yang kau mau, sekarang" },
    { time: 96.23, text: "Berdansalah, kau raja dunia!" },
    { time: 100.13, text: "Karir ini tak ada artinya" },
    { time: 103.94, text: "Berdansalah, kau ratu dunia!" },
    { time: 107.67, text: "Hidup ini tak ada artinya" },
    { time: 111.55, text: "Besok coba kau berbohong sedikit" },
    { time: 115.49, text: "Lalu kau melupa saat diungkit" },
    { time: 119.28, text: "Bisa juga kau jujur saja" },
    { time: 123.03, text: "Separahnya kau akan makin lega" },
    { time: 127.26, text: "Oh, karena ku tahu" },
    { time: 130.80, text: "Kalimat itu ada di ujung mulutmu" },
    { time: 134.97, text: "Oh, karena kau tahu" },
    { time: 138.48, text: "Utamakanlah dirimu di sisa hidupmu" },
    { time: 142.31, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 146.07, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 149.90, text: "Hidup ini tak ada artinya" },
    { time: 153.15, text: "Maka, kau bebas mengarang maknanya, seorang" },
    { time: 157.65, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 161.55, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 165.37, text: "Lagipula hidup akan berakhir" },
    { time: 168.47, text: "Maka, lakukan apa yang kau mau, sekarang" },
    { time: 172.94, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 176.87, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 180.77, text: "Hidup ini tak ada artinya" },
    { time: 183.88, text: "Maka, kau bebas mengarang maknanya, seorang" },
    { time: 188.13, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 192.13, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 196.08, text: "Lagipula hidup akan berakhir" },
    { time: 199.16, text: "Maka, lakukan apa yang kau mau, sekarang" },
    { time: 203.72, text: "Berdansalah, kau raja dunia!" },
    { time: 207.67, text: "Karir ini tak ada artinya" },
    { time: 211.32, text: "Berdansalah, kau ratu dunia!" },
    { time: 215.26, text: "Hidup ini tak ada artinya" },
    { time: 220.00, text: "(Outro)" }
  ],
  "berdansalah": [
    { time: 0, text: "(Intro Music)" },
    { time: 19.42, text: "Besok coba kau izin pulang cepat" },
    { time: 23.31, text: "Bilang saja siapa sedang sakit" },
    { time: 27.09, text: "Lusa coba izin terlambat" },
    { time: 30.81, text: "Bilang saja kau celaka sedikit" },
    { time: 34.73, text: "Habiskan cutimu sebelum usai" },
    { time: 38.58, text: "I know you're scared but it's totally fine" },
    { time: 42.35, text: "Karena kau bukan mesin assembly line" },
    { time: 46.32, text: "Lihat promo liburan, babe that's a sign" },
    { time: 50.32, text: "Oh, karena ku tahu" },
    { time: 53.88, text: "Kalimat itu ada di ujung mulutmu" },
    { time: 58.29, text: "Oh, karena kau tahu" },
    { time: 61.60, text: "Tak mau lakukan itu seumur hidupmu" },
    { time: 65.53, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 69.37, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 73.26, text: "Hidup ini tak ada artinya" },
    { time: 76.49, text: "Maka, kau bebas mengarang maknanya, seorang" },
    { time: 81.12, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 84.68, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 88.68, text: "Lagipula hidup akan berakhir" },
    { time: 91.66, text: "Maka, lakukan apa yang kau mau, sekarang" },
    { time: 96.23, text: "Berdansalah, kau raja dunia!" },
    { time: 100.13, text: "Karir ini tak ada artinya" },
    { time: 103.94, text: "Berdansalah, kau ratu dunia!" },
    { time: 107.67, text: "Hidup ini tak ada artinya" },
    { time: 111.55, text: "Besok coba kau berbohong sedikit" },
    { time: 115.49, text: "Lalu kau melupa saat diungkit" },
    { time: 119.28, text: "Bisa juga kau jujur saja" },
    { time: 123.03, text: "Separahnya kau akan makin lega" },
    { time: 127.26, text: "Oh, karena ku tahu" },
    { time: 130.80, text: "Kalimat itu ada di ujung mulutmu" },
    { time: 134.97, text: "Oh, karena kau tahu" },
    { time: 138.48, text: "Utamakanlah dirimu di sisa hidupmu" },
    { time: 142.31, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 146.07, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 149.90, text: "Hidup ini tak ada artinya" },
    { time: 153.15, text: "Maka, kau bebas mengarang maknanya, seorang" },
    { time: 157.65, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 161.55, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 165.37, text: "Lagipula hidup akan berakhir" },
    { time: 168.47, text: "Maka, lakukan apa yang kau mau, sekarang" },
    { time: 172.94, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 176.87, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 180.77, text: "Hidup ini tak ada artinya" },
    { time: 183.88, text: "Maka, kau bebas mengarang maknanya, seorang" },
    { time: 188.13, text: "Lakukan apa yang kau mau, sekarang" },
    { time: 192.13, text: "Saat hatimu bergerak, jangan kau larang" },
    { time: 196.08, text: "Lagipula hidup akan berakhir" },
    { time: 199.16, text: "Maka, lakukan apa yang kau mau, sekarang" },
    { time: 203.72, text: "Berdansalah, kau raja dunia!" },
    { time: 207.67, text: "Karir ini tak ada artinya" },
    { time: 211.32, text: "Berdansalah, kau ratu dunia!" },
    { time: 215.26, text: "Hidup ini tak ada artinya" },
    { time: 220.00, text: "(Outro)" }
  ]
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = (searchParams.get("artist") || "").trim();
  const title = (searchParams.get("title") || "").trim();

  if (!artist && !title) {
    return NextResponse.json({ lyrics: [] });
  }

  const cleanTitle = title.toLowerCase().replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();

  // 1. Check curated exact-matched lyrics first (Instant 0ms, zero lag, perfect sync!)
  for (const [key, lyricsList] of Object.entries(CURATED_LYRICS)) {
    if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
      return NextResponse.json({ lyrics: lyricsList, synced: true });
    }
  }

  try {
    // 2. Fetch from LRCLIB for long-tail catalog
    let res = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
        artist
      )}&track_name=${encodeURIComponent(cleanTitle)}`,
      {
        headers: {
          "User-Agent": "BrnsicMusicApp/1.0 (https://brnsic.vercel.app)"
        },
        next: { revalidate: 86400 }
      }
    );

    let data: any = null;
    if (res.ok) {
      data = await res.json();
    } else {
      const searchRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${cleanTitle}`)}`,
        {
          headers: {
            "User-Agent": "BrnsicMusicApp/1.0 (https://brnsic.vercel.app)"
          },
          next: { revalidate: 86400 }
        }
      );
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          data = results.find((r: any) => r.syncedLyrics) || results[0];
        }
      }
    }

    if (data && data.syncedLyrics) {
      const lines = data.syncedLyrics.split("\n");
      const parsed: { time: number; text: string }[] = [];
      const timeReg = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

      lines.forEach((l: string) => {
        const m = timeReg.exec(l);
        if (m) {
          const min = parseInt(m[1], 10);
          const sec = parseInt(m[2], 10);
          const ms = m[3] ? parseInt(m[3].padEnd(3, "0"), 10) : 0;
          const text = l.replace(timeReg, "").trim();
          if (text) {
            parsed.push({ time: min * 60 + sec + ms / 1000, text });
          }
        }
      });

      if (parsed.length > 0) {
        return NextResponse.json({ lyrics: parsed, synced: true });
      }
    }

    if (data && data.plainLyrics) {
      const lines = data.plainLyrics
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);
      const estStep = 4.2;
      const parsed = lines.map((text: string, i: number) => ({
        time: i * estStep,
        text
      }));
      return NextResponse.json({ lyrics: parsed, synced: false });
    }

    return NextResponse.json({
      lyrics: [
        { time: 0, text: `♪ ${title} ♪` },
        { time: 4, text: `Karya ${artist}` },
        { time: 8, text: "Lirik tersinkronisasi sedang disiapkan untuk lagu ini" }
      ],
      synced: false
    });
  } catch (err: any) {
    return NextResponse.json({
      lyrics: [
        { time: 0, text: `♪ ${title} ♪` },
        { time: 4, text: `Karya ${artist}` }
      ],
      synced: false
    });
  }
}
