import { withSerwist } from '@serwist/turbopack';

export default withSerwist({
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'img.spoonacular.com' },
    ],
  },
});
