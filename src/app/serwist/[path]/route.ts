import { spawnSync } from 'node:child_process';
import { createSerwistRoute } from '@serwist/turbopack';

const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ?? crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
  // Heavy media is cached at runtime by defaultCache (image rules), not precached.
  globIgnores: ['public/recipes/**', 'public/foods/**', 'public/exercises/**', '**/*.gif'],
  swSrc: 'src/app/sw.ts',
  useNativeEsbuild: true,
});
