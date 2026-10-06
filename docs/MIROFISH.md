# MiroFish integration

Build Vibe exposes a small adapter boundary for MiroFish-style scenario simulation.

The adapter is intentionally not coupled to an invented public API shape. Configure:

- CODINGVIBES_MIROFISH_URL
- CODINGVIBES_MIROFISH_API_KEY
- CODINGVIBES_MIROFISH_RUN_PATH (defaults to /simulate)

Without those settings, the integration status is **NOT_CONFIGURED**.

When configured, Build Vibe sends the benchmark scenario JSON to the configured endpoint and reports provider HTTP failures/timeouts as **BLOCKED**. A successful provider response is **PASS** for the integration request only; it is not treated as proof that Build Vibe itself is correct.

This boundary can later be connected to a real MiroFish deployment with its documented API without changing the benchmark architecture.
