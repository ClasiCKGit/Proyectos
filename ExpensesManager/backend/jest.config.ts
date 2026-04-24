// backend/jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.(ts|tsx|js)$": "ts-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!(uuid)/)"],
  setupFiles: ["<rootDir>/__tests__/env.ts"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "../coverage",
  coverageReporters: ["text", "lcov"],
  collectCoverageFrom: [
    "**/*.ts",
    "!**/__tests__/**",
    "!**/index.ts",
  ],
};

export default config;
