check-bun:
	@which bun > /dev/null 2>&1 || (echo "Bun not found, installing..." && curl -fsSL https://bun.sh/install | bash)

install: check-bun
	@echo "Installing dependencies..."
	bun install
	@echo ""
	@echo "Installing web dependencies..."
	cd web && bun install

dev:
	bun dev

up:
	@bash scripts/agentara-stack.sh start

down:
	@bash scripts/agentara-stack.sh stop
