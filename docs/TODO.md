## FORMAT
[<Category>] <Title>

## Today Focus (1.5hr left)
[Process] Cursor merge in & Loom
[Testing] Enrolment Refactor - Test manually
[AI] Coach AI - Clickup page review
[Feature] Referrals - remove optional message
[Feature] Referrals - make tickets
[Security] Client side token - non black box
[Testing] Enrolment Refactor - E2E tests


## Next
[Feature] Intercom (messages, history, integrated links, chat relevance)
[Planning] Costing for chatbot conversation
[Documentation] Summarise for Justin - playback for Ron's work, what is it, why important
[Documentation] Tech video loom for tech items

## Backlog
[AI] Check prod deployment from Alvin
[ADE] Update blank tab page chrome work to ADE
[Content Embedding] Understand codebase, deployment and logical flow between things
Find better way to organise workspaces (https://claude.ai/chat/e35b2818-638d-4e69-9fb0-a415e3e58fd8)
[OpenRouter] Set up OpenRouter account for organization
  Create organizational account
  Add relevant users
  Document requirements and use cases
[Cleanup] Delete /ics-nextjs/pages/api/user-record-migrate.ts file and remove MIGRATION_API_KEY environment variable from all .env files (2023 migration tool no longer needed)
[Documentation] Define Solution design doc template and use for Kolb's inside ICS LXP, using existing Figma design
[Testing] E2E test automation MVP with Playwright
[Infrastructure] Upgrade Node to new LTS version (not 18)
[Infrastructure] Improve production visibility with Discord, GCP error logs, and other monitoring tools
[Infrastructure] Consider creating "dev_activities" Slack channel for environment updates (ClickUp, GitLab, deployments, prod alerts) and separate channel for prod issues
[Dev Environment] Plan to add waybar summary of OS situation - monitor storage, memory, CPU usage and apps using excessive resources
[Testing] Get regression testing suite started
[Learning] Reforge tech strategy course - start 2 modules before next Thursday (TOP PRIORITY)
[Dev Environment] Claude code tracking (TOP PRIORITY)
[Process] Define way to do smooth handover between devs
[Infrastructure] Setup auto-resume for dev/test envs via platform.sh CLI (local service or GitLab)
[Infrastructure] Research all Google Cloud monitoring tools and identify which ones we should implement (Cloud Monitoring, Cloud Logging, Error Reporting, Trace, Profiler, etc.)
[Testing] Start a Playwright e2e suite with network call recording (capture request/response data, timing, and duration for each test step) - should integrate with trace logging
[Process] Setup dual repos to allow for PR review
[Infrastructure] Check the gitlab build minutes we use and how they are funded
[Cleanup] Remove repomix stuff - too big for Cursor context (keep for Claude Code only)
[Dev Environment] Get Clickup tickets via API into a script then an MCP server
[Dev Environment] Look at the CC hooks on awesome claude code
[Dev Environment] Setup local OS calendar widget - show next meeting with countdown, highlight active meetings, click to open
[Dev Environment] Get voice to text working on Arch Linux machine
[Dev Environment] Define a CLI tool for myself to manage my OS (display, mouse, bluetooth, screenshots, shortcuts etc)
[Dev Environment] Find ways to log all actions on Linux machine (OS, Chrome, dev tools, terminal commands)
[Dev Environment] Setup OPs tab as a workspace (handle >10 workspaces - super+number shortcut limitation)
[Dev Environment] Document how often gcloud login is needed for NextJS app to access dev Firestore locally
[Research] Review and understand AI global search app - Reference: https://bitbucket.org/icanstudy/ics-pipelines-deployment/src/master/cloudrun_source/
[Process] Write a prompt to summarize Otter.ai standup transcripts for Slack posting
[Process] Do auto summary of Clickup and Gitlab activities at 8am and 5pm into dev team slack channel
[Dev Tools] Create tool to pull dev branch merges, find related tickets, and consolidate into MR summaries for easy change history understanding
[Team] Check with Will to use Gather after getting him able to run NextJS app without Drupal (see Focus item)
[Dev Environment] See if we can use turbopack for our nextJS project to speed up dev
[Bug Fix] Fix healthchecks to 500 when non authed without key
[Bug Fix] Can't log out on payment screen initially
[Security] All secrets in GCP should be stored as a secret env var not normal one
[Security] Check all env and codebase, find the NEXT_ variables that are in build files or the deployed env when they shouldn't be in .env locally
[UX] Finder field is multiline but doesn't expand with text or dragged (so it's just one line always except inside the field itself)
[UX] Check the wrapping of text for pill/badge component
[Security] Check all 3rd party services and their tokens with expiry times
[Security] Check that lower env cannot accept a signup of a non @icanstudy.com email in auth0
[Security] Export Auth0 into repo to make sure we have the latest
[Documentation] Document and understand current redirects throughout app including kickstart vs legacy
[Dev Tools] Create quick way to find user by name and pull Auth0 + Firestore records in one go
[UX] Check if menu is normally expanded when going from diag results "back to dashboard" vs already being on dashboard
[Bug Fix] Look at the 4x bugs in the current sprint
[Bug Fix] Investigate why /api/ghl/update-contact-server returns 500 on local dev during profile page fillout
[UX] Profile page - change phone number field to show "(optional)" in label instead of asterisk with "not mandatory" note
[UX] Profile intro page - DOB field defaults to today making it hard to know why continue button is disabled
[Infrastructure] Drupal DB copy down from prod to lower env x3
[Infrastructure] Integrate Clickup with Gitlab
[Infrastructure] Integrate Slack with ClickUp
[Infrastructure] Integrate GitLab with Slack
[Process] Improve Gitlab MR process with descriptions, ticket links, and standard title formats
[Process] Implement structured ticket format with PRD references
[Process] Better utilize Clickup for documentation and meeting notes
[Process] Research and evaluate Clickup Brain for team productivity
[Documentation] Expand technical documentation
[Process] Consolidate documentation and processes into Clickup
[Team] Improve visibility and communication between developers and Justin's team
[Infrastructure] Make production logs and issues more visible and accessible
[Dev Environment] Check claude code settings for each place (OS, Nexo, ICS app)
[Dev Environment] Get code running locally (Due: Friday, July 18th 2025)
[Dev Environment] Setup prod/preprod/test/dev account (Due: Friday, July 18th 2025)
[Dev Environment] Get e2e running
[Dev Environment] Fix merging up env to be conflict free
[Bug Fix] GCP 500 errors

[Feature] Screenshot window tool
[Feature] Refine list of apps to then connect with MCP
[Planning] Plan SDLC flow - now and ideal
[Planning] MVP - Professionals program
[Infrastructure] Get off Annex Platform.sh
[Infrastructure] Get off Annex gitlab (to github?)
[Infrastructure] Consider a simpler CMS like keystone
[Team] Get ICS taught
[Team] Clickup training
[Team] Get devs into Gather
[Team] Ron to identify MacBook Pro to buy and chat to Justin about it
[Dev Environment] **LOW PRIORITY** Get weather from BOM or similar and display on waybar

## Personal/Arch OS

### Work Items
[Planning] Kolbs idea (TBD Justin)
[Learning] AI learn more with Tan
[Team] AI - show team my workflow to devs, AI progress preso for whole team

### MEDIUM PRIORITY
[Dev Environment] Implement keyboard-first file picker
  - Options: fzf + fd/ripgrep combo
  - Or: broot, nnn with preview, or custom TUI
  - Must support: navigate folders, ripgrep search, preview

[Dev Environment] AGS improvements:
  - Integrate notifications into sidebar (not floating)
  - Fix app launcher: auto-select first item, better styling
  - Add to bar: volume indicator, next calendar event

[Dev Environment] Setup voice to text

### LOW PRIORITY
[Dev Environment] Nexo enhancements:
  - Auto-export Claude.ai chats (check for API/browser automation)
  - Export format: markdown with metadata
  - Local RAG for searching insights (consider ollama + vector DB)
  - Self-documenting static site (mkdocs/hugo)

[Dev Environment] Google profile cleanup
  - Export saved passwords first
  - Remove old form data and saved sites

[Dev Environment] System cleanup
  - Remove unused apps from launcher list
  - Check .desktop files in ~/.local/share/applications/
