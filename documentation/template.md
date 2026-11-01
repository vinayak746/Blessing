# Blessing Node: [Display Name]

**Node type:** `[EXACT_NODE_TYPE]`  
**Verification status:** Source-reviewed / Live-tested / Partially verified

## On this page

- [Overview](#1-overview)
- [Use cases](#2-when-to-use-it)
- [Setup](#3-setup)
- [Configuration](#4-configuration)
- [Inputs and outputs](#5-inputs-and-outputs)
- [Example workflow](#6-example-workflow)
- [Execution behavior](#7-execution-behavior)
- [Troubleshooting](#8-troubleshooting)
- [Security and limitations](#9-security-and-limitations)
- [Evidence and references](#10-evidence-and-references)
- [Verification checklist](#11-verification-checklist)

## 1. Overview

Describe what this exact node does using facts supported by the current source or tests.

## 2. When to use it

Explain suitable use cases and cases where a different node is required. Do not claim unsupported features.

## 3. Setup

Give click-by-click steps from the current UI. Note any prerequisites and deployment requirements.

## 4. Configuration

| Field or setting | Required? | Meaning | Example |
|---|---|---|---|
| `[setting]` | Verify in source | Explain its effect | `[example]` |

Use “Not applicable” when a section does not apply; do not fill gaps with guesses.

## 5. Inputs and outputs

Describe actual context keys, data types, defaults, and expression syntax. Distinguish documented output from output confirmed by a live test.

### Example

Use a clearly labeled illustrative example. Do not represent synthetic payloads as captured production data.

## 6. Example workflow

Describe the required connections and give a step-by-step configuration. State expected results and what must be tested.

## 7. Execution behavior

Explain the executor path, side effects, status updates, retries, persistence, and data passing, only where supported by source or tests.

## 8. Troubleshooting

| Symptom | Likely cause supported by evidence | Suggested check |
|---|---|---|
| `[symptom]` | `[known cause or “not established”]` | `[check]` |

## 9. Security and limitations

Separate confirmed limitations from potential risks that need further review. Include credentials, authorization, webhook protection, sensitive data and retry behavior when relevant.

## 10. Evidence and references

### Blessing source files

- `[path]` — what it establishes.

### External references

- [Official title](https://example.com) — what it explains.

Precedence: Blessing's current source and tests determine Blessing behavior. Official external sources explain external services. Record conflicts and unknowns explicitly.

## 11. Verification checklist

- [ ] Configuration steps tested.
- [ ] Expected input and output tested.
- [ ] Error cases tested.
- [ ] Security-relevant behavior reviewed.
- [ ] Guide rechecked against source changes.

## Maintenance metadata

- Last reviewed: `[YYYY-MM-DD]`
- Reviewer: `[optional]`
- Verification status: `[source-reviewed / live-tested / partially verified]`
- Source revision or commit: `[optional]`
