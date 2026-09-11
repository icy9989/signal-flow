# SignalFlow

> AI-powered customer feedback intelligence for product teams.

## Overview

SignalFlow is a modern AI-powered SaaS platform that helps product teams transform large volumes of unstructured customer feedback into clear, actionable insights.

Companies receive feedback through support tickets, surveys, product reviews, CSV exports, and other channels. Manually reviewing this feedback makes it difficult to recognize recurring problems, emerging issues, feature requests, and changes in customer sentiment.

SignalFlow centralizes customer feedback and uses AI to classify, summarize, group, and analyze it. Product teams can use a modern analytics dashboard to understand what customers are talking about, identify rapidly growing issues, discover frequently requested features, and decide what deserves attention.

The platform is designed as a multi-tenant SaaS application where organizations have isolated workspaces, team members, projects, feedback data, analytics, and usage limits.

---

## Goals

1. Transform unstructured customer feedback into structured, searchable product intelligence.

2. Automatically identify recurring topics, bugs, complaints, feature requests, praise, and customer sentiment using AI.

3. Detect emerging issues by combining AI-based topic understanding with deterministic trend and volume analysis.

4. Provide product teams with a modern dashboard for understanding feedback volume, sentiment, topics, trends, and AI-generated insights.

5. Build SignalFlow as a production-style multi-tenant SaaS with authentication, organization management, background processing, role-based access, usage tracking, and subscription-ready architecture.

6. Keep AI outputs grounded in actual customer feedback and calculated analytics rather than allowing the model to invent statistics or unsupported conclusions.

---

# Core User Flow

1. User creates an account or signs in.

2. User creates or joins an organization workspace.

3. User creates a product/project inside the organization.

4. User imports customer feedback using a CSV file.

5. SignalFlow validates and stores the imported feedback.

6. A background processing pipeline analyzes each feedback item.

7. AI extracts structured information such as:

   * sentiment
   * category
   * topic
   * feedback type
   * severity
   * short summary

8. Embeddings are generated so semantically similar feedback can be discovered and grouped.

9. SignalFlow aggregates the processed data and calculates statistics and trends.

10. The user opens the dashboard to see feedback volume, sentiment distribution, trending topics, common complaints, feature requests, and emerging issues.

11. The user opens a topic to investigate the underlying feedback and supporting evidence.

12. The user can search and filter the original feedback to verify what customers actually said.

---

# Features

## 1. Authentication

* Sign up
* Sign in
* Sign out
* Protected application routes
* User profile
* Session management

---

## 2. Organization Workspaces

SignalFlow is a multi-tenant SaaS platform.

Each organization has an isolated workspace containing its own:

* users
* projects
* feedback
* topics
* insights
* analytics
* settings

Users from one organization must never be able to access another organization's private data.

### Roles

**Owner**

* Full organization control
* Manage members
* Manage organization settings

**Admin**

* Manage projects and feedback
* Invite team members

**Member**

* View and analyze feedback

---

# 3. Projects

An organization can create multiple projects representing different products or feedback sources.

Example:

```text
Acme Inc.

Projects

→ Mobile App
→ Web Platform
→ Developer API
```

Each project maintains independent feedback, topics, analytics, and insights.

---

# 4. Feedback Import

### MVP

Users upload customer feedback through CSV.

Example:

```text
date,source,customer,feedback

2026-09-01,support,user_001,"Search is extremely slow."

2026-09-02,survey,user_002,"Please add Google login."

2026-09-02,support,user_003,"Checkout freezes on my iPhone."
```

Before importing, SignalFlow provides:

* CSV validation
* Column mapping
* Import preview
* Invalid-row detection
* Duplicate detection
* Import progress
* Import history

---

# 5. Feedback Inbox

Users can browse all imported feedback from one modern interface.

Each feedback item displays:

* Original feedback
* Source
* Date
* Sentiment
* Topic
* Category
* Severity
* Processing status

### Filters

Users can filter by:

* Date range
* Sentiment
* Topic
* Category
* Source
* Severity
* Processing status

The inbox should also provide text and semantic search.

---

# 6. AI Processing Pipeline

Feedback processing happens asynchronously rather than blocking the user's request.

```text
Feedback Imported
        ↓
Validation
        ↓
Background Job Queue
        ↓
AI Processing
        ↓
Structured Extraction
        ↓
Embedding Generation
        ↓
Database
        ↓
Topic / Trend Analysis
```

For each feedback item, AI produces structured output similar to:

```json
{
  "sentiment": "negative",
  "category": "bug",
  "topic": "mobile_checkout",
  "severity": "high",
  "summary": "Checkout freezes after payment submission."
}
```

The structured response is validated before being stored.

---

# 7. Topic Intelligence

SignalFlow groups related feedback into topics.

For example:

```text
Mobile Checkout

438 feedback items

↑ 82% this week

Negative sentiment: 91%

Common themes

• Checkout freezes
• Payment page fails to load
• Safari problems
• iPhone problems
```

Users can open a topic to see:

* Topic summary
* Feedback count
* Volume over time
* Sentiment distribution
* Related feedback
* Representative examples
* Sources
* AI-generated explanation

AI summaries must be connected to the original feedback so users can inspect the evidence.

---

# 8. Emerging Issue Detection

SignalFlow identifies topics experiencing unusual increases in feedback.

For example:

```text
EMERGING ISSUE

Mobile Checkout Failures

31 reports today

↑ 343%

Severity
HIGH

First spike
Sep 10

AI Summary

Customers are increasingly reporting checkout
failures, particularly from mobile devices.
```

The numerical values are calculated by application code.

AI is responsible for interpreting and summarizing the underlying feedback—not inventing the statistics.

---

# 9. Feature Request Intelligence

SignalFlow automatically identifies feature requests.

Example:

```text
TOP FEATURE REQUESTS

Google Login
186 requests
↑ 24%

Dark Mode
143 requests
↑ 12%

CSV Export
97 requests
↑ 8%

Mobile Widgets
61 requests
↑ 17%
```

Opening a request shows the related customer feedback and trend history.

---

# 10. Analytics Dashboard

The dashboard is the central experience of SignalFlow.

### Overview Metrics

```text
12,481
Feedback Items
↑ 12.4%

38%
Negative Sentiment
↓ 3.2%

47
Active Topics
↑ 5

8
Emerging Issues
↑ 3
```

### Dashboard Sections

**Feedback Volume**

Interactive time-series chart showing feedback volume.

**Sentiment**

Positive / Neutral / Negative distribution and historical changes.

**Trending Topics**

Topics experiencing the largest increases.

**Emerging Issues**

Potential problems requiring attention.

**Feature Requests**

Most frequently requested improvements.

**Feedback Sources**

Distribution across imported feedback sources.

**Recent AI Insights**

Important observations discovered by SignalFlow.

---

# 11. AI Insight Cards

Instead of providing only charts, SignalFlow surfaces important observations.

Example:

```text
AI INSIGHT

Search complaints increased 48% this week.

Most negative feedback mentions response
times exceeding several seconds.

Evidence

143 related feedback items
89% negative sentiment

[Explore Topic]
```

Every insight should provide a path back to its supporting data.

---

# 12. Search

Users can search feedback using natural language.

Examples:

"Customers complaining about checkout"

"Requests related to authentication"

"Problems reported by mobile users"

SignalFlow combines keyword search, metadata filters, and semantic similarity.

---

# 13. Background Processing

Long-running AI tasks are processed asynchronously.

Jobs include:

* Feedback classification
* Embedding generation
* Topic discovery
* Topic summarization
* Insight generation
* Trend analysis

The UI displays processing progress instead of making users wait for long HTTP requests.

---

# 14. Usage Tracking

SignalFlow tracks organization-level usage such as:

* Feedback processed
* AI requests
* Storage usage
* Organization members

This prepares the platform for future subscription plans.

---

# 15. Billing Architecture

The application should be designed for subscription billing even if full billing is not part of the first MVP.

Potential plans:

### Free

* 1 project
* 500 feedback items/month
* Basic analytics

### Pro

* Multiple projects
* Higher feedback limits
* AI insights
* Semantic search
* Emerging issue detection

### Team

* Multiple members
* Advanced analytics
* Integrations
* Higher usage limits

---

# Design Direction

## Visual Style

SignalFlow should have a modern, premium SaaS dashboard aesthetic.

The application is **dark-mode first**.

Avoid overly colorful gradients, excessive glassmorphism, large glowing effects, and generic "AI-looking" interfaces.

The design should feel closer to a professional developer/product analytics tool.

### Design Characteristics

* Deep charcoal/near-black background
* Slightly lighter elevated surfaces
* Subtle borders
* Soft shadows
* Moderate border radius
* High-contrast typography
* Muted secondary text
* One restrained accent color
* Dense but readable analytics layouts
* Smooth micro-interactions
* Minimal gradients
* Clear information hierarchy

---

# Application Layout

```text
┌────────────────────────────────────────────────────────────┐
│ SignalFlow                         Search       🔔   User   │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│ Overview     │  Overview                                   │
│              │                                             │
│ Feedback     │  ┌────────┐ ┌────────┐ ┌────────┐          │
│ Topics       │  │ 12.4K  │ │  38%   │ │   47   │          │
│ Insights     │  │Feedback│ │Negative│ │ Topics │          │
│ Analytics    │  └────────┘ └────────┘ └────────┘          │
│              │                                             │
│ ───────────  │  Feedback Volume                            │
│ Integrations │  ┌────────────────────────────────────┐     │
│ Team         │  │              ╭────╮                │     │
│ Billing      │  │        ╭─────╯    ╰────            │     │
│ Settings     │  └────────────────────────────────────┘     │
│              │                                             │
│              │  Trending Topics          Emerging Issues   │
│              │  ┌─────────────────┐      ┌──────────────┐ │
│              │  │ Checkout  +82%  │      │ ⚠ Checkout  │ │
│              │  │ Search    +31%  │      │ ⚠ Search    │ │
│              │  │ Login     +19%  │      │              │ │
│              │  └─────────────────┘      └──────────────┘ │
└──────────────┴─────────────────────────────────────────────┘
```

---

# Suggested Application Pages

```text
/
├── /login
├── /signup
│
└── /app
    ├── /overview
    │
    ├── /feedback
    │   └── /[feedbackId]
    │
    ├── /topics
    │   └── /[topicId]
    │
    ├── /insights
    │   └── /[insightId]
    │
    ├── /analytics
    │
    ├── /imports
    │
    ├── /integrations
    │
    ├── /team
    ├── /billing
    └── /settings
```

---

# Technical Direction

## Frontend

* Next.js
* TypeScript
* React Server Components where appropriate
* Tailwind CSS
* shadcn/ui
* Modern charting library

## Backend

* Next.js server APIs/actions for application operations
* Dedicated background worker for long-running AI processing
* Job queue for asynchronous tasks
* Schema validation for all AI structured outputs

## Database

PostgreSQL.

Primary entities:

```text
User
Organization
OrganizationMember
Project
Feedback
FeedbackAnalysis
Topic
TopicFeedback
Insight
Import
UsageRecord
Subscription
```

Use `organizationId` throughout tenant-owned resources to enforce data isolation.

## AI

AI capabilities include:

* Structured classification
* Sentiment analysis
* Summarization
* Embeddings
* Semantic similarity
* Topic discovery
* Insight generation

## Vector Search

PostgreSQL + pgvector can store feedback embeddings and support semantic similarity searches.

---

# Scope

## V1 — Build First

* Authentication
* Organization workspace
* Project creation
* CSV feedback import
* Feedback inbox
* AI classification
* Sentiment analysis
* Topic extraction
* Dashboard
* Basic analytics
* Topic pages
* Background processing
* Search/filtering

The V1 should deliver one excellent workflow:

```text
Create Account
      ↓
Create Organization
      ↓
Create Project
      ↓
Upload Feedback
      ↓
AI Processes Feedback
      ↓
Explore Dashboard
      ↓
Investigate Topics
```

---

## V2

After V1 is stable:

* Semantic search
* Embedding-based clustering
* Emerging issue detection
* AI insight generation
* Feature request tracking
* Team invitations
* RBAC
* Usage limits
* Billing

---

## V3

Future integrations:

* Zendesk
* Intercom
* Slack
* Email
* App-store reviews
* Survey platforms
* Webhooks/API

---

# Out of Scope for Initial Release

* Building custom foundation models
* Training an LLM from scratch
* Real-time chat support
* CRM replacement
* Fully automated product decisions
* Large numbers of third-party integrations
* Mobile applications
* Enterprise SSO

---

# Success Criteria

1. A user can create an account, organization, and project.

2. A user can upload a valid feedback CSV and preview the data before importing it.

3. Imported feedback is processed asynchronously without blocking the application.

4. Every processed feedback item receives validated structured AI analysis.

5. Users can browse and filter feedback by sentiment, topic, category, source, and date.

6. The dashboard accurately calculates feedback volume, sentiment distribution, topic counts, and historical trends.

7. Users can open a topic and inspect the actual feedback supporting the AI-generated summary.

8. Organization data is properly isolated between tenants.

9. AI-generated insights never present invented numerical statistics; numerical analytics come from deterministic application calculations.

10. The application provides a polished, responsive dark-mode dashboard suitable for a production SaaS product.
