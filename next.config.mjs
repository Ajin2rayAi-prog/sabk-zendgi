/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // برای دیپلوی با Docker (اکسپورت سبک)
  reactStrictMode: true,
  experimental: {
    // آپلود ویدیو تا ۱۰۰ مگ از پنل (پیش‌فرض نکست فقط ۱ مگ است)
    serverActions: { bodySizeLimit: "100mb" },
  },
  images: {
    // همهٔ عکس‌ها لوکال و در public/ هستند؛ هاست خارجی مجازی نداریم.
    // اگر بعداً CDN خارجی اضافه شد، اینجا دقیقاً آدرسش را بنویس.
    remotePatterns: [],
  },
};

export default nextConfig;
