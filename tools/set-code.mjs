// Öqituvçi kodini sozlaş: node tools/set-code.mjs [KOD]  (KOD berilmasa tasodifiy kod yaratiladi)
import { pbkdf2Sync, randomBytes, randomInt } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const gen = () => Array.from({ length: 8 }, () => A[randomInt(A.length)]).join('');
const norm = s => String(s).toUpperCase().replace(/[\s-]/g, '');
const code = norm(process.argv[2] || gen());
if (code.length < 8) { console.error('Kod kamida 8 belgi bölishi kerak (qisqa kod tez buziladi)'); process.exit(1); }
const salt = randomBytes(16).toString('hex'), iter = 200000;
const hash = pbkdf2Sync(code, Buffer.from(salt, 'hex'), iter, 32, 'sha256').toString('hex');
writeFileSync(new URL('../teacher.json', import.meta.url), JSON.stringify({ salt, hash, iter }));
console.log('KOD:', code.slice(0, 4) + '-' + code.slice(4));
