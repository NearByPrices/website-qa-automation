import * as dotenv from "dotenv";
dotenv.config();

import { loadSiteConfig, getTargetSite } from "../src/core/config-loader";
import { createLogger } from "../src/utils/logger";

const log = createLogger("ValidateConfig");

function main() {
  const siteKey = getTargetSite();
  log.info(`Validating configuration for site: ${siteKey}`);

  try {
    const config = loadSiteConfig(siteKey);

    log.success(`Site: ${config.name} (${config.key})`);
    log.success(`Base URL: ${config.baseUrl}`);
    log.success(`Environment: ${config.environment}`);
    log.success(`Crawl max pages: ${config.crawl.maxPages}`);
    log.success(`Important pages: ${config.importantPages.map((p) => p.name).join(", ")}`);

    const missingEnvVars: string[] = [];
    if (!process.env["NBP_BASE_URL"]) {
      log.warn("NBP_BASE_URL not set — using default from config: " + config.baseUrl);
    }
    if (!process.env["GOOGLE_SHEETS_ID"]) {
      log.warn("GOOGLE_SHEETS_ID not set — Google Sheets reporting will be disabled");
      missingEnvVars.push("GOOGLE_SHEETS_ID");
    }
    if (!process.env["GOOGLE_SERVICE_ACCOUNT_JSON"]) {
      log.warn("GOOGLE_SERVICE_ACCOUNT_JSON not set — Google Sheets reporting will be disabled");
      missingEnvVars.push("GOOGLE_SERVICE_ACCOUNT_JSON");
    }

    if (missingEnvVars.length > 0) {
      log.warn(`Optional configuration missing: ${missingEnvVars.join(", ")}`);
      log.info("See .env.example and docs/google-sheets-setup.md for setup instructions");
    } else {
      log.success("All configuration variables are set");
    }

    log.success("Configuration validation passed");
  } catch (err) {
    log.error(`Configuration validation failed: ${err}`);
    process.exit(1);
  }
}

main();
