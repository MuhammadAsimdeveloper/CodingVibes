# Industry Tool Arsenal — Teamily-Inspired Expansion

Date: 2026-10-07

Teamily AI is not merely a chatbot. Its public product architecture combines an AI-native messenger, multi-agent collaboration, connected context, living memory, proactive/long-horizon agents, collaborative studios, automations, Agent APIs/MCP/REST, agent workspaces, documents, dashboards, web/apps, research and cross-device operation. urlTeamily AIhttps://teamily.ai/

We will extract capabilities as **product primitives**, not copy Teamily code, branding, prompts, UI or proprietary implementation.

## Tier A — Core weapons for our ecosystem

| ID | Tool/capability | Canonical owner | Primary consumers |
|---|---|---|---|
| agent.team.orchestrator | Multi-agent team planner/orchestrator | Aira | All |
| agent.task.decomposer | Goal → subtasks/dependencies | Aira | Build Vibe, Atlas |
| agent.parallel.runner | Parallel bounded agent execution | Aira | All |
| agent.supervisor | Monitor/retry/escalate child agents | Aira | All |
| memory.global | Cross-project searchable memory | Aira | All |
| memory.project | Project-scoped memory | Aira | Build Vibe/Atlas |
| memory.preference | User preference memory | Aira | Aira |
| context.policy | Fine-grained context/privacy boundaries | Aira | All |
| automation.scheduler | Scheduled recurring jobs | Aira | All |
| automation.trigger | Event/webhook/condition triggers | Aira/Atlas | All |
| automation.history | Run history/replay/audit | Aira/Atlas | All |
| web.app.builder | Natural-language web application builder | Build Vibe | Build Vibe |
| docs.studio | Collaborative document generation/editing | Build Vibe/Atlas | All |
| slides.studio | Presentation generation/editing | Build Vibe | All |
| dashboard.studio | Data/dashboard generation | Build Vibe/Atlas | Atlas |
| research.studio | Deep research with sources/citations | Aira/Build Vibe | All |
| agent.creator | No-code custom agent creation | Aira | All |
| agent.team.creator | Prompt-defined specialized agent teams | Aira | All |
| agent.marketplace | Discover/install/share agents | Aira | All |
| agent.profile | Public agent identity/profile/share link | Aira | Aira |
| agent.api | Publish an agent as an API | Aira | Atlas/Build Vibe |
| mcp.gateway | MCP server/client tool gateway | Aira | All |
| oauth.connector | OAuth connection/consent management | Aira/Atlas | All |
| integration.slack | Slack channel/action integration | Atlas/Aira | Atlas |
| integration.github | GitHub repository/issue/PR integration | Aira/Build Vibe | All |
| integration.gmail | Gmail read/send/draft workflows | Aira | Aira/Atlas |
| integration.calendar | Calendar scheduling/event workflows | Aira/Atlas | All |
| human.approval | Human approval gates for consequential actions | Aira/Atlas | All |

## Tier B — Creative/productivity weapons

| ID | Tool | Owner |
|---|---|---|
| content.writer | Long-form content generation | Build Vibe/Aira |
| content.editor | Rewrite/proofread/style transformation | Build Vibe |
| content.translator | Translation/localization | Aira |
| video.brief | Video brief/storyboard generator | Auto-Vid |
| video.script | Script generator | Auto-Vid |
| media.asset.planner | Plan images/video/audio assets | Auto-Vid |
| file.workspace | Upload/organize/project files | Build Vibe/Aira |
| deliverable.bundle | Package multi-file outputs | Build Vibe |
| link.preview | Safe URL preview/extraction | Aira |
| notification.center | User/device notifications | Aira |
| reminder.manager | Reminder creation/management | Aira |
| command.center | Unified command/search launcher | Aira |
| translation.live | Conversation translation | Aira |
| group.agent.chat | Human + multiple agents in one thread | Aira |

## Tier C — Developer/platform weapons

| ID | Tool | Owner |
|---|---|---|
| code.reviewer | Repository/code review | Build Vibe/Aira |
| code.explainer | Explain code and architecture | Aira |
| code.refactorer | Bounded refactoring | Build Vibe |
| test.generator | Generate tests from behavior/spec | Build Vibe |
| bug.triage | Error/log → diagnosis | Build Vibe/Aira |
| issue.triage | GitHub issue classification | Aira |
| pr.assistant | PR summary/review/checklist | Aira/Build Vibe |
| api.builder | API contract → implementation | Build Vibe |
| api.monitor | Endpoint health monitoring | Atlas/Build Vibe |
| webhook.tester | Inspect/replay webhook payloads | Atlas/Build Vibe |
| schema.generator | JSON/DB/API schema generation | Build Vibe |
| sql.assistant | SQL generation/validation/explanation | Build Vibe |
| db.inspector | Safe schema/query inspection | Atlas |
| env.manager | Environment/config validation | Build Vibe |
| secret.audit | Detect exposed secrets/config mistakes | Build Vibe/Aira |
| dependency.audit | Dependency/security/update audit | Build Vibe |
| deployment.doctor | Deployment readiness diagnostics | Build Vibe/Atlas |
| log.analyzer | Structured log diagnosis | Build Vibe/Atlas |

## Tier D — Business/Atlas weapons

| ID | Tool | Owner |
|---|---|---|
| crm.agent | CRM action assistant | Atlas |
| lead.scorer | Lead scoring/explanation | Atlas |
| followup.agent | Follow-up drafting/scheduling | Atlas |
| inbox.triage | Unified inbox classification | Atlas |
| sales.pipeline | Pipeline analysis/actions | Atlas |
| campaign.builder | Campaign plan/assets | Atlas |
| funnel.auditor | Funnel conversion audit | Atlas |
| customer.summary | Customer/account summary | Atlas |
| meeting.summary | Meeting transcript → decisions/tasks | Atlas/Aira |
| proposal.builder | Proposal generation | Atlas |
| quote.assistant | Quote drafting/validation | Atlas |
| knowledge.base | Tenant-scoped knowledge retrieval | Atlas/Aira |

## Tier E — Safety/operations weapons

| ID | Tool | Owner |
|---|---|---|
| permission.engine | Tool/action authorization | Aira |
| risk.engine | Risk classification | Aira |
| action.confirmation | Confirmation policy | Aira |
| audit.ledger | Immutable action/result audit trail | Aira/Atlas |
| sandbox.runner | Isolated code/tool execution | Build Vibe/Aira |
| ssrf.guard | Safe outbound URL policy | Aira/Atlas |
| pii.guard | PII detection/redaction | Aira/Atlas |
| prompt.guard | Prompt injection boundary | Aira |
| provider.router | Model/provider selection/fallback | Aira |
| quota.manager | Usage/credit/limit enforcement | Aira/Atlas |
| job.queue | Durable async jobs | Aira/Build Vibe |
| retry.policy | Bounded retries/backoff | Aira |
| health.doctor | Dependency/provider health checks | All |

## Product strategy

Do **not** build all of these as one giant utility website.

Build a shared **Tool/Agent Fabric**:

Build Vibe = creation/building tools  
Aira = personal/local agent OS + orchestration  
Atlas = business operating system tools  
Auto-Vid = media production tools  
Asim-OS = local desktop tools  
Web Agency = delivery/QA tools

A capability should have one canonical implementation whenever possible and multiple adapters only when the product needs a different UX/runtime.

## Competitive extraction

From Teamily's public product/changelog, especially valuable capabilities include:
- human + multi-agent group collaboration;
- universal/living memory;
- proactive agents;
- long-horizon agents;
- agent teams;
- collaborative web/slides/docs/dashboards;
- recurring automations;
- Agent Workspace;
- Agent APIs;
- MCP/REST integration;
- OAuth consent;
- Slack bridges;
- public agent profiles;
- group coordination workflows;
- agent-mode selection;
- document collaboration and multi-deliverable export;
- cross-chat file handling;
- translation;
- link previews;
- approvals/permissions.

These become our roadmap inputs, not direct copies. citeturn0search0turn0search4turn0search5


## Tier F — Free-tool utility fabric

These are canonical task-level tools extracted from the broader free-tool ecosystem. They are not all separate products; many should be composable modules under one Tool Fabric.

### Documents/PDF
- `pdf.merge`
- `pdf.split`
- `pdf.rotate`
- `pdf.compress`
- `pdf.extract_pages`
- `pdf.to_image`
- `image.to_pdf`
- `pdf.metadata.inspect`
- `pdf.text.extract`
- `pdf.reorder`
- `document.text.extract`

### Image/media
- `image.compress`
- `image.resize`
- `image.crop`
- `image.convert`
- `image.webp.convert`
- `image.base64.encode`
- `image.base64.decode`
- `image.watermark`
- `image.colors.extract`
- `image.metadata.inspect`
- `web.favicon.generate`

### Text
- `text.count`
- `text.case.convert`
- `text.lines.sort`
- `text.duplicates.remove`
- `text.replace`
- `text.diff`
- `text.whitespace.clean`
- `text.slug.generate`
- `text.markdown.format`
- `text.unicode.inspect`

### Data/developer
- `data.json.csv`
- `data.json.yaml`
- `data.xml.format`
- `dev.sql.format`
- `dev.html.minify`
- `dev.css.minify`
- `dev.js.minify`
- `dev.url.encode`
- `dev.uuid.generate`
- `dev.hash.generate`
- `dev.cron.inspect`
- `dev.timestamp.convert`
- `dev.openapi.inspect`
- `dev.http.headers.inspect`

### Security/privacy
- `security.password.generate`
- `security.checksum.verify`
- `security.jwt.inspect`
- `security.certificate.inspect`
- `security.secret.scan`
- `security.pii.detect`
- `security.pii.redact`
- `security.csp.inspect`
- `security.url.inspect`

### SEO/web
- `seo.canonical.inspect`
- `seo.redirect.inspect`
- `seo.schema.generate`
- `seo.schema.validate`
- `seo.hreflang.generate`
- `seo.link.check`
- `seo.broken_links.scan`
- `seo.headers.inspect`
- `web.manifest.generate`
- `seo.lighthouse.audit`

### Calculators/converters
- `calc.percentage`
- `calc.ratio`
- `calc.discount`
- `calc.profit_margin`
- `calc.roi`
- `calc.break_even`
- `calc.compound_interest`
- `calc.loan`
- `convert.units`
- `time.duration`
- `time.age`
- `time.timezone`
- `data.size.convert`

### Generators
- `qr.url`
- `qr.text`
- `qr.wifi`
- `qr.email`
- `qr.vcard`
- `qr.whatsapp`
- `web.utm.generate`
- `design.color.palette`
- `design.css.gradient`

## Tier G — Browser/Computer-Use weapons

Inspired by the production browser-agent pattern, but implemented as our own provider-neutral contracts rather than copying a vendor. Browser automation must use an observe → act → verify loop and isolated sessions. citeturn1search0turn1search1

- `browser.session.create`
- `browser.session.close`
- `browser.navigate`
- `browser.observe`
- `browser.click`
- `browser.type`
- `browser.select`
- `browser.scroll`
- `browser.extract`
- `browser.download`
- `browser.upload`
- `browser.screenshot`
- `browser.verify`
- `browser.wait`
- `browser.back`
- `browser.forward`
- `browser.auth.handoff`
- `browser.session.persist`
- `browser.workflow.record`
- `browser.workflow.replay`
- `browser.workflow.repair`
- `browser.task.run`

**Security boundary:** prefer official APIs; require domain allowlists, isolated sessions, credential boundaries, action budgets, confirmation for consequential actions, verification and audit events. Do not add arbitrary access-control/CAPTCHA bypass functionality.

## Canonical ownership update

- Build Vibe owns the canonical Tool Fabric, developer utilities, web/SEO utilities and browser-tool contracts.
- Aira owns orchestration, permissions, memory/context, approvals and routing; it consumes the contracts.
- Atlas owns business workflows and may consume browser/API tools through governed adapters.
- Auto-Vid owns media production workflows and consumes generic media utilities.
- Asim-OS owns local/offline adapters where OS capabilities require them.
- Web Agency consumes the delivery/audit tools.
- Saudadesk-Ai remains product-specific.

## Tool quality rule

Do not compete on raw tool count. Compete on **coverage × reliability × privacy × composability × agent accessibility**.

A utility is admitted to the canonical catalog only when it has a distinct user job, contract, tests, security/privacy classification, documentation and verification state.


## Tool Fabric implementation checkpoint — 2026-10-09

The first canonical registry is src/tools/fabric.js. It preserves a single catalog rather than duplicating agent tool definitions across UI and server code. Entries distinguish available from planned, and require an explicit local/network execution mode, privacy boundary, network consent, risk class, bounds, audit event and fallback behavior.

The first four available implementations are JSON formatting/validation, JSON-to-TypeScript inference, Base64 encode/decode and JWT claim inspection. The API is session-authenticated, reports no external network use for these local tools, and records only tool identifier/outcome/size/timing metadata. API/network/browser tools remain blocked until their security boundary and approval contract are implemented.
