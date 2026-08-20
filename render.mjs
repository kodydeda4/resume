import { render } from "jsonresume-theme-government-standard/dist";
import { writeFileSync, readFileSync } from "fs";

const resume = JSON.parse(readFileSync("main/resume.json", "utf8"));
const html = await render(resume);

// Align each job's employment dates to the right, level with the job title.
const overrides = `<style>
  /* Tighten the page margins (theme defaults to a full 1in on all sides). */
  body > div {
    padding: 0.5in !important;
  }
  @media print {
    body > div { padding: 0 !important; }
    @page { margin: 0.5in; }
  }
  /* The header wrapper of each work item (contains the title, company, and date). */
  div:has(> div > .resume-date-range) {
    position: relative;
    padding-right: 9em;
  }
  /* Tighten the gap between the job title and the company name, and between the
     education institution and its degree. The theme's 1.4 line-height leaves a
     visible gap even with zero margins, so pull the line-height in on these rows. */
  div:has(> div > .resume-date-range) > h3,                                 /* job title */
  div:has(> div > .resume-date-range) > div:not(:has(.resume-date-range)),  /* company */
  .resume-section div:has(> h3):not(:has(.resume-date-range)) > h3,         /* institution */
  .resume-section div:has(> h3):not(:has(.resume-date-range)) > div {       /* degree */
    line-height: 1.2 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
  /* Lift the date range up to sit on the same line as the title, flush right. */
  div:has(> div > .resume-date-range) > div:has(> .resume-date-range) {
    position: absolute;
    top: 0;
    right: 0;
    text-align: right;
  }

  /* --- Compress vertical spacing so everything fits on one page. --- */
  /* Header (name/contact block). */
  header { margin-bottom: 7pt !important; padding-bottom: 5pt !important; }
  /* Name. */
  header h1 { margin-bottom: 2pt !important; }
  /* Title line under the name (everything in the header that isn't the contact row). */
  header > div:not(.resume-contact) { margin-bottom: 3pt !important; }
  /* Space between major sections. */
  .resume-section { margin-bottom: 5pt !important; }
  /* Section headings ("PROFESSIONAL EXPERIENCE", etc.). */
  .resume-section-title { margin: 8pt 0 4pt 0 !important; }
  /* Summary / lead paragraph directly under a section heading. */
  .resume-section > p { margin-top: 0 !important; }
  /* Gap between individual work items. */
  .resume-section div:has(> ul):has(.resume-date-range) { margin-bottom: 6pt !important; }
  /* Bullet lists and their items. */
  .resume-section ul { margin-top: 2pt !important; }
  .resume-section ul li { margin: 0.5pt 0 !important; line-height: 1.14 !important; }
  /* Skills / education rows. */
  .resume-section div:has(> h4) { margin-bottom: 4pt !important; }
  .resume-section div:has(> h3):not(:has(.resume-date-range)) { margin-bottom: 2pt !important; }

  /* --- Scale text down ~8% to free vertical room, which the spacing above turns
     into breathing room while keeping everything on a single page. --- */
  header h1 { font-size: 16.5pt !important; }                        /* name */
  header > div:not(.resume-contact) { font-size: 11pt !important; }  /* title line */
  .resume-contact, .resume-contact a { font-size: 10pt !important; }/* contact row */
  .resume-section-title { font-size: 13pt !important; }             /* section headings */
  .resume-section h3 { font-size: 12pt !important; }                /* job / education titles */
  .resume-section p,
  .resume-section li,
  .resume-section h4,
  .resume-section > div,
  .resume-section div:has(> h3):not(:has(.resume-date-range)) > div,
  .resume-section div:has(> h4) span { font-size: 11pt !important; }/* body text */
  .resume-section .resume-date-range { font-size: 10pt !important; }/* dates */
</style>`;

// Show the personal site link as "Website" instead of the raw URL (href unchanged).
const withWebsiteLabel = html.replace(
  /(<a\b[^>]*aria-label="Website"[^>]*>)[^<]*(<\/a>)/,
  "$1Website$2"
);

// Reorder the header contact items. Separators (•) are their own DOM nodes, so we
// pull out the item spans, sort them, and re-join with fresh separators.
const contactOrder = ["Location", "LinkedIn", "GitHub", "Website", "Email", "Phone"];
const withContactOrder = withWebsiteLabel.replace(
  /(<div[^>]*resume-contact[^>]*>)(.*?)(<\/div>)/,
  (_, open, inner, close) => {
    const items = inner.match(/<span[^>]*\beJbAIy\b[^>]*>.*?<\/span>/g) || [];
    const labelOf = (span) => (span.match(/aria-label="([^"]+)"/) || [])[1] || "";
    const rank = (span) => {
      const i = contactOrder.indexOf(labelOf(span));
      return i === -1 ? contactOrder.length : i;
    };
    const separator = `<span aria-hidden="true" class="sc-kvnevz hJwcQt">•</span>`;
    const sorted = [...items].sort((a, b) => rank(a) - rank(b));
    return open + sorted.join(separator) + close;
  }
);

writeFileSync("resume.html", withContactOrder.replace("</head>", `${overrides}</head>`));
