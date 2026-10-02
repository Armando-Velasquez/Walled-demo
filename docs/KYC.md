# Flujo KYC de Wallet

KYC (`Know Your Customer`) es el proceso de identificación y verificación de una persona antes o durante una relación financiera. Es diferente de confirmar el correo: el correo prueba control de una dirección; KYC busca formar una base razonable para conocer la identidad real del cliente.

## Flujo implementado

1. El usuario abre `Perfil > Verificación de identidad`.
2. Registra nombre legal, nacimiento, nacionalidad, residencia, dirección y documento.
3. La solicitud queda `pending` y no puede editarse mientras está en revisión.
4. Administración abre `Administración > Revisión KYC`.
5. El administrador busca una solicitud, revisa sus datos, asigna riesgo bajo/medio/alto y aprueba o rechaza.
6. La decisión conserva revisor, fecha y observación, y genera un correo al usuario.
7. Una solicitud rechazada puede corregirse y enviarse nuevamente.

Estados: `not_submitted`, `pending`, `approved`, `rejected`.

## Persistencia y API

- Tabla MySQL: `kyc_profiles`.
- Usuario: `GET /api/v1/kyc`, `POST /api/v1/kyc`.
- Administración: `GET /api/v1/admin/kyc`, `POST /api/v1/admin/kyc/:id/review`.
- Las rutas administrativas requieren una sesión con rol `admin`.
- La eliminación de una cuenta elimina su KYC mediante la clave foránea `ON DELETE CASCADE`.

## Alcance actual

El flujo, estados, auditoría y correos son reales dentro de la base de datos del proyecto. La captura del documento, prueba de vida, biometría, autenticidad del documento, consulta de sanciones y PEP son simuladas; todavía no existe conexión con un proveedor externo ni con fuentes gubernamentales.

Antes de manejar identidades reales se debe elegir jurisdicción y proveedor, cifrar los datos sensibles a nivel de aplicación, definir retención/borrado, almacenar imágenes fuera de MySQL en almacenamiento privado, usar URL firmadas, registrar consentimientos y someter el flujo a revisión legal y de seguridad.

## Referencias de diseño

- FATF, Recomendación 10 y guía de identidad digital: enfoque basado en riesgo y fuentes confiables e independientes.
- FinCEN, Customer Identification Program: nombre, fecha de nacimiento, dirección, número de identificación, verificación y conservación de registros como referencia regulatoria de EE. UU.

Los requisitos exactos dependen del país en que opere el producto; esta implementación no sustituye asesoría legal ni constituye por sí sola cumplimiento normativo.
