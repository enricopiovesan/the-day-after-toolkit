import { withBase } from "../utils/url";

export interface SectionLink {
  href: string;
  label: string;
}

export interface SiteSection {
  key: string;
  label: string;
  href: string;
  links: SectionLink[];
}

// Single source of truth for the site's information architecture: which
// pages belong to which content cluster. Drives the left "section nav"
// rail and the breadcrumb trail on every non-home page, so a page only
// has to declare which section it's in, not repeat the link list.
export const SITE_SECTIONS: Record<string, SiteSection> = {
  book: {
    key: "book",
    label: "The Book",
    href: withBase("/about-the-book/"),
    links: [
      { href: withBase("/about-the-book/"), label: "About the Book" },
      { href: withBase("/excerpt/"), label: "Free Excerpt" },
      { href: withBase("/author/"), label: "Author" },
      { href: withBase("/contact/"), label: "Contact" },
      { href: withBase("/faq/"), label: "FAQ" },
    ],
  },
  chapters: {
    key: "chapters",
    label: "Chapters",
    href: withBase("/the-day-after/"),
    links: [
      { href: withBase("/the-day-after/"), label: "Ch.1: The Day After" },
      { href: withBase("/tribal-knowledge/"), label: "Ch.2: Tribal Knowledge Is the Bottleneck" },
      { href: withBase("/contracts/"), label: "Ch.3: Contracts Are the Answer" },
      { href: withBase("/capabilities-graph/"), label: "Ch.4: The Capabilities Graph" },
      { href: withBase("/extraction-over-refactoring/"), label: "Ch.5: Extraction Over Refactoring" },
      { href: withBase("/contract-lifecycle/"), label: "Ch.6: The Contract Lifecycle" },
      { href: withBase("/for-architects/"), label: "Ch.7: The Architect" },
      { href: withBase("/for-developers/"), label: "Ch.8: The Developer" },
      { href: withBase("/for-product-managers/"), label: "Ch.9: The PM / PO" },
      { href: withBase("/for-designers/"), label: "Ch.10: The Designer" },
      { href: withBase("/for-engineering-leaders/"), label: "Ch.11: The Leadership Team" },
      { href: withBase("/company-that-gets-there-first/"), label: "Ch.12: The Company That Gets There First" },
      { href: withBase("/appendix/"), label: "Appendix" },
      { href: withBase("/appendix/contract-schema-reference/"), label: "Appendix A: Contract Schema Reference" },
      { href: withBase("/appendix/legibility-audit-framework/"), label: "Appendix B: Legibility Audit Framework" },
      { href: withBase("/appendix/extraction-priority-matrix/"), label: "Appendix C: Extraction Priority Matrix" },
    ],
  },
  "why-c-dad": {
    key: "why-c-dad",
    label: "Why C-DAD",
    href: withBase("/why-c-dad/"),
    links: [
      { href: withBase("/why-c-dad/"), label: "Why C-DAD" },
      { href: withBase("/why-c-dad/what-problem-does-c-dad-solve/"), label: "What problem does C-DAD solve?" },
      { href: withBase("/why-c-dad/why-ai-agents-need-legible-systems/"), label: "Why AI agents need legible systems" },
      { href: withBase("/why-c-dad/the-cost-of-tribal-knowledge/"), label: "The cost of tribal knowledge" },
      { href: withBase("/why-c-dad/from-documentation-to-contracts/"), label: "From documentation to contracts" },
    ],
  },
  "core-model": {
    key: "core-model",
    label: "Core Model",
    href: withBase("/core-model/"),
    links: [
      { href: withBase("/core-model/"), label: "Core Model" },
      { href: withBase("/core-model/legibility/"), label: "Legibility" },
      { href: withBase("/core-model/capability/"), label: "Capability" },
      { href: withBase("/core-model/contract/"), label: "Contract" },
      { href: withBase("/core-model/capability-graph/"), label: "Capability Graph" },
      { href: withBase("/core-model/minimum-viable-contract/"), label: "Minimum Viable Contract" },
      { href: withBase("/core-model/contract-anti-patterns/"), label: "Contract Anti-Patterns" },
      { href: withBase("/core-model/capability-lifecycle-states/"), label: "Capability Lifecycle States" },
    ],
  },
  "how-c-dad-works": {
    key: "how-c-dad-works",
    label: "How C-DAD Works",
    href: withBase("/how-c-dad-works/"),
    links: [
      { href: withBase("/how-c-dad-works/"), label: "How C-DAD Works" },
      { href: withBase("/how-c-dad-works/cdad-check/"), label: "cdad check" },
      { href: withBase("/how-c-dad-works/cdad-roadmap/"), label: "cdad roadmap" },
      { href: withBase("/how-c-dad-works/cdad-init/"), label: "cdad init" },
      { href: withBase("/how-c-dad-works/cdad-validate/"), label: "cdad validate" },
      { href: withBase("/how-c-dad-works/cdad-graph/"), label: "cdad graph" },
      { href: withBase("/how-c-dad-works/writing-your-first-contract/"), label: "Writing your first contract" },
    ],
  },
  glossary: {
    key: "glossary",
    label: "Glossary",
    href: withBase("/glossary/"),
    links: [
      { href: withBase("/glossary/"), label: "Glossary" },
      { href: withBase("/glossary/legibility/"), label: "Legibility" },
      { href: withBase("/glossary/capability/"), label: "Capability" },
      { href: withBase("/glossary/contract/"), label: "Contract" },
      { href: withBase("/glossary/capability-graph/"), label: "Capability Graph" },
      { href: withBase("/glossary/tribal-knowledge/"), label: "Tribal Knowledge" },
      { href: withBase("/glossary/extraction/"), label: "Extraction" },
      { href: withBase("/glossary/agent-readiness/"), label: "Agent Readiness" },
      { href: withBase("/glossary/contract-driven-ai-development/"), label: "Contract-Driven AI Development" },
      { href: withBase("/glossary/minimum-viable-contract/"), label: "Minimum Viable Contract" },
      { href: withBase("/glossary/non-goals/"), label: "Non-Goals" },
    ],
  },
  comparisons: {
    key: "comparisons",
    label: "Comparisons",
    href: withBase("/comparisons/"),
    links: [
      { href: withBase("/comparisons/"), label: "Comparisons" },
      { href: withBase("/comparisons/c-dad-vs-documentation/"), label: "C-DAD vs Documentation" },
      { href: withBase("/comparisons/c-dad-vs-code-comments/"), label: "C-DAD vs Code Comments" },
      { href: withBase("/comparisons/c-dad-vs-openapi/"), label: "C-DAD vs OpenAPI" },
      { href: withBase("/comparisons/c-dad-vs-adrs/"), label: "C-DAD vs ADRs" },
      { href: withBase("/comparisons/c-dad-vs-full-rewrite/"), label: "C-DAD vs Full Rewrite" },
    ],
  },
  "use-cases": {
    key: "use-cases",
    label: "Use Cases",
    href: withBase("/use-cases/"),
    links: [
      { href: withBase("/use-cases/"), label: "Use Cases" },
      { href: withBase("/use-cases/legacy-codebase-modernization/"), label: "Legacy Codebase Modernization" },
      { href: withBase("/use-cases/onboarding-new-engineers/"), label: "Onboarding New Engineers" },
      { href: withBase("/use-cases/preparing-for-ai-coding-agents/"), label: "Preparing for AI Coding Agents" },
      { href: withBase("/use-cases/microservices-with-many-owners/"), label: "Microservices With Many Owners" },
      { href: withBase("/use-cases/regulated-industries-and-compliance/"), label: "Regulated Industries and Compliance" },
    ],
  },
  proof: {
    key: "proof",
    label: "Proof",
    href: withBase("/proof/"),
    links: [
      { href: withBase("/proof/"), label: "Proof" },
      { href: withBase("/proof/legibility-scoring-methodology/"), label: "Legibility Scoring Methodology" },
      { href: withBase("/proof/case-for-extraction-over-rewrite/"), label: "Case for Extraction Over Rewrite" },
      { href: withBase("/proof/open-source-toolkit/"), label: "Open Source Toolkit" },
    ],
  },
  examples: {
    key: "examples",
    label: "Examples",
    href: withBase("/examples/"),
    links: [
      { href: withBase("/examples/"), label: "Examples" },
      { href: withBase("/examples/payment-retry-policy-contract/"), label: "Payment Retry Policy Contract" },
      { href: withBase("/examples/reading-a-capability-graph/"), label: "Reading a Capability Graph" },
      { href: withBase("/examples/before-and-after-a-legibility-audit/"), label: "Before and After a Legibility Audit" },
      { href: withBase("/examples/cdad-check-output-walkthrough/"), label: "cdad check Output Walkthrough" },
    ],
  },
  toolkit: {
    key: "toolkit",
    label: "Toolkit",
    href: withBase("/toolkit/"),
    links: [
      { href: withBase("/toolkit/"), label: "Toolkit" },
      { href: withBase("/toolkit/installation/"), label: "Installation" },
      { href: withBase("/toolkit/cli-reference/"), label: "CLI Reference" },
      { href: withBase("/toolkit/github-repository/"), label: "GitHub Repository" },
    ],
  },
};
