# Guía de continuidad

## Estado actual

La entrega Android está funcional como entorno local. El diseño principal reproduce el prototipo de Wallet y ya cuenta con registro, login, sesión persistente, cierre de sesión, animaciones, transferencias internas y operaciones persistidas en MySQL/MariaDB. No hay conexiones financieras ni blockchain reales.

El APK local actualizado queda en `artifacts/Wallet-demo-android.apk`. El emulador usado es `Medium_Phone_API_36.1` y se comunica con la API del host mediante `http://10.0.2.2:4100`. Producción recompila la app contra HTTPS y publica el APK en `https://wallet-rest.armandovelasquez.com/downloads/wallet-android.apk`.

## Arranque rápido

Desde `E:\PROJECTS\Wallet`:

```powershell
npm install
npm run db:init
npm start --workspace api
```

En otra terminal, para desarrollo móvil:

```powershell
cd mobile
npm start
```

La API debe responder en `http://127.0.0.1:4100/health`. En Android Emulator la app usa `http://10.0.2.2:4100`.

## Credenciales demo

- Correo: `demo@wallet.local`
- Contraseña: `Demo1234!`
- PIN: `123456`

Las cuentas registradas desde la app comienzan con todos los activos en cero. La cuenta principal es administradora y puede acreditarles saldo desde **Perfil → Administrar cuentas**.

## Estructura relevante

- `mobile/src/App.tsx`: estado global, navegación y enlace entre pantallas y API.
- `mobile/src/screens.tsx`: todas las pantallas visuales y estados de espera/éxito/error.
- `mobile/src/api.ts`: cliente HTTP, token Bearer y SecureStore.
- `api/src/app.js`: rutas, validación, middleware de autenticación y retraso simulado.
- `api/src/auth.js`: scrypt, creación/revocación de sesiones y middleware Bearer.
- `api/src/repository.js`: consultas por wallet, transferencias internas y acreditaciones administrativas atómicas.
- `database/schema.sql`: usuarios, wallets, balances, operaciones, sesiones y dApps.
- `database/seed.sql`: cuenta y portafolio demo.

## Compilar Android

El proyecto utiliza Android SDK local y el JBR de Android Studio. Después de cambiar dependencias nativas:

```powershell
cd mobile
npx expo prebuild --platform android --no-install
cd android
.\gradlew.bat assembleRelease
```

`prebuild` regenera `mobile/android`; después hay que confirmar que:

- `mobile/android/local.properties` contiene la ruta del Android SDK.
- `JAVA_HOME` apunta al JBR de Android Studio durante la compilación local. No se guarda `org.gradle.java.home` en `gradle.properties`, porque una ruta de Windows rompería el runner Ubuntu de GitHub Actions.
- El `<application>` del manifest permite `android:usesCleartextTraffic="true"` mientras se use la API HTTP local.

Copiar el resultado desde `mobile/android/app/build/outputs/apk/release/app-release.apk` hacia `artifacts/Wallet-demo-android.apk`.

## Pruebas realizadas

- Validación JavaScript/TypeScript con `npm run check`.
- Registro de una cuenta nueva.
- Login con la cuenta recién registrada y con la cuenta demo.
- Registro con balance total cero.
- Acreditación administrativa de 10 USDT y transferencia interna de 3 USDT entre dos cuentas; saldos finales verificados en 7 y 3 USDT.
- Swap y compra con actualización de balance e historial.
- Restauración de la base con `npm run db:reset` después de las pruebas.
- Instalación y apertura del APK release en Android Emulator.

## Límites intencionales y siguiente etapa

- Todo saldo y movimiento es ficticio; no se deben presentar como dinero o cripto reales.
- El APK release actual usa firma local de demostración, no una clave de Google Play.
- Para un teléfono físico, recompilar con `EXPO_PUBLIC_API_URL=http://IP_DE_LA_PC:4100` y permitir el puerto 4100 en la red local.
- Antes de producción: HTTPS, proveedor de identidad, recuperación de contraseña, verificación de correo, rate limiting, auditoría, gestión real de claves, idempotencia, KYC/AML donde aplique y pruebas de seguridad.
- iOS todavía no se ha generado; React Native permite compartir la mayor parte del código cuando se inicie esa fase.

## Deploy de la API

El backend se despliega mediante `.github/workflows/backend.yml` en `wallet-rest.armandovelasquez.com`, con systemd y Nginx. La API vive directamente en `/var/www/PRIVATE/WALLET/backend` —incluidos `src`, `scripts`, `package.json` y `.env`— y usa el puerto `3100` por defecto; `PORT` puede cambiarlo desde GitHub Actions. La configuración requerida y los pasos de DNS, MySQL y Certbot están documentados en `docs/DEPLOY.md`. El flujo de producción usa `npm run db:init:production`: no carga el usuario demo ni movimientos iniciales y conserva los saldos existentes.

El mismo workflow compila `mobile/android` con `EXPO_PUBLIC_API_URL=https://wallet-rest.armandovelasquez.com`, copia el resultado a `backend/public/downloads/Wallet-Android.apk` y lo expone mediante la ruta pública `/downloads/wallet-android.apk`. La ruta está declarada antes del middleware de autenticación, por lo que no requiere iniciar sesión.

## Correos y verificación de cuentas

- El registro crea la cuenta sin sesión y envía un código de seis dígitos que caduca en 15 minutos.
- La app muestra `VerifyEmailScreen`; al confirmar el código recibe y guarda la primera sesión.
- Un correo no confirmado no puede iniciar sesión. Se puede reenviar un código después de 60 segundos.
- Login, envío, recepción, compra, swap y acreditación administrativa encolan avisos en `email_outbox`.
- `api/src/mailer.js` procesa la bandeja cada cinco segundos y reintenta hasta seis veces.
- En local, `MAIL_MODE=console` imprime el correo y el código en la terminal. Producción usa Nodemailer con `MAIL_MODE=smtp` y `SMTP_PASS` como secreto de GitHub.
- La migración se aplica con `npm run db:init`; en producción, `npm run db:init:production` la ejecuta automáticamente durante el deploy.
