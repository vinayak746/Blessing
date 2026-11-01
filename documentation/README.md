# Blessing Node Documentation

This directory contains the human-maintained documentation set for Blessing's workflow nodes. Each node should have its own Markdown file and should be checked against the current implementation before being considered verified.

## Documentation principles

1. **Implementation first:** describe what the current Blessing source and tests demonstrate. Do not infer features from UI labels alone.
2. **Official references second:** use official external documentation to explain platform behavior (for example, Google Apps Script), clearly separated from Blessing-specific facts.
3. **Be explicit about uncertainty:** label behaviors as `Source-verified`, `Externally documented`, `Live-tested`, or `Unverified`. Do not present inferred behavior as tested fact.
4. **One node per document:** use stable file names based on the displayed node name or node type.
5. **Keep claims testable:** include source paths and a verification checklist, especially for credentials, webhook security, execution context, and error handling.
6. **Update with code:** re-review the guide when the associated implementation changes.
7. **Keep RAG ingestion deliberate:** the `documentation/` directory is the canonical human-maintained documentation set. It is not automatically part of the RAG index unless the indexer is configured to read it. When ready, either configure the indexer to include it or copy/sync these files to the configured raw knowledge-base directory. Avoid maintaining two divergent copies.

## Node documentation checklist

Each guide should include:

- Identity and purpose
- When to use the node
- UI setup steps
- Required credentials and configuration
- Input and output schema
- Variables and example expressions
- A realistic workflow example
- Execution behavior and status
- Error handling and troubleshooting
- Security and privacy considerations
- Verified limitations and unknowns
- Exact Blessing source paths
- Official external references, where applicable
- End-to-end verification checklist
- Verification status and maintenance rule

## Current guides

| Node | File | Verification |
|---|---|---|
| Google Form Trigger (`GOOGLE_FORM_TRIGGER`) | [`nodes-google-form-trigger.md`](nodes-google-form-trigger.md) | Source-reviewed; live end-to-end test pending |

## Suggested file naming

Use readable kebab-case file names, for example:

- `nodes-manual-trigger.md`
- `nodes-google-form-trigger.md`
- `nodes-stripe-trigger.md`
- `nodes-http-request.md`
- `nodes-openai.md`

Keep a consistent prefix if the RAG chunking or retrieval evaluator benefits from it. The document title should still include the exact node type from Blessing.
