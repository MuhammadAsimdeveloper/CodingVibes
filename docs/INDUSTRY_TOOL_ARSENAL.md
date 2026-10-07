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
