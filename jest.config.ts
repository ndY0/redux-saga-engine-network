import { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageDirectory: "./coverage",
  collectCoverageFrom: [
    "**/src/**/*.ts",
    "!**/node_modules/**",
    "!**/(types|symbols).ts",
  ],
  coverageReporters: ["text", "lcov"],
  collectCoverage: true,
  testMatch: [
    "**/src/**/?(*.)+(spec).[jt]s?(x)",
    "**/e2e/**/?(*.)+(e2e).[jt]s?(x)",
  ],
  testPathIgnorePatterns: ["/lib/", "/node_modules/"],
};

export default config;
