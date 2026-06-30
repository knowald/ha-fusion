default:
    @just --list

up *args:
    docker compose -f docker-compose.dev.yml up {{args}}

backup-dashboard:
    @mkdir -p data/backups
    @cp data/dashboard.yaml "data/backups/dashboard-$(date +%Y%m%d-%H%M%S).yaml"
    @echo "Backed up to data/backups/dashboard-$(date +%Y%m%d-%H%M%S).yaml"