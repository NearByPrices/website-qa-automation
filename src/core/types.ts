export type TestStatus = "PASS" | "FAIL" | "WARNING" | "SKIPPED" | "ERROR" | "REVIEW_REQUIRED";
export type TestSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type AuditCategory =
  | "FUNCTIONAL"
  | "SEO"
  | "MARKETING"
  | "PERFORMANCE"
  | "ACCESSIBILITY"
  | "RESPONSIVE"
  | "LINKS"
  | "SECURITY"
  | "CRAWL";

export interface TestResult {
  runId: string;
  website: string;
  category: AuditCategory;
  testId: string;
  testName: string;
  pageUrl: string;
  status: TestStatus;
  severity: TestSeverity;
  expected: string;
  actual: string;
  message: string;
  recommendation: string;
  evidencePath?: string;
  durationMs: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AuditRun {
  runId: string;
  website: string;
  startedAt: string;
  completedAt?: string;
  auditType: string;
  environment: string;
  results: TestResult[];
  summary?: AuditSummary;
}

export interface AuditSummary {
  runId: string;
  website: string;
  auditType: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  errors: number;
  skipped: number;
  reviewRequired: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  topIssues: TestResult[];
  evidencePaths: string[];
}

export interface SiteConfig {
  key: string;
  name: string;
  baseUrl: string;
  environment: "production" | "staging" | "development";
  crawl: CrawlConfig;
  seo: SeoConfig;
  marketing: MarketingConfig;
  performance: PerformanceConfig;
  importantPages: ImportantPage[];
  excludePatterns: string[];
  headers?: Record<string, string>;
}

export interface CrawlConfig {
  maxPages: number;
  maxDepth: number;
  concurrency: number;
  timeoutMs: number;
  delayBetweenRequestsMs: number;
  respectRobotsTxt: boolean;
  followSitemaps: boolean;
  excludePatterns: string[];
}

export interface SeoConfig {
  titleMinLength: number;
  titleMaxLength: number;
  descriptionMinLength: number;
  descriptionMaxLength: number;
  expectedSchemaTypes?: string[];
}

export interface MarketingConfig {
  primaryCta?: string;
  conversionJourneys: ConversionJourney[];
  analyticsIdentifiers?: string[];
}

export interface ConversionJourney {
  name: string;
  steps: string[];
}

export interface PerformanceConfig {
  thresholds: {
    performanceScore: number;
    accessibilityScore: number;
    bestPracticesScore: number;
    seoScore: number;
    lcpMs: number;
    cls: number;
    tbtMs: number;
  };
  importantPagesOnly: boolean;
}

export interface ImportantPage {
  name: string;
  path: string;
  priority: "critical" | "high" | "medium";
}

export interface CrawlResult {
  url: string;
  status: number;
  redirectedTo?: string;
  discoveredAt: string;
  depth: number;
  linksFound: number;
  error?: string;
}

export interface PageAuditContext {
  url: string;
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  loadTimeMs: number;
}
