# Deploy de Wallet REST

El workflow `.github/workflows/backend.yml` publica la API en el VPS siguiendo el patrón de los demás proyectos: GitHub Actions, SSH, systemd y Nginx. El dominio configurado es `wallet-rest.armandovelasquez.com`; la API escucha por defecto en el puerto interno `3100`.

La instalación privada queda organizada así:

```text
/var/www/PRIVATE/WALLET/
├── backend/   Código de la API, dependencias y .env
├── database/  Esquema SQL usado por el inicializador
└── logs/      Salida estándar y errores de systemd
```

## Configuración de GitHub

Crea un environment llamado `production` y agrega:

Variables:

- `PORT`: opcional; usa `3100` cuando no está definida
- `DB_HOST`: normalmente `127.0.0.1`
- `DB_PORT`: normalmente `3306`
- `DB_NAME`: por ejemplo `wallet_prod`
- `DB_USER`: usuario MySQL/MariaDB con permisos sobre esa base
- `ADMIN_DISPLAY_NAME`: nombre de la cuenta administradora
- `ADMIN_EMAIL`: correo de acceso de la cuenta administradora
- `SMTP_SERVICE`: `gmail` mientras se utilice una clave de aplicación de Google
- `SMTP_HOST`: vacío cuando se usa `SMTP_SERVICE=gmail`
- `SMTP_PORT`: `587`
- `SMTP_SECURE`: `false` para STARTTLS en el puerto 587
- `SMTP_USER`: cuenta de correo que enviará los mensajes
- `MAIL_FROM`: remitente visible; puede ser la misma cuenta SMTP

Secrets:

- `SSH_PRIVATE_KEY`: clave SSH privada del deploy
- `SERVER_HOST`: IP o host SSH del VPS
- `SERVER_USER`: usuario SSH
- `DB_PASSW`: contraseña de MySQL/MariaDB
- `ADMIN_PASSWORD`: contraseña inicial del administrador, mínimo 12 caracteres
- `ADMIN_PIN`: PIN inicial de 6 dígitos
- `SMTP_PASS`: clave de aplicación del proveedor, nunca la contraseña normal de la cuenta
- `EMAIL_TOKEN_SECRET`: secreto aleatorio largo para proteger los códigos de confirmación

El inicializador de producción es idempotente: crea tablas, actualiza el catálogo de activos y dApps, y crea el administrador solo si no existe. No carga la cuenta demo, no crea transacciones ficticias y no reemplaza saldos ni contraseñas existentes.

La base y el usuario deben existir antes del primer deploy. Un ejemplo para MariaDB/MySQL es:

```sql
CREATE DATABASE wallet_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wallet_app'@'127.0.0.1' IDENTIFIED BY 'UNA_CLAVE_SEGURA';
GRANT ALL PRIVILEGES ON wallet_prod.* TO 'wallet_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

## DNS y HTTPS

El registro DNS tipo `A` de `wallet-rest.armandovelasquez.com` debe apuntar a la IP del VPS. Después del primer deploy, ejecuta una sola vez en el servidor:

```bash
sudo certbot --nginx -d wallet-rest.armandovelasquez.com
```

Los deploys posteriores conservan el archivo de Nginx para no eliminar la configuración HTTPS creada por Certbot.
El proxy lee el puerto desde `/etc/nginx/snippets/wallet-rest-upstream.conf`, que se actualiza en cada deploy según la variable `PORT`.

## Operación

```bash
sudo systemctl status wallet-rest.service
sudo journalctl -u wallet-rest.service -f
curl https://wallet-rest.armandovelasquez.com/health
```

El deploy se ejecuta al hacer push a `main` cuando cambia el backend, la base de datos o el propio workflow. También se puede iniciar manualmente desde GitHub Actions.

Para que una compilación Android use producción, compílala definiendo:

```text
EXPO_PUBLIC_API_URL=https://wallet-rest.armandovelasquez.com
```
