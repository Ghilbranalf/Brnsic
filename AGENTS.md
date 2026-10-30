# Aturan & Instruksi Operasional Proyek Brnsic

## 1. Komunikasi & Brainstorming Wajib (Prioritas Tertinggi)
- **Jangan Pernah Mengambil Asumsi/Menebak:** Jika ada instruksi, pertanyaan, atau kendala dari pengguna yang ambigu, membingungkan, atau memiliki beberapa opsi/arah implementasi, **Wajib lakukan brainstorming dan diskusi terlebih dahulu dengan pengguna** sebelum mengubah kode atau menyimpulkan sendiri.
- **Tanyakan & Klarifikasi:** Manfaatkan diskusi terarah (sampaikan analisis singkat, opsi yang mungkin, dan tanyakan preferensi pengguna) untuk memastikan solusi 100% tepat sasaran dengan yang diinginkan pengguna.

## 2. Standar Teknis & Kualitas Kode
- **Investigasi Menyeluruh:** Selalu periksa kode sumber, alur data (API/database/native bridge), dan log sebelum memberikan solusi.
- **Modifikasi Presisi (Surgical Edits):** Hanya ubah baris kode yang relevan dengan tugas. Jangan menulis ulang file besar tanpa alasan mendasar.
- **Verifikasi Setelah Perubahan:** Jalankan typecheck (`npx tsc --noEmit`), build Next.js, dan compile Android APK bila menyentuh native/assets.
- **Pengalaman Pengguna (UX) AMOLED & Fluiditas:** Pastikan tema gelap murni (#000000), tanpa lag, dan konsisten di Web maupun Android APK.
