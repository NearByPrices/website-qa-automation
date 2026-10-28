export interface EnvironmentConfig {
  name: string;
  isCI: boolean;
  outputDir: string;
  screenshotsDir: string;
  artifactsRetentionDays: number;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const isCI = process.env["CI"] === "true";
  return {
    name: isCI ? "ci" : "local",
    isCI,
    outputDir: process.env["AUDIT_OUTPUT_DIR"] ?? "audit-results",
    screenshotsDir: process.env["SCREENSHOTS_DIR"] ?? "test-results/screenshots",
    artifactsRetentionDays: isCI ? 30 : 7,
  };
}
