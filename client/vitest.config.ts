import {
    defineConfig,
} from "vitest/config";

import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [
        react(),
    ],

    test: {
        environment: "jsdom",

        include: [
            "src/**/*.test.ts",
            "src/**/*.test.tsx",
        ],

        setupFiles: [
            "./src/test/setup.ts",
        ],

        clearMocks: true,
        restoreMocks: true,

        coverage: {
            provider: "v8",

            reporter: [
                "text",
                "html",
            ],

            include: [
                "src/**/*.{ts,tsx}",
            ],

            exclude: [
                "src/**/*.d.ts",
                "src/**/*.test.ts",
                "src/**/*.test.tsx",
                "src/test/**",
                "src/main.tsx",
            ],
        },
    },
});