# ─── ft_transcendence Makefile ────────────────────────────────
COMPOSE = docker compose
ENV_FILE = .env

.PHONY: all up down logs build restart clean ps help

all: up


up:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "❌ .env file not found. Create it from .env.example first:"; \
		echo "   cp .env.example .env"; \
		echo "   Then fill in all the placeholder values."; \
		exit 1; \
	fi
	$(COMPOSE) up -d --build


down:
	$(COMPOSE) down


logs:
	$(COMPOSE) logs -f


build:
	$(COMPOSE) build


restart: down up


clean:
	$(COMPOSE) down -v --remove-orphans
	docker image prune -f


ps:
	$(COMPOSE) ps


seed:
	@docker exec -it ft_backend node dist/scripts/seed.js


help:
	@grep -E '^## ' Makefile | sed 's/^## //'
