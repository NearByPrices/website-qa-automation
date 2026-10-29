import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { SiteConfig } from "./types";

dotenv.config();

const CONFIG_DIR = path.resolve(__dirname, "../../config/sites");

export function loadSiteConfig(siteKey: string): SiteConfig {
  const configPath = path.join(CONFIG_DIR, `${siteKey}.config.js`);
  const tsConfigPath = path.join(CONFIG_DIR, `${siteKey}.config.ts`);

  let configFilePath: string;

  if (fs.existsSync(configPath)) {
    configFilePath = configPath;
  } else if (fs.existsSync(tsConfigPath)) {
    configFilePath = tsConfigPath;
  } else {
    throw new Error(
      `Site configuration not found for key "${siteKey}". ` +
        `Expected file at: ${configPath} or ${tsConfigPath}`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(configFilePath);
  const config: SiteConfig = mod.default ?? mod;

  validateSiteConfig(config);
  applyEnvOverrides(config, siteKey);

  return config;
}

function validateSiteConfig(config: SiteConfig): void {
  const required: (keyof SiteConfig)[] = ["key", "name", "baseUrl", "crawl", "importantPages"];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Site config missing required field: ${field}`);
    }
  }

  if (!config.baseUrl.startsWith("http")) {
    throw new Error(
      `Site config baseUrl must be an absolute URL. Got: "${config.baseUrl}". ` +
        `Set the appropriate environment variable (e.g. NBP_BASE_URL).`
    );
  }
}

function applyEnvOverrides(config: SiteConfig, siteKey: string): void {
  const urlEnvKey = `${siteKey.toUpperCase()}_BASE_URL`;
  const envUrl = process.env[urlEnvKey];
  if (envUrl) {
    config.baseUrl = envUrl.replace(/\/$/, "");
  }

  const maxPagesEnv = process.env["AUDIT_MAX_PAGES"];
  if (maxPagesEnv) {
    config.crawl.maxPages = parseInt(maxPagesEnv, 10);
  }

  const concurrencyEnv = process.env["AUDIT_CONCURRENCY"];
  if (concurrencyEnv) {
    config.crawl.concurrency = parseInt(concurrencyEnv, 10);
  }

  const timeoutEnv = process.env["AUDIT_TIMEOUT_MS"];
  if (timeoutEnv) {
    config.crawl.timeoutMs = parseInt(timeoutEnv, 10);
  }
}

export function getTargetSite(): string {
  return process.env["TARGET_SITE"] ?? "nbp";
}

export function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}
