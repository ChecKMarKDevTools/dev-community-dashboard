#!/bin/bash
set -e

# Configuration
SERVICE_NAME="forem-community-dashboard"
PROJECT_ID="anchildress1-unstable"
REGION="us-east1"
PORT="3000"
SEPARATOR="=================================================="

# Check dependencies
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed." >&2
    exit 1
fi

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

echo "$SEPARATOR"
echo "DEPLOYMENT CONFIGURATIONS"
echo "$SEPARATOR"
echo "Project: $PROJECT_ID ($PROJECT_NUMBER)"
echo "Region:  $REGION"
echo "Service: $SERVICE_NAME"
echo "$SEPARATOR"

# Enable required services
echo "Enabling required Google Cloud APIs..."
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com run.googleapis.com --project "$PROJECT_ID" --quiet

# Define Service Account
SERVICE_ACCOUNT="$SERVICE_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# Setup env reading to inject secrets
# For sensitive secrets, this correctly reads local .env and passes it securely if requested
if [[ -f ".env" ]]; then
    set -a
    . ".env"
    set +a
fi

require_env() {
    local name=$1
    if [[ -z "${!name}" ]]; then
        echo "Error: Required env var '$name' is missing or empty." >&2
        exit 1
    fi
    return 0
}

require_env "NEXT_PUBLIC_SUPABASE_URL"
require_env "SUPABASE_SERVICE_ROLE_KEY"
require_env "CRON_SECRET"

deploy_service() {
    echo ""
    echo "--- Deploying $SERVICE_NAME ---"

    # 1. Ensure Artifact Registry Repo exists
    if ! gcloud artifacts repositories describe "$SERVICE_NAME" --location="$REGION" --project "$PROJECT_ID" --quiet &>/dev/null; then
        echo "Creating Artifact Registry repository: $SERVICE_NAME..."
        gcloud artifacts repositories create "$SERVICE_NAME" \
            --repository-format=docker \
            --location="$REGION" \
            --project "$PROJECT_ID" \
            --description="Docker repository for $SERVICE_NAME"
    fi

    local image_uri="$REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/$SERVICE_NAME:latest"
    echo "Building: $image_uri"

    gcloud beta builds submit --tag "$image_uri" . --project "$PROJECT_ID"

    # 3. Deploy to Cloud Run
    echo "Deploying to Cloud Run..."
    DEPLOY_ARGS=(
        "deploy" "$SERVICE_NAME"
        "--image" "$image_uri"
        "--region" "$REGION"
        "--project" "$PROJECT_ID"
        "--allow-unauthenticated"
        "--port" "$PORT"
        "--set-env-vars" "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,CRON_SECRET=$CRON_SECRET"
    )

    gcloud run "${DEPLOY_ARGS[@]}"
    return 0
}

deploy_service

echo ""
echo "$SEPARATOR"
echo "DEPLOYMENT COMPLETE"
echo "$SEPARATOR"
