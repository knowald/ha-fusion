default:
    @just --list

up:
    docker compose -f docker-compose.dev.yml up