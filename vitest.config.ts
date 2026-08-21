import { defineConfig } from "vitest/config"
import path from "node:path"
export default defineConfig({ resolve: { alias: { "@": path.resolve(import.meta.dirname, "src"), "server-only": path.resolve(import.meta.dirname, "tests/server-only-mock.ts") } }, test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"], coverage: { reporter: ["text","html"], include: ["src/lib/**/*.ts","src/server/services/**/*.ts"] } } })
