#!/bin/bash

# migrate-api-v2.sh - Script to run migrations for API v2 in Docker container

set -e  # Exit on any error

# Function to display usage
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help     Display this help message"
    echo "  --dev          Run development migrations (prisma migrate dev)"
    echo "  --deploy       Run production migrations (prisma migrate deploy) [default]"
    echo "  --studio       Start Prisma Studio"
    echo "  --reset        Reset the database (WARNING: This will delete all data)"
    echo "  --seed         Run the app store seed command"
    exit 1
}

# Default values
MIGRATION_MODE="deploy"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        --dev)
            MIGRATION_MODE="dev"
            shift
            ;;
        --deploy)
            MIGRATION_MODE="deploy"
            shift
            ;;
        --studio)
            MIGRATION_MODE="studio"
            shift
            ;;
        --reset)
            MIGRATION_MODE="reset"
            shift
            ;;
        --seed)
            MIGRATION_MODE="seed"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

echo "Starting API v2 migration process (mode: $MIGRATION_MODE)..."

# Check if docker-compose file exists
if [ ! -f "docker-compose.api-v2.yml" ]; then
    echo "Error: docker-compose.api-v2.yml not found!"
    exit 1
fi

# Bring up the services if they're not already running
echo "Ensuring services are up..."
docker compose -f docker-compose.api-v2.yml up -d

# Wait a moment for services to start
sleep 5

# Execute the appropriate command based on mode
case $MIGRATION_MODE in
    dev)
        echo "Running development migrations..."
        docker compose -f docker-compose.api-v2.yml exec -e DATABASE_DIRECT_URL=postgresql://postgres:postgres@database:5432/calendso calcom-api-v2 yarn prisma migrate dev
        ;;
    deploy)
        echo "Running production migrations..."
        docker compose -f docker-compose.api-v2.yml exec -e DATABASE_DIRECT_URL=postgresql://postgres:postgres@database:5432/calendso calcom-api-v2 yarn prisma migrate deploy
        ;;
    studio)
        echo "Starting Prisma Studio..."
        docker compose -f docker-compose.api-v2.yml exec -e DATABASE_DIRECT_URL=postgresql://postgres:postgres@database:5432/calendso calcom-api-v2 yarn prisma studio
        ;;
    reset)
        echo "WARNING: This will delete all data in the database!"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Resetting database..."
            # Stop and remove the containers and volumes
            docker compose -f docker-compose.api-v2.yml down -v
            # Restart the services
            docker compose -f docker-compose.api-v2.yml up -d
            # Wait for database to be ready
            sleep 10
            # Run migrations and seed
            docker compose -f docker-compose.api-v2.yml exec -e DATABASE_DIRECT_URL=postgresql://postgres:postgres@database:5432/calendso calcom-api-v2 yarn workspace @calcom/prisma db-deploy
            docker compose -f docker-compose.api-v2.yml exec -e DATABASE_DIRECT_URL=postgresql://postgres:postgres@database:5432/calendso calcom-api-v2 yarn workspace @calcom/prisma seed-app-store
        else
            echo "Database reset cancelled."
            exit 0
        fi
        ;;
    seed)
        echo "Running app store seed command..."
        docker compose -f docker-compose.api-v2.yml exec -e DATABASE_DIRECT_URL=postgresql://postgres:postgres@database:5432/calendso calcom-api-v2 yarn workspace @calcom/prisma seed-app-store
        ;;
esac

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "Operation completed successfully!"
else
    echo "Error: Operation failed!"
    exit 1
fi

echo "API v2 migration process finished."