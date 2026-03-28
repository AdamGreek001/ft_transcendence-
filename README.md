*This project has been created as part of the 42 curriculum by \<login1\>, \<login2\>, \<login3\>, \<login4\>, \<login5\>.*

# ft_transcendence — Social Platform

## Description

**ft_transcendence** is a real-time social media platform where users can create profiles, publish posts, follow other users, chat in real-time, and explore community content. The platform includes Google OAuth and TOTP two-factor authentication, WebSocket-powered messaging, internationalization (EN/FR/AR), and a complete monitoring stack.

### Key Features

- **User Profiles** — Registration, OAuth login, avatar uploads, bio, followers/following
- **Social Feed** — Create posts, like, comment, infinite-scroll timeline
- **Real-time Chat** — WebSocket-based direct messaging with typing indicators
- **Explore & Search** — Discover users and content with full-text search
- **Notifications** — Real-time alerts for likes, comments, follows, and messages
- **Internationalization** — Full i18n support (English, French, Arabic)
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
cp .env.example .env
# Edit .env and replace ALL placeholder values with real values

# 3 — Launch all services
make up

# 4 — Open in browser
# Navigate to https://localhost:8443 (accept self-signed cert warning)
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
              │ Next.js 15 │  │  NestJS 10  │
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
| \<login1\>  | Project Owner    | Vision, priorities, module selection, stakeholder sync   |
| \<login2\>  | Tech Lead        | Architecture, code reviews, CI/CD, DevOps               |
| \<login3\>  | Frontend Dev     | UI/UX, React components, pages, i18n, Tailwind          |
| \<login4\>  | Backend Dev      | API, WebSocket, auth, Prisma, database                  |
| \<login5\>  | Full-Stack Dev   | Search, notifications, media, monitoring, security      |

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
| Frontend  | Next.js 15       | App Router, SSR, React 19, excellent DX                      |
| Styling   | Tailwind CSS 3   | Utility-first CSS, fast iteration, responsive design         |
| Backend   | NestJS 10        | Modular architecture, TypeScript, decorators, Swagger        |
| ORM       | Prisma 6         | Type-safe queries, migrations, schema-first                  |
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
│ display_name     │   │   │ created_at       │
│ bio              │   │   └────────┬─────────┘
│ avatar_url       │   │            │
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
| User Registration   | Email/password signup with validation                | \<login4\>      |
| Google OAuth        | Social login via Google                              | \<login4\>      |
| Two-Factor Auth     | TOTP-based 2FA with authenticator apps               | \<login4\>      |
| User Profiles       | View/edit profile, avatar, bio, follow/block         | \<login3\>, \<login4\> |
| Social Feed         | Create posts, infinite scroll, personalized timeline | \<login3\>      |
| Likes & Comments    | React to and discuss posts                           | \<login3\>, \<login4\> |
| Real-time Chat      | WebSocket direct messaging, typing indicators        | \<login4\>      |
| Notifications       | Real-time alerts for social interactions             | \<login5\>      |
| Search              | User and post search with filters                    | \<login5\>      |
| Media Upload        | Avatar and post image uploads (local storage)         | \<login5\>      |
| Public API          | Rate-limited REST API (5+ endpoints)                 | \<login4\>      |
| i18n                | English, French, Arabic translations                 | \<login3\>      |
| Privacy & Terms     | Legal pages (privacy policy, terms of service)       | \<login3\>      |
| WAF/ModSecurity     | Web Application Firewall with OWASP CRS              | \<login2\>      |
| Vault Secrets       | HashiCorp Vault for encrypted secrets management     | \<login2\>      |
| Monitoring          | Prometheus metrics + Grafana dashboards              | \<login2\>      |

---

## Modules

| Module                  | Type  | Points | Justification                                  | Developer(s)    |
|------------------------|-------|--------|-------------------------------------------------|-----------------|
| Use a Framework (Backend) | Major | 2    | NestJS for modular, typed backend               | \<login4\>      |
| Use a Framework (Frontend)| Major | 2   | Next.js for SSR, App Router, React 19           | \<login3\>      |
| Use a database for Backend| Minor | 1   | PostgreSQL with Prisma ORM                      | \<login4\>      |
| Standard User Management | Major | 2    | Registration, profiles, friends, blocking       | \<login3\>, \<login4\> |
| Remote Authentication (Google) | Major | 2 | Google OAuth2 integration                    | \<login4\>      |
| Two-Factor Auth (TOTP)  | Major | 2     | TOTP authenticator app support                  | \<login4\>      |
| Multiple Language Support| Minor | 1    | i18n with next-intl (EN/FR/AR)                  | \<login3\>      |
| WAF/ModSecurity          | Major | 2    | OWASP CRS, strict request filtering             | \<login2\>      |
| HashiCorp Vault          | Major | 2    | Encrypted secrets management                    | \<login2\>      |
| Monitoring (ELK/Prometheus)| Minor| 1   | Prometheus + Grafana dashboards                 | \<login2\>      |

**Total: 17 points**

---

## Individual Contributions

### \<login1\> — Project Owner
- Defined project vision and feature priorities
- Managed sprint planning and task allocation
- Coordinated team communication and deadlines

### \<login2\> — Tech Lead
- Designed system architecture and Docker infrastructure
- Implemented WAF/ModSecurity configuration
- Set up HashiCorp Vault for secrets management
- Created Prometheus/Grafana monitoring stack
- Code reviews and CI/CD pipeline

### \<login3\> — Frontend Developer
- Built all Next.js pages (auth, feed, profile, messages, explore, notifications, legal)
- Created reusable UI component library (Button, Input, Avatar)
- Implemented Tailwind design system and responsive layouts
- Set up i18n with next-intl (English, French, Arabic)
- Built Zustand state management and API client

### \<login4\> — Backend Developer
- Designed Prisma database schema (8 models)
- Implemented authentication (JWT, Google OAuth, TOTP 2FA)
- Built REST API modules (users, posts, comments, public-api)
- Created WebSocket chat gateway with Socket.io
- Set up Swagger API documentation

### \<login5\> — Full-Stack Developer
- Implemented search module with filters
- Built notification system
- Created media upload service (local storage)
- Integrated frontend infinite scroll and WebSocket hooks

---

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.io Documentation](https://socket.io/docs)
- [Docker Compose Reference](https://docs.docker.com/compose)
- [OWASP ModSecurity CRS](https://coreruleset.org/docs/)
- [HashiCorp Vault Docs](https://developer.hashicorp.com/vault/docs)
- [Prometheus Docs](https://prometheus.io/docs)

### AI Usage
AI tools were used to assist with:
- **Scaffolding**: Generating initial project structure and boilerplate files
- **Configuration**: Docker, nginx, Prometheus, and Grafana configuration templates
- **Documentation**: README structure and content drafting
- **Code patterns**: NestJS module/controller/service patterns, React component templates

All AI-generated code was reviewed, understood, and modified by team members before inclusion.
