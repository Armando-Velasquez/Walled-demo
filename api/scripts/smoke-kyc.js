import { pool } from '../src/db.js';
import { getKycProfile, listKycForAdmin, reviewKycForAdmin, submitKycProfile } from '../src/repository.js';

const email = `kyc-smoke-${Date.now()}@example.test`;
let userId;

try {
  const [[admin]] = await pool.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  if (!admin) throw new Error('Se necesita una cuenta administrativa para la prueba KYC');
  const [created] = await pool.query(
    "INSERT INTO users (display_name, email, password_hash, role, email_verified_at) VALUES ('KYC Smoke', ?, 'not-used', 'user', NOW())",
    [email],
  );
  userId = created.insertId;
  await submitKycProfile(userId, {
    fullLegalName: 'KYC Smoke Test', birthDate: '1990-01-01', nationality: 'Ecuatoriana',
    residenceCountry: 'Ecuador', residentialAddress: 'Dirección de prueba 123',
    documentType: 'national_id', documentNumber: 'TEST-12345', documentReference: 'smoke-document',
  });
  const pending = await getKycProfile(userId);
  if (pending.status !== 'pending') throw new Error('La solicitud no quedó pendiente');
  if (!(await listKycForAdmin()).some((item) => Number(item.userId) === Number(userId))) throw new Error('La bandeja administrativa no recibió la solicitud');
  await reviewKycForAdmin({ userId, reviewerId: admin.id, status: 'approved', riskLevel: 'low', reviewNote: 'Prueba automática' });
  const approved = await getKycProfile(userId);
  if (approved.status !== 'approved' || approved.riskLevel !== 'low') throw new Error('La decisión KYC no se guardó');
  console.log('Flujo KYC verificado: envío, bandeja administrativa y aprobación.');
} finally {
  await pool.query('DELETE FROM email_outbox WHERE to_email = ?', [email]);
  if (userId) await pool.query('DELETE FROM users WHERE id = ?', [userId]);
  await pool.end();
}
