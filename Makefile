.PHONY: help install test lint format security ai-checks

help:  ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install:  ## Install development dependencies
	npm install

test:  ## Run unit and integration tests with coverage
	npm run test:coverage

lint:  ## Run linting checks (ESLint)
	npm run lint

format:  ## Format code with Prettier
	npm run format

security:  ## Run security audit
	npm audit

ai-checks:  ## Single command: format → lint → security → test
	@set -e; \
	echo "🔍 format → lint → security → test"; \
	$(MAKE) format && echo "  ✓ format" || (echo "  ✗ format"; exit 1); \
	$(MAKE) lint && echo "  ✓ lint" || (echo "  ✗ lint"; exit 1); \
	$(MAKE) security && echo "  ✓ security" || (echo "  ✗ security"; exit 1); \
	$(MAKE) test && echo "  ✓ test" || (echo "  ✗ test"; exit 1); \
	echo "✅ Ready to commit."

clean:  ## Clean up generated files
	rm -rf .next
	rm -rf node_modules
	rm -rf coverage
