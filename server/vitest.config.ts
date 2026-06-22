import {
    defineConfig,
} from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",

        include: [
            "src/**/*.test.ts",
        ],

        setupFiles: [
            "./src/test/setup.ts",
        ],

        clearMocks: true,
        restoreMocks: true,
        mockReset: true,

        /*
         * Keep backend tests sequential while they share
         * environment variables and database mocks.
         */
        fileParallelism: false,

        coverage: {
            provider: "v8",

            reporter: [
                "text",
                "html",
            ],

            include: [
                "src/**/*.ts",
            ],

            exclude: [
                "src/index.ts",
                "src/**/*.d.ts",
                "src/**/*.test.ts",
                "src/test/**",
            ],
        },
    },
});