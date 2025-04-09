import nextPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
  },
  reactStrictMode: true,
};

export default nextPWA({
  dest: 'public', // Output directory for service worker and manifest
  register: true, // Automatically register the service worker
  skipWaiting: true, // Activate new service workers immediately
})(nextConfig);
