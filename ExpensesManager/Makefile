# Makefile — atajos para el día a día

.PHONY: dev prod down logs shell-api shell-db migrate studio build clean

# ─── DESARROLLO ───────────────────────────────────────────────────────────────

dev:                          ## Levanta el entorno de desarrollo
	docker compose up --build

dev-d:                        ## Levanta en background
	docker compose up --build -d

down:                         ## Apaga todos los contenedores
	docker compose down

down-v:                       ## Apaga y borra volúmenes (⚠ borra la DB)
	docker compose down -v

logs:                         ## Muestra logs de todos los servicios
	docker compose logs -f

logs-api:                     ## Logs solo del backend
	docker compose logs -f backend

logs-db:                      ## Logs solo de MySQL
	docker compose logs -f db

# ─── PRODUCCIÓN ───────────────────────────────────────────────────────────────

prod:                         ## Levanta en modo producción
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# ─── BASE DE DATOS ────────────────────────────────────────────────────────────

migrate:                      ## Corre migraciones de Prisma
	docker compose exec backend npx prisma migrate dev

migrate-prod:                 ## Aplica migraciones en producción
	docker compose exec backend npx prisma migrate deploy

studio:                       ## Abre Prisma Studio en el browser
	docker compose exec backend npx prisma studio

# ─── SHELLS ───────────────────────────────────────────────────────────────────

shell-api:                    ## Shell dentro del contenedor del backend
	docker compose exec backend sh

shell-db:                     ## MySQL CLI dentro del contenedor de la DB
	docker compose exec db mysql -u $${MYSQL_USER} -p$${MYSQL_PASSWORD} $${MYSQL_DATABASE}

# ─── BUILD / CLEAN ────────────────────────────────────────────────────────────

build:                        ## Reconstruye todas las imágenes sin caché
	docker compose build --no-cache

clean:                        ## Limpia imágenes y volúmenes huérfanos
	docker system prune -f
	docker volume prune -f
