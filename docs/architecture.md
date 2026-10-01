# Arquitectura de Wallet demo

## Alcance

Esta entrega es una simulación local de una wallet móvil. No custodia fondos, no firma transacciones y no se conecta con bancos, exchanges ni redes blockchain. El objetivo es validar el diseño, la navegación y los flujos antes de integrar proveedores reales.

## Capas

- `mobile/`: aplicación React Native/Expo para Android. Contiene navegación, componentes visuales, sesión guardada con SecureStore y acceso a la API.
- `api/`: API Express. Valida operaciones y ejecuta cambios atómicos en MySQL/MariaDB.
- `database/`: esquema y datos iniciales ficticios.
- `artifacts/`: APK instalable generado para demostración.

## Flujo de pantallas

1. Splash y onboarding.
2. Registro, confirmación obligatoria por correo o inicio de sesión persistente.
3. Creación automática de una wallet ficticia por cuenta y PIN cifrado.
4. Portafolio principal y detalle de activos.
5. Transferir activos entre cuentas por correo o dirección, comprar e intercambiar.
6. Administrar usuarios y acreditar saldos desde la cuenta principal.
7. Explorar dApps, actividad, perfil y cierre de sesión.

## API local

- `GET /health`: estado del servicio.
- `POST /api/v1/auth/register`: crea usuario, wallet y balances en cero; encola el código de confirmación.
- `POST /api/v1/auth/login`: valida contraseña y crea sesión.
- `POST /api/v1/auth/verify-email`: confirma el correo y crea la primera sesión.
- `POST /api/v1/auth/resend-verification`: invalida el código anterior y encola uno nuevo.
- `GET /api/v1/auth/me`: valida la sesión actual.
- `POST /api/v1/auth/logout`: revoca la sesión.
- `GET /api/v1/bootstrap`: perfil, balance, activos y actividad inicial.
- `GET /api/v1/assets/:symbol`: detalle de un activo.
- `POST /api/v1/transactions/send`: transferencia interna atómica entre dos wallets.
- `POST /api/v1/transactions/buy`: compra simulada.
- `POST /api/v1/swap`: intercambio simulado.
- `PUT /api/v1/onboarding`: finalización del onboarding.
- `GET /api/v1/admin/users`: listado de usuarios, sólo para administradores.
- `POST /api/v1/admin/fund`: acreditación administrativa de saldo.

Todas las rutas bajo `/api/v1`, excepto registro, login y confirmación de correo, requieren `Authorization: Bearer <token>`. Las contraseñas y PIN se guardan con scrypt; en la base sólo se almacena el hash SHA-256 de cada token de sesión.

Los correos salen mediante Nodemailer y SMTP. La clave de aplicación vive exclusivamente en `SMTP_PASS`. Los códigos de seis dígitos caducan en 15 minutos, permiten cinco intentos y se guardan como HMAC, no en texto claro. Registro, login y movimientos generan mensajes en `email_outbox`; un worker los entrega y reintenta temporalmente si el proveedor SMTP falla.

Las operaciones que modifican balances usan transacciones de base de datos para evitar actualizaciones parciales. En una transferencia se descuenta al emisor y se acredita al receptor dentro de la misma transacción SQL, registrando un movimiento para cada parte. La API añade una espera corta para representar el procesamiento y la app bloquea el botón mientras muestra el estado correspondiente.

Las cuentas nuevas reciben una fila de balance por activo con valor cero. La cuenta semilla tiene rol `admin`; las demás cuentas reciben rol `user`.

## Movimiento visual

Las pantallas entran con una transición combinada de desplazamiento y opacidad. Los botones principales tienen respuesta elástica al presionarlos y el logo mantiene una pulsación sutil continua. Todo se implementa con `Animated` y `useNativeDriver` de React Native.

## Sustitución futura por integraciones reales

Los proveedores externos deberán incorporarse detrás de una capa de servicios del backend. La app móvil debe seguir consumiendo la API propia y nunca recibir secretos de proveedores. Antes de producción serán necesarios autenticación real, cifrado de secretos, gestión segura de claves, idempotencia, auditoría, límites, controles KYC/AML según jurisdicción y pruebas de seguridad.

## Datos de demostración

La base `wallet_demo` contiene únicamente información ficticia. Se puede restaurar al estado inicial con `npm run db:reset`. El PIN `123456` es exclusivamente demostrativo.
