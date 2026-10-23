import { defineConfig } from "@neon/config/v1";

// PostgreSQL already exists on every Neon branch.
// Keep existing branch settings and unrelated services unchanged.
export default defineConfig({
  branch: () => ({}),
});
