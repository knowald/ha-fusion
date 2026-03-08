default:
    @just --list

up *args:
    docker compose -f docker-compose.dev.yml up {{args}}