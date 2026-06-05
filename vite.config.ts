// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Expose NEXT_PUBLIC_* env vars to the client as import.meta.env.*
function nextPublicEnvPlugin() {
  const prefix = "NEXT_PUBLIC_";
  const envVars: Record<string, string> = {};
  for (const key in process.env) {
    if (key.startsWith(prefix)) {
      envVars[`import.meta.env.${key}`] = JSON.stringify(process.env[key]);
    }
  }
  return {
    name: "next-public-env",
    config: () => ({ define: envVars }),
  };
}

export default defineConfig({
  vite: {
    plugins: [nextPublicEnvPlugin()],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
