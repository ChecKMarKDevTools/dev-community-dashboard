# AI Rules for forem-community-dashboard

- **Inline Overrides**: All inline overrides MUST require a comment explaining why the override exists.
- **Preference**: Prefer proper configuration files (e.g., `.hadolint.yaml`, `.stylelintrc`) to inline overrides when feasible.
- **Deployment**: This project uses Google Cloud Run for deployment (`deploy.sh`). Always consider Cloud Run specs for environment variables and build steps.
