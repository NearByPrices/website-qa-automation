import chalk from "chalk";

export type LogLevel = "debug" | "info" | "warn" | "error";

const CI = process.env["CI"] === "true";

class Logger {
  private prefix: string;

  constructor(prefix = "") {
    this.prefix = prefix ? `[${prefix}] ` : "";
  }

  debug(msg: string): void {
    if (process.env["DEBUG"]) {
      console.debug(chalk.gray(`${this.prefix}DEBUG: ${msg}`));
    }
  }

  info(msg: string): void {
    console.log(chalk.blue(`${this.prefix}${msg}`));
  }

  success(msg: string): void {
    console.log(chalk.green(`${this.prefix}✓ ${msg}`));
  }

  warn(msg: string): void {
    console.warn(chalk.yellow(`${this.prefix}⚠ ${msg}`));
  }

  error(msg: string): void {
    console.error(chalk.red(`${this.prefix}✗ ${msg}`));
  }

  group(msg: string): void {
    if (CI) {
      console.log(`::group::${msg}`);
    } else {
      console.log("\n" + chalk.bold(`▶ ${msg}`));
    }
  }

  groupEnd(): void {
    if (CI) {
      console.log("::endgroup::");
    }
  }
}

export const logger = new Logger();
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}
