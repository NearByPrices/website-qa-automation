import * as dotenv from "dotenv";
dotenv.config();

import { loadSiteConfig, getTargetSite } from "../src/core/config-loader";
import { AuditRunner } from "../src/core/runner";

import { SeoAuditor } from "../src/audits/seo/seo-auditor";
import { MarketingAuditor } from "../src/audits/marketing/marketing-auditor";
import { SheetsReporter } from "../src/reporters/sheets-reporter";
import { createLogger } from "../src/utils/logger";

const log = createLogger("RunAudit");

async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find((a) => a.startsWith("--type="))?.split("=")[1] ?? "smoke";
  const siteArg = args.find((a) => a.startsWith("--site="))?.split("=")[1] ?? getTargetSite();

  log.group(`Starting audit: type=${typeArg}, site=${siteArg}`);

  let siteConfig;
  try {
    siteConfig = loadSiteConfig(siteArg);
  } catch (err) {
    log.error(`Failed to load config: ${err}`);
    process.exit(1);
  }

  const runner = new AuditRunner({
    auditType: typeArg,
    siteConfig,
    outputDir: "audit-results",
  });

  const baseUrl = siteConfig.baseUrl;
  log.info(`Target: ${baseUrl}`);

  if (typeArg === "seo" || typeArg === "full") {
    await runSeoAudit(runner, siteConfig, baseUrl);
  }

  if (typeArg === "marketing" || typeArg === "full") {
    await runMarketingAudit(runner, siteConfig, baseUrl);
  }

  if (typeArg === "smoke" || typeArg === "full") {
    await runSeoAudit(runner, siteConfig, baseUrl, true);
    await runMarketingAudit(runner, siteConfig, baseUrl, true);
  }

  const run = await runner.finalize();

  const sheetsReporter = new SheetsReporter();
  const sheetsReady = await sheetsReporter.init();
  if (sheetsReady) {
    await sheetsReporter.writeResults(run);
    await sheetsReporter.updateDashboard(run.summary!);
  } else {
    log.warn("Google Sheets not configured — results saved locally only.");
  }

  log.groupEnd();

  const hasCritical = run.summary?.criticalIssues ?? 0;
  const hasFailed = run.summary?.failed ?? 0;
  if (hasCritical > 0 || hasFailed > 0) {
    process.exit(1);
  }
}

async function runSeoAudit(
  runner: AuditRunner,
  siteConfig: ReturnType<typeof loadSiteConfig>,
  baseUrl: string,
  smokeOnly = false
) {
  const seoAuditor = new SeoAuditor(siteConfig, runner.runId);
  const sitemapResults = await seoAuditor.auditSitemap(baseUrl);
  runner.addResults(sitemapResults);

  const pagesToAudit = smokeOnly
    ? siteConfig.importantPages.filter((p) => p.priority === "critical").slice(0, 3)
    : siteConfig.importantPages;

  for (const page of pagesToAudit) {
    const url = `${baseUrl}${page.path}`;
    const pageResult = await seoAuditor.auditPage(url);
    runner.addResults(pageResult.results);
  }
}

async function runMarketingAudit(
  runner: AuditRunner,
  siteConfig: ReturnType<typeof loadSiteConfig>,
  baseUrl: string,
  smokeOnly = false
) {
  const marketingAuditor = new MarketingAuditor(siteConfig, runner.runId);
  const homepageResults = await marketingAuditor.auditHomepage(baseUrl);
  runner.addResults(homepageResults);

  if (!smokeOnly) {
    const productUrl = `${baseUrl}/products`;
    const productResults = await marketingAuditor.auditProductPage(productUrl);
    runner.addResults(productResults);
  }
}

main().catch((err) => {
  console.error("Audit runner crashed:", err);
  process.exit(1);
});
