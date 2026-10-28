import chalk from "chalk";
import { AuditSummary, TestResult } from "../core/types";

export class SummaryReporter {
  print(summary: AuditSummary): void {
    console.log("\n" + chalk.bold("═".repeat(60)));
    console.log(chalk.bold(`  Audit Summary — ${summary.website.toUpperCase()} / ${summary.auditType}`));
    console.log(chalk.bold("═".repeat(60)));
    console.log(`  Run ID     : ${summary.runId}`);
    console.log(`  Started    : ${summary.startedAt}`);
    console.log(`  Completed  : ${summary.completedAt}`);
    console.log(`  Duration   : ${(summary.durationMs / 1000).toFixed(1)}s`);
    console.log("  " + "─".repeat(58));
    console.log(`  Total checks      : ${summary.totalChecks}`);
    console.log(`  ${chalk.green("Passed")}            : ${summary.passed}`);
    console.log(`  ${chalk.red("Failed")}            : ${summary.failed}`);
    console.log(`  ${chalk.yellow("Warnings")}          : ${summary.warnings}`);
    console.log(`  ${chalk.red("Errors")}            : ${summary.errors}`);
    console.log(`  ${chalk.gray("Skipped")}           : ${summary.skipped}`);
    console.log(`  ${chalk.blue("Review Required")}   : ${summary.reviewRequired}`);
    console.log("  " + "─".repeat(58));
    console.log(`  Critical issues   : ${this.colorBySeverityCount(summary.criticalIssues, "CRITICAL")}`);
    console.log(`  High issues       : ${this.colorBySeverityCount(summary.highIssues, "HIGH")}`);
    console.log(`  Medium issues     : ${this.colorBySeverityCount(summary.mediumIssues, "MEDIUM")}`);
    console.log(`  Low issues        : ${this.colorBySeverityCount(summary.lowIssues, "LOW")}`);

    if (summary.topIssues.length > 0) {
      console.log("\n" + chalk.bold("  Top Issues:"));
      summary.topIssues.slice(0, 5).forEach((issue, i) => {
        console.log(`  ${i + 1}. [${this.severityLabel(issue)}] ${issue.testName}`);
        console.log(`     ${chalk.gray(issue.pageUrl)}`);
        console.log(`     ${issue.message}`);
      });
    }

    const passRate =
      summary.totalChecks > 0
        ? ((summary.passed / (summary.totalChecks - summary.skipped)) * 100).toFixed(1)
        : "N/A";
    console.log("\n" + chalk.bold("═".repeat(60)));
    console.log(chalk.bold(`  Pass rate: ${passRate}%`));
    console.log(chalk.bold("═".repeat(60)) + "\n");
  }

  private colorBySeverityCount(count: number, severity: string): string {
    if (count === 0) return chalk.green("0");
    if (severity === "CRITICAL") return chalk.bgRed.white(` ${count} `);
    if (severity === "HIGH") return chalk.red(count.toString());
    if (severity === "MEDIUM") return chalk.yellow(count.toString());
    return chalk.gray(count.toString());
  }

  private severityLabel(issue: TestResult): string {
    const labels: Record<string, string> = {
      CRITICAL: chalk.bgRed.white("CRITICAL"),
      HIGH: chalk.red("HIGH"),
      MEDIUM: chalk.yellow("MEDIUM"),
      LOW: chalk.gray("LOW"),
      INFO: chalk.blue("INFO"),
    };
    return labels[issue.severity] ?? issue.severity;
  }
}
