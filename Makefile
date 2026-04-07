# ─── ft_transcendence Makefile ────────────────────────────────
COMPOSE = docker compose
ENV_FILE = .env

.PHONY: all up down logs build restart clean ps help

all: up

## up        — build (if needed) and start all services in background
up:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "❌ .env file not found. Create it from .env.example first:"; \
		echo "   cp .env.example .env"; \
		echo "   Then fill in all the placeholder values."; \
		exit 1; \
	fi
	$(COMPOSE) up -d --build

## down      — stop and remove all containers
down:
	$(COMPOSE) down

## logs      — follow logs from all services (Ctrl-C to quit)
logs:
	$(COMPOSE) logs -f

## build     — rebuild all images without starting containers
build:
	$(COMPOSE) build

## restart   — stop then start all services
restart: down up

## clean     — remove containers, volumes, and orphan networks
clean:
	$(COMPOSE) down -v --remove-orphans
	docker image prune -f

## ps        — list running containers
ps:
	$(COMPOSE) ps

## seed      — run database seeders to create test users and friendships
seed:
	@docker exec -it ft_backend node dist/scripts/seed.js

## help      — show available targets
help:
	@grep -E '^## ' Makefile | sed 's/^## //'
