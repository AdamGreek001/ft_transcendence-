*This project has been created as part of the 42 curriculum by ehafiane, mjuicha, eel-alao, kelmounj, ataai.*

# ft_transcendence — Social Platform

## Description

**ft_transcendence** is a real-time social media platform where users can create profiles, publish posts, follow other users, chat in real-time, and explore community content. The platform includes Google OAuth and TOTP two-factor authentication, WebSocket-powered messaging, and a complete monitoring stack.

### Key Features

- **User Profiles** — Registration, OAuth login, avatar uploads, bio, followers/following
- **Social Feed** — Create posts, like, comment, infinite-scroll timeline
- **Real-time Chat** — WebSocket-based direct messaging with typing indicators
- **Explore & Search** — Discover users and content with full-text search
- **Notifications** — Real-time alerts for likes, comments, follows, and messages
- **Two-Factor Authentication** — TOTP-based 2FA via authenticator apps
- **Monitoring** — Prometheus metrics + Grafana dashboards
- **Security** — WAF/ModSecurity, HashiCorp Vault for secrets, HTTPS, rate limiting

---

## Instructions

### Prerequisites

| Tool             | Version  |
|------------------|----------|
| Docker           | ≥ 24.0   |
| Docker Compose   | ≥ 2.20   |
| Make             | ≥ 4.0    |
| Git              | ≥ 2.40   |

### Setup

```bash
# 1 — Clone the repository
git clone <repository-url>
cd ft_transcendence

# 2 — Create and configure environment variables
# Copy and fill in the required values in .env

# 3 — Launch all services
make up

# 4 — Open in browser
# Navigate to https://localhost:8080 
```

### Available Commands

| Command          | Description                                |
|------------------|--------------------------------------------|
| `make up`        | Build and start all services               |
| `make down`      | Stop and remove containers                 |
| `make logs`      | Follow logs from all services              |
| `make build`     | Rebuild images without starting            |
| `make restart`   | Stop then start all services               |
| `make clean`     | Remove containers, volumes, and images     |
| `make ps`        | List running containers                    |

---

## Architecture

```
                     ┌──────────────┐
                     │   Browser    │
                     └──────┬───────┘
                            │ :8443 (HTTPS)
                     ┌──────▼───────┐
                     │  WAF / Mod   │ ← ModSecurity CRS
                     │  Security    │   TLS termination
                     └──────┬───────┘
                            │ :80 (internal)
                     ┌──────▼───────┐
                     │    nginx     │ ← rate limiting, routing
                     └──┬───────┬───┘
                        │       │
              ┌─────────▼─┐  ┌──▼──────────┐
              │  frontend  │  │   backend   │
              │ Next.js 15 │  │  NestJS 11  │
              │   :3000    │  │   :3001     │
              └────────────┘  └──┬──┬───┬───┘
                                 │  │   │
                    ┌────────────┘  │   └──────────────┐
                    │               │                  │
              ┌─────▼─────┐  ┌─────▼──────┐    ┌──────▼─────┐
              │ PostgreSQL │  │   Vault    │    │ Prometheus │
              │   :5432    │  │   :8200    │    │   :9090    │
              └────────────┘  └────────────┘    └──────┬─────┘
                                                       │
                                                ┌──────▼─────┐
                                                │  Grafana   │
                                                │   :3000    │
                                                └────────────┘
```

---

## Team Information

| Member       | Role(s)          | Responsibilities                                        |
|-------------|------------------|---------------------------------------------------------|
| ehafiane  | Project Owner    | Vision, priorities, module selection, stakeholder sync   |
| eel-alao  | Tech Lead        | Architecture, code reviews, CI/CD, DevOps               |
| all  | Frontend Dev     | UI/UX, React components, pages, Tailwind          |
| all  | Backend Dev      | API, WebSocket, auth, TypeORM, database                 |
| all  | Full-Stack Dev   | Search, notifications, media, monitoring, security      |

---

## Project Management

- **Task Distribution**: Work split by feature modules, assigned via GitHub Issues
- **Meetings**: Daily standups (15 min), weekly planning sessions
- **Tools**: GitHub Issues + Projects for task tracking
- **Communication**: Discord server with channels per service
- **Branching**: Feature branches → Pull Requests → `main` after review

---

## Technical Stack

| Layer      | Technology       | Justification                                                |
|-----------|------------------|--------------------------------------------------------------|
| Frontend  | Next.js 15       | App Router, React 19, View Transitions, excellent DX         |
| Styling   | Tailwind CSS 3   | Utility-first CSS, fast iteration, responsive design         |
| Backend   | NestJS 11        | Modular architecture, TypeScript, Express v5, Swagger        |
| ORM       | TypeORM 0.3      | Decorator-based entities, migrations, Repository pattern     |
| Database  | PostgreSQL 16    | ACID compliance, JSON support, mature ecosystem              |
| WebSocket | Socket.io 4      | Real-time chat, typing indicators, presence detection        |
| Auth      | JWT + Google OAuth + TOTP | Stateless auth, social login, 2FA            |
| Storage   | Local filesystem  | Simple, no external dependency, Docker volume backed         |
| WAF       | ModSecurity/CRS  | OWASP rule set, request filtering, scanner blocking          |
| Secrets   | HashiCorp Vault  | Encrypted secret storage, API key management                 |
| Proxy     | nginx 1.27       | Reverse proxy, rate limiting, WebSocket upgrade              |
| Monitoring| Prometheus + Grafana | Metrics collection, alerting, dashboards                 |

---

## Database Schema

```
┌──────────────────┐       ┌──────────────────┐
│      users       │       │      posts       │
├──────────────────┤       ├──────────────────┤
│ id          UUID │◄──┐   │ id          UUID │
│ username VARCHAR │   │   │ content  VARCHAR │
│ email    VARCHAR │   ├───│ author_id   UUID │
│ password_hash    │   │   │ image_url        │
│ displayName     │   │   │ created_at       │
│ bio              │   │   └────────┬─────────┘
│ avatarUrl       │   │            │
│ oauth_provider   │   │   ┌────────▼─────────┐
│ two_factor_*     │   │   │    comments      │
│ is_online        │   │   ├──────────────────┤
│ created_at       │   │   │ id          UUID │
└────┬──────┬──────┘   │   │ content  VARCHAR │
     │      │          ├───│ author_id   UUID │
     │      │          │   │ post_id     UUID │
┌────▼──┐ ┌─▼──────┐  │   └──────────────────┘
│follows│ │ blocks │  │
├───────┤ ├────────┤  │   ┌──────────────────┐
│follower│ │blocker │  │   │     likes        │
│following││blocked │  │   ├──────────────────┤
└───────┘ └────────┘  ├───│ user_id     UUID │
                       │   │ post_id     UUID │
┌──────────────────┐   │   └──────────────────┘
│ direct_messages  │   │
├──────────────────┤   │   ┌──────────────────┐
│ id          UUID │   │   │  notifications   │
│ content  VARCHAR │   │   ├──────────────────┤
│ sender_id   UUID ├───┤   │ id          UUID │
│ receiver_id UUID ├───┤   │ type     VARCHAR │
│ read       BOOL  │   ├───│ recipient_id     │
│ created_at       │   └───│ actor_id    UUID │
└──────────────────┘       │ read        BOOL │
                           └──────────────────┘
```

---

## Features List

| Feature              | Description                                         | Developer(s)    |
|---------------------|-----------------------------------------------------|-----------------|
| User Registration   | Email/password signup with validation                | kelmounj        |
| Google OAuth        | Social login via Google                              | kelmounj        |
| Two-Factor Auth     | TOTP-based 2FA with authenticator apps               | kelmounj        |
| User Profiles       | View/edit profile, avatar, bio, follow/block         | ehafiane, mjuicha |
| Social Feed         | Create posts, infinite scroll, personalized timeline | mjuicha         |
| Likes & Comments    | React to and discuss posts                           | mjuicha         |
| Real-time Chat      | WebSocket direct messaging, typing indicators        | ehafiane        |
| Notifications       | Real-time alerts for social interactions             | ehafiane        |
| Search              | User and post search with filters                    | ehafiane        |
| Media Upload        | Avatar and post image uploads (local storage)        | ataai           |
| Public API          | Rate-limited REST API (5+ endpoints)                 | eel-alao        |
| Privacy & Terms     | Legal pages (privacy policy, terms of service)       | kelmounj        |
| WAF/ModSecurity     | Web Application Firewall with OWASP CRS              | ataai           |
| Vault Secrets       | HashiCorp Vault for encrypted secrets management     | ataai           |
| Monitoring          | Prometheus metrics + Grafana dashboards              | eel-alao        |

---

## Modules

| Module                              | Type  | Points | Justification                                                        | Developer(s)         |
|-------------------------------------|-------|--------|----------------------------------------------------------------------|----------------------|
| Use a Framework as backend          | Major |   2    | NestJS — modular, typed, Express v5 under the hood                   | all                  |
| Use a Framework as frontend         | Major |   2    | Next.js 15 — App Router, React 19, SSR, View Transitions             | all                  |
| Use a database for the Backend      | Minor |   1    | PostgreSQL 16 + TypeORM 0.3 — migrations, Repository pattern         | all                  |
| Standard user management            | Major |   2    | Registration, profiles, avatar, followers/blocking, feed visibility  | kelmounj, mjuicha    |
| Implementing a remote authentication| Major |   2    | Google OAuth 2.0 — social login via Google provider                  | kelmounj             |
| Implementing Two-Factor Auth & JWT  | Major |   2    | TOTP 2FA (authenticator apps) + stateless JWT sessions               | kelmounj             |
| Implement WebSocket for real-time   | Major |   2    | Socket.io — live chat, typing indicators, online presence            | ehafiane             |
| Add a public API                    | Major |   2    | Secured API key, rate limiting, Swagger docs, 5+ endpoints           | eel-alao             |
| Implement a complete notification   | Minor |   1    | Real-time alerts for likes, comments, follows, messages (WebSocket)  | ehafiane             |
| WAF/ModSecurity + HashiCorp Vault   | Major |   2    | OWASP CRS request filtering + encrypted secrets management           | ataai                |
| Monitoring system (Prometheus/Grafana)| Major | 2   | Prometheus metrics collection, Grafana dashboards, exporters for nginx & postgres | eel-alao  |

**Total: 21 points** *(requirement: 14 points)*

---

## Individual Contributions

### ehafiane — Project Owner
- Defined project vision and feature priorities
- Managed sprint planning and task allocation
- Coordinated team communication and deadlines

### eel-alao — Tech Lead
- Designed system architecture and Docker infrastructure
- Implemented WAF/ModSecurity configuration
- Set up HashiCorp Vault for secrets management
- Created Prometheus/Grafana monitoring stack
- Code reviews and CI/CD pipeline

### all — Frontend Developer
- Built all Next.js pages (auth, feed, profile, messages, explore, notifications, legal)
- Created reusable UI component library (Button, Input, Avatar)
- Implemented Tailwind design system and responsive layouts
- Built Zustand state management and API client

### all — Backend Developer
- Designed TypeORM entity schema (13 models)
- Implemented authentication (JWT, Google OAuth, TOTP 2FA)
- Built REST API modules (users, posts, comments, public-api)
- Created WebSocket chat gateway with Socket.io
- Set up Swagger API documentation

### all — Full-Stack Developer
- Implemented search module with filters
- Built a notification system
- Created media upload service (local storage)
- Integrated frontend infinite scroll and WebSocket hooks

---

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Socket.io Documentation](https://socket.io/docs)
- [Docker Compose Reference](https://docs.docker.com/compose)
- [OWASP ModSecurity CRS](https://coreruleset.org/docs/)
- [HashiCorp Vault Docs](https://developer.hashicorp.com/vault/docs)
- [Prometheus Docs](https://prometheus.io/docs)

