/**
 * Required Cloudant / CouchDB indexes from DICTIONARY.md.
 * Create with `POST /{database}/_index` (see IBM Cloudant docs).
 */
export const CLOUDANT_REQUIRED_INDEXES = [
  {
    index: { fields: ["language_code", "type"] },
    name: "language-entries-index",
    type: "json",
  },
  {
    index: { fields: ["word", "translation"] },
    name: "word-search-index",
    type: "text",
  },
] as const;
