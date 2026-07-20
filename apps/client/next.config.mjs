/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Lets Next compile the workspace package's TypeScript sources directly -
  // no separate build step needed for @task-manager/shared-types.
  transpilePackages: ['@task-manager/shared-types'],
}

export default nextConfig
