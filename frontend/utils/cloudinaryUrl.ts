/**
 * Utilitas untuk mengoptimalkan URL gambar Cloudinary saat ditampilkan.
 * 
 * Cloudinary mendukung transformasi gambar langsung lewat URL,
 * sehingga gambar yang sudah ada di Cloudinary bisa di-serve
 * dalam ukuran yang lebih kecil tanpa perlu re-upload.
 * 
 * Contoh URL Cloudinary asli:
 *   https://res.cloudinary.com/CLOUD/image/upload/v123/folder/file.jpg
 * 
 * Setelah transformasi:
 *   https://res.cloudinary.com/CLOUD/image/upload/f_auto,q_auto,w_400/v123/folder/file.jpg
 */

type ImagePreset = 'thumbnail' | 'card' | 'detail' | 'avatar' | 'full';

const PRESETS: Record<ImagePreset, string> = {
  // Thumbnail kecil — untuk daftar chat, keranjang, notifikasi
  thumbnail: 'f_auto,q_auto:low,w_100,h_100,c_fill',
  // Avatar — untuk foto profil
  avatar: 'f_auto,q_auto,w_200,h_200,c_fill',
  // Card — untuk kartu produk di homepage/search
  card: 'f_auto,q_auto,w_400,c_limit',
  // Detail — untuk halaman detail produk (gambar utama)
  detail: 'f_auto,q_auto:good,w_800,c_limit',
  // Full — kualitas tinggi tapi tetap dioptimasi formatnya
  full: 'f_auto,q_auto:good,w_1200,c_limit',
};

/**
 * Mengoptimalkan URL gambar Cloudinary dengan transformasi on-the-fly.
 * 
 * @param url - URL gambar asli dari Cloudinary
 * @param preset - Preset ukuran: 'thumbnail' | 'card' | 'detail' | 'avatar' | 'full'
 * @returns URL gambar yang sudah dioptimalkan, atau URL asli jika bukan Cloudinary
 * 
 * @example
 * // Gambar produk di homepage (kartu kecil)
 * optimizeCloudinaryUrl(product.images[0], 'card')
 * 
 * // Gambar detail produk
 * optimizeCloudinaryUrl(product.images[0], 'detail')
 * 
 * // Foto profil
 * optimizeCloudinaryUrl(user.profile_picture, 'avatar')
 */
export function optimizeCloudinaryUrl(
  url: string | undefined | null,
  preset: ImagePreset = 'card'
): string {
  if (!url) return '';

  // Hanya proses URL Cloudinary
  if (!url.includes('res.cloudinary.com')) return url;

  // Pola: .../image/upload/v12345/folder/file.jpg
  //        → .../image/upload/TRANSFORMASI/v12345/folder/file.jpg
  const transformation = PRESETS[preset] || PRESETS.card;

  // Sisipkan transformasi setelah "/upload/"
  return url.replace(
    /\/upload\//,
    `/upload/${transformation}/`
  );
}
