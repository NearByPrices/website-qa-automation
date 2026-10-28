import * as fs from "fs";
import * as path from "path";
import { AuditRun } from "../core/types";

export class JsonReporter {
  constructor(private outputDir: string) {}

  async write(run: AuditRun): Promise<string> {
    const dir = path.resolve(this.outputDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${run.website}-${run.auditType}-${timestamp}.json`;
    const filePath = path.join(dir, filename);

    fs.writeFileSync(filePath, JSON.stringify(run, null, 2), "utf-8");

    const latestPath = path.join(dir, `${run.website}-${run.auditType}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(run, null, 2), "utf-8");

    return filePath;
  }
}
