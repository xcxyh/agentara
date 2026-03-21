install:
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
