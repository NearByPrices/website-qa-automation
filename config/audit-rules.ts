export interface AuditRule {
  id: string;
  name: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  description: string;
}

export const SEO_RULES: AuditRule[] = [
  { id: "SEO-001", name: "Title tag exists", category: "SEO", severity: "HIGH", description: "Page must have a title tag" },
  { id: "SEO-002", name: "Title not empty", category: "SEO", severity: "HIGH", description: "Title tag must not be empty" },
  { id: "SEO-003", name: "Meta description exists", category: "SEO", severity: "MEDIUM", description: "Page should have a meta description" },
  { id: "SEO-004", name: "Meta description not empty", category: "SEO", severity: "MEDIUM", description: "Meta description must not be empty" },
  { id: "SEO-005", name: "Title length within range", category: "SEO", severity: "LOW", description: "Title should be between configured min/max characters" },
  { id: "SEO-006", name: "Description length within range", category: "SEO", severity: "LOW", description: "Meta description should be between configured min/max" },
  { id: "SEO-007", name: "H1 exists", category: "SEO", severity: "MEDIUM", description: "Page should have exactly one H1" },
  { id: "SEO-008", name: "Canonical URL present", category: "SEO", severity: "MEDIUM", description: "Page should declare a canonical URL" },
  { id: "SEO-009", name: "Canonical URL valid", category: "SEO", severity: "MEDIUM", description: "Canonical URL should be a valid absolute URL" },
  { id: "SEO-010", name: "Images have alt text", category: "SEO", severity: "MEDIUM", description: "All meaningful images must have alt attributes" },
  { id: "SEO-011", name: "No noindex on public pages", category: "SEO", severity: "HIGH", description: "Public pages should not block indexing" },
  { id: "SEO-012", name: "HTTP status 200", category: "SEO", severity: "CRITICAL", description: "Important pages should return HTTP 200" },
  { id: "SEO-013", name: "Structured data present", category: "SEO", severity: "LOW", description: "Pages should include relevant structured data" },
  { id: "SEO-014", name: "Structured data valid JSON", category: "SEO", severity: "MEDIUM", description: "JSON-LD structured data must be valid JSON" },
  { id: "SEO-015", name: "Sitemap accessible", category: "SEO", severity: "MEDIUM", description: "XML sitemap should be reachable" },
  { id: "SEO-016", name: "robots.txt accessible", category: "SEO", severity: "LOW", description: "robots.txt should be reachable" },
  { id: "SEO-017", name: "No duplicate titles", category: "SEO", severity: "MEDIUM", description: "Multiple pages should not share the same title" },
  { id: "SEO-018", name: "No duplicate descriptions", category: "SEO", severity: "LOW", description: "Multiple pages should not share the same description" },
];

export const MARKETING_RULES: AuditRule[] = [
  { id: "MKT-001", name: "Primary CTA visible on homepage", category: "MARKETING", severity: "HIGH", description: "Homepage should have a clear primary call to action" },
  { id: "MKT-002", name: "Value proposition present", category: "MARKETING", severity: "HIGH", description: "Homepage should clearly explain the service" },
  { id: "MKT-003", name: "Search functionality accessible", category: "MARKETING", severity: "CRITICAL", description: "Product search must be easily accessible" },
  { id: "MKT-004", name: "Product price displayed", category: "MARKETING", severity: "HIGH", description: "Product pages should display price information" },
  { id: "MKT-005", name: "Contact shop CTA present", category: "MARKETING", severity: "HIGH", description: "Product pages should offer a way to contact a local shop" },
  { id: "MKT-006", name: "Price range notation clear", category: "MARKETING", severity: "HIGH", description: "Indicative online prices should be clearly marked as estimates" },
  { id: "MKT-007", name: "Empty state handled", category: "MARKETING", severity: "MEDIUM", description: "Pages with no results should display a helpful message" },
  { id: "MKT-008", name: "Broken images on key pages", category: "MARKETING", severity: "MEDIUM", description: "Key page images should load successfully" },
  { id: "MKT-009", name: "No placeholder content", category: "MARKETING", severity: "MEDIUM", description: "Pages should not contain lorem ipsum or placeholder text" },
];

export const SECURITY_RULES: AuditRule[] = [
  { id: "SEC-001", name: "HTTPS enforced", category: "SECURITY", severity: "CRITICAL", description: "All pages must be served over HTTPS" },
  { id: "SEC-002", name: "X-Frame-Options header", category: "SECURITY", severity: "MEDIUM", description: "Response should include X-Frame-Options or CSP frame-ancestors" },
  { id: "SEC-003", name: "X-Content-Type-Options header", category: "SECURITY", severity: "MEDIUM", description: "Response should include X-Content-Type-Options: nosniff" },
  { id: "SEC-004", name: "No sensitive data in HTML", category: "SECURITY", severity: "HIGH", description: "HTML should not contain obvious credential patterns" },
];
