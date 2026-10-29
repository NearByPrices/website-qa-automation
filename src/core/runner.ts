import { SiteConfig, AuditRun, TestResult } from "./types";
import { createRunId, buildSummary } from "./result-manager";
import { JsonReporter } from "../reporters/json-reporter";
import { SummaryReporter } from "../reporters/summary-reporter";
import chalk from "chalk";

export interface RunnerOptions {
  auditType: string;
  siteConfig: SiteConfig;
  outputDir?: string;
}

export class AuditRunner {
  private run: AuditRun;
  private outputDir: string;

  constructor(private options: RunnerOptions) {
    this.run = {
      runId: createRunId(),
      website: options.siteConfig.key,
      startedAt: new Date().toISOString(),
      auditType: options.auditType,
      environment: options.siteConfig.environment,
      results: [],
    };
    this.outputDir = options.outputDir ?? "audit-results";
  }

  get runId(): string {
    return this.run.runId;
  }

  addResult(result: TestResult): void {
    this.run.results.push(result);
  }

  addResults(results: TestResult[]): void {
    this.run.results.push(...results);
  }

  async finalize(): Promise<AuditRun> {
    this.run.completedAt = new Date().toISOString();
    this.run.summary = buildSummary(this.run);

    const jsonReporter = new JsonReporter(this.outputDir);
    const reportPath = await jsonReporter.write(this.run);

    const summaryReporter = new SummaryReporter();
    summaryReporter.print(this.run.summary!);

    console.log(chalk.gray(`\nJSON report saved to: ${reportPath}`));

    return this.run;
  }

  getSiteConfig(): SiteConfig {
    return this.options.siteConfig;
  }

  getResults(): TestResult[] {
    return this.run.results;
  }
}
