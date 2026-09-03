import { Context, Hono, MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  JWT_SECRET: string;
  OPENROUTER_API_KEY: string;
  GROQ_API_KEY: string;
  OPENROUTER_MODEL?: string;
  GROQ_WHISPER_MODEL?: string;
  ALLOWED_ORIGIN?: string;
}
type Variables = { user?: AuthUser };
type AuthUser = { id: string; email: string; role: 'buyer' | 'seller' | 'admin'; name: string };
type AppEnv = { Bindings: Env; Variables: Variables };
type AppContext = Context<AppEnv>;
const app = new Hono<AppEnv>();
const uid = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => { const user = await optionalAuth(c); if (!user) return c.json({ error: 'Authentication required.' }, 401); c.set('user', user); await next(); };

app.use('*', cors({ origin: (origin, c) => origin === c.env.ALLOWED_ORIGIN || origin.includes('localhost') ? origin : c.env.ALLOWED_ORIGIN ?? '', allowHeaders: ['Authorization', 'Content-Type'], allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'] }));
app.onError((error, c) => { console.error('worker_error', { message: error.message, path: c.req.path }); return c.json({ error: 'The request could not be completed.' }, 500); });
app.get('/api/health', (c) => c.json({ ok: true, service: 'yesKaro API', at: now() }));

app.post('/api/auth/signup', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string; name?: string; role?: string }>();
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.name || !body.password || body.password.length < 8 || !['buyer', 'seller'].includes(body.role ?? '')) return c.json({ error: 'Name, valid email, role, and an 8+ character password are required.' }, 400);
  const id = uid('usr'); const passwordHash = await hashPassword(body.password);
  try { await c.env.DB.prepare('INSERT INTO users (id,email,password_hash,role,name) VALUES (?,?,?,?,?)').bind(id, email, passwordHash, body.role, body.name.trim()).run(); }
  catch { return c.json({ error: 'An account with that email already exists.' }, 409); }
  const user = { id, email, role: body.role as AuthUser['role'], name: body.name.trim() };
  return c.json({ token: await signToken(user, c.env.JWT_SECRET), user }, 201);
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const row = await c.env.DB.prepare('SELECT id,email,password_hash,role,name FROM users WHERE email=?').bind(body.email?.trim().toLowerCase()).first<AuthUser & { password_hash: string }>();
  if (!row || !body.password || !(await verifyPassword(body.password, row.password_hash))) return c.json({ error: 'Email or password is incorrect.' }, 401);
  const user: AuthUser = { id: row.id, email: row.email, role: row.role, name: row.name };
  return c.json({ token: await signToken(user, c.env.JWT_SECRET), user });
});

app.get('/api/auth/me', requireAuth, (c) => c.json({ user: c.get('user') }));

app.get('/api/projects', requireAuth, async (c) => {
  const user = c.get('user')!;
  const query = user.role === 'admin' ? 'SELECT * FROM projects ORDER BY created_at DESC' : 'SELECT * FROM projects WHERE buyer_id=? OR seller_id=? OR seller_email=? ORDER BY created_at DESC';
  const statement = c.env.DB.prepare(query); const result = user.role === 'admin' ? await statement.all() : await statement.bind(user.id, user.id, user.email).all();
  return c.json({ projects: result.results });
});
app.get('/api/projects/:id', requireAuth, async (c) => {
  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id=?').bind(c.req.param('id')).first();
  if (!project) return c.json({ error: 'Project not found.' }, 404);
  const milestones = await c.env.DB.prepare('SELECT * FROM milestones WHERE project_id=? ORDER BY order_index').bind(c.req.param('id')).all();
  return c.json({ project, milestones: milestones.results });
});
app.post('/api/projects', requireRole('buyer'), async (c) => {
  const user = c.get('user')!; const body = await c.req.json<Record<string, unknown>>();
  if (!body.title || !body.totalAmount || !body.sellerEmail) return c.json({ error: 'Title, seller email, and total amount are required.' }, 400);
  const id = uid('prj');
  await c.env.DB.prepare('INSERT INTO projects (id,buyer_id,seller_email,title,description,structured_terms_json,total_amount,currency,status) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(id, user.id, String(body.sellerEmail).toLowerCase(), body.title, body.description ?? '', JSON.stringify(body.structuredTerms ?? {}), body.totalAmount, body.currency ?? 'PKR', 'draft').run();
  await audit(c.env.DB, user.id, 'project.created', 'project', id, body); return c.json({ id }, 201);
});
app.patch('/api/projects/:id/terms', requireRole('buyer'), async (c) => { const body = await c.req.json(); await c.env.DB.prepare('UPDATE projects SET structured_terms_json=?,total_amount=?,currency=? WHERE id=? AND buyer_id=?').bind(JSON.stringify(body.structuredTerms), body.totalAmount, body.currency ?? 'PKR', c.req.param('id'), c.get('user')!.id).run(); return c.json({ ok: true }); });

app.post('/api/projects/:id/funding', requireRole('buyer'), async (c) => {
  const form = await c.req.formData(); const file = form.get('file'); if (!(file instanceof File)) return c.json({ error: 'A transfer screenshot is required.' }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ error: 'Receipt must be smaller than 10 MB.' }, 413);
  const project = await c.env.DB.prepare('SELECT total_amount FROM projects WHERE id=? AND buyer_id=?').bind(c.req.param('id'), c.get('user')!.id).first<{ total_amount: number }>(); if (!project) return c.json({ error: 'Project not found.' }, 404);
  const id = uid('fund'); const key = `funding/${c.req.param('id')}/${id}-${safeName(file.name)}`; await c.env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await c.env.DB.batch([c.env.DB.prepare('INSERT INTO funding_requests (id,project_id,amount,screenshot_url) VALUES (?,?,?,?)').bind(id, c.req.param('id'), project.total_amount, key), c.env.DB.prepare("UPDATE projects SET status='pending_admin_approval' WHERE id=?").bind(c.req.param('id'))]);
  return c.json({ id, status: 'pending' }, 201);
});
app.get('/api/files/*', requireAuth, async (c) => { const key = c.req.path.replace('/api/files/', ''); const object = await c.env.FILES.get(key); if (!object) return c.json({ error: 'File not found.' }, 404); return new Response(object.body, { headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream', 'Cache-Control': 'private, max-age=300' } }); });

app.get('/api/admin/funding-queue', requireRole('admin'), async (c) => c.json(await c.env.DB.prepare("SELECT f.*,p.title,u.name buyer_name FROM funding_requests f JOIN projects p ON p.id=f.project_id JOIN users u ON u.id=p.buyer_id WHERE f.status='pending' ORDER BY f.created_at").all()));
app.post('/api/admin/funding/:id/approve', requireRole('admin'), async (c) => reviewFunding(c, 'approved'));
app.post('/api/admin/funding/:id/reject', requireRole('admin'), async (c) => reviewFunding(c, 'rejected'));

app.post('/api/projects/:id/milestones', requireRole('buyer'), async (c) => {
  const body = await c.req.json<{ milestones?: Array<{ title: string; description?: string; amount: number; dueDate?: string }> }>(); const project = await c.env.DB.prepare('SELECT total_amount FROM projects WHERE id=? AND buyer_id=?').bind(c.req.param('id'), c.get('user')!.id).first<{ total_amount: number }>();
  if (!project || !body.milestones?.length) return c.json({ error: 'Project and milestones are required.' }, 400);
  const sum = body.milestones.reduce((value, item) => value + Number(item.amount), 0); if (Math.abs(sum - project.total_amount) > 0.01) return c.json({ error: 'Milestone amounts must equal the escrow total.' }, 400);
  await c.env.DB.batch(body.milestones.map((item, index) => c.env.DB.prepare('INSERT INTO milestones (id,project_id,title,description,amount,order_index,due_date) VALUES (?,?,?,?,?,?,?)').bind(uid('ms'), c.req.param('id'), item.title, item.description ?? '', item.amount, index, item.dueDate ?? null)));
  return c.json({ ok: true }, 201);
});
app.patch('/api/milestones/:id/submit', requireRole('seller'), async (c) => { const body = await c.req.json<{ note?: string }>(); await c.env.DB.prepare("UPDATE milestones SET status='submitted',submission_note=?,submitted_at=? WHERE id=?").bind(body.note ?? '', now(), c.req.param('id')).run(); return c.json({ ok: true }); });
app.patch('/api/milestones/:id/approve', requireRole('buyer'), async (c) => { const id = c.req.param('id'); const row = await c.env.DB.prepare('SELECT m.amount,p.seller_id FROM milestones m JOIN projects p ON p.id=m.project_id WHERE m.id=? AND p.buyer_id=?').bind(id, c.get('user')!.id).first<{ amount: number; seller_id: string }>(); if (!row?.seller_id) return c.json({ error: 'Seller must accept the project before payout.' }, 400); await c.env.DB.batch([c.env.DB.prepare("UPDATE milestones SET status='approved',approved_at=? WHERE id=?").bind(now(), id), c.env.DB.prepare('INSERT INTO payout_requests (id,milestone_id,seller_id,amount) VALUES (?,?,?,?)').bind(uid('pay'), id, row.seller_id, row.amount)]); return c.json({ ok: true }); });
app.patch('/api/milestones/:id/request-changes', requireRole('buyer'), async (c) => { const body = await c.req.json<{ note?: string }>(); await c.env.DB.prepare("UPDATE milestones SET status='changes_requested',submission_note=? WHERE id=?").bind(body.note ?? '', c.req.param('id')).run(); return c.json({ ok: true }); });

app.get('/api/admin/payout-queue', requireRole('admin'), async (c) => c.json(await c.env.DB.prepare("SELECT pr.*,m.title milestone_title,u.name seller_name FROM payout_requests pr JOIN milestones m ON m.id=pr.milestone_id JOIN users u ON u.id=pr.seller_id WHERE pr.status='pending_admin_payout'").all()));
app.post('/api/admin/payouts/:id/mark-paid', requireRole('admin'), async (c) => { const row = await c.env.DB.prepare('SELECT milestone_id FROM payout_requests WHERE id=?').bind(c.req.param('id')).first<{ milestone_id: string }>(); if (!row) return c.json({ error: 'Payout not found.' }, 404); await c.env.DB.batch([c.env.DB.prepare("UPDATE payout_requests SET status='paid',paid_at=? WHERE id=?").bind(now(), c.req.param('id')), c.env.DB.prepare("UPDATE milestones SET status='paid' WHERE id=?").bind(row.milestone_id)]); return c.json({ ok: true }); });
app.post('/api/projects/:id/seller-bank-details', requireRole('seller'), async (c) => { const user = c.get('user')!; const body = await c.req.json<{ bankName?: string; accountTitle?: string; accountNumber?: string }>(); if (!body.bankName || !body.accountTitle || !body.accountNumber) return c.json({ error: 'All bank detail fields are required.' }, 400); await c.env.DB.prepare('INSERT INTO seller_bank_details (id,user_id,project_id,bank_name,account_title,account_number) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,project_id) DO UPDATE SET bank_name=excluded.bank_name,account_title=excluded.account_title,account_number=excluded.account_number').bind(uid('bank'), user.id, c.req.param('id'), body.bankName, body.accountTitle, body.accountNumber).run(); await c.env.DB.prepare('UPDATE projects SET seller_id=? WHERE id=? AND seller_email=?').bind(user.id, c.req.param('id'), user.email).run(); return c.json({ ok: true }); });

app.post('/api/ai/transcribe', async (c) => {
  const started = Date.now(); const key = (await optionalAuth(c))?.id ?? c.req.header('CF-Connecting-IP') ?? 'anonymous';
  if (!(await consumeTranscriptionQuota(c.env.DB, key))) return c.json({ error: 'Too many transcription requests. Try again in one minute.' }, 429);
  let file: File; let language: string | undefined;
  try { const form = await c.req.formData(); const candidate = form.get('file'); if (!(candidate instanceof File)) return c.json({ error: 'Attach an audio file in the “file” field.' }, 400); file = candidate; language = String(form.get('language') ?? '') || undefined; }
  catch { return c.json({ error: 'Expected multipart/form-data with an audio file.' }, 400); }
  if (file.size > 25 * 1024 * 1024) return c.json({ error: 'Audio is too large. Recordings must be under 25 MB.' }, 413);
  if (!['ur', 'en', undefined].includes(language)) return c.json({ error: 'Language must be “ur”, “en”, or omitted.' }, 400);
  const outbound = new FormData(); outbound.append('file', file, file.name || 'project-terms.webm'); outbound.append('model', c.env.GROQ_WHISPER_MODEL ?? 'whisper-large-v3'); outbound.append('response_format', 'verbose_json'); if (language) outbound.append('language', language);
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${c.env.GROQ_API_KEY}` }, body: outbound, signal: controller.signal });
    if (!response.ok) { console.error('groq_transcription_error', { status: response.status, latencyMs: Date.now() - started }); return c.json({ error: response.status === 413 ? 'Groq rejected the file as too large.' : 'Transcription service is temporarily unavailable.' }, 502); }
    const result = await response.json<{ text?: string; language?: string }>(); if (!result.text) return c.json({ error: 'No speech was detected in the recording.' }, 422);
    console.log('groq_transcription_complete', { latencyMs: Date.now() - started, bytes: file.size, language: result.language ?? language ?? 'auto' });
    return c.json({ transcript: result.text, detectedLanguage: result.language });
  } catch (error) { console.error('groq_transcription_failure', { kind: error instanceof Error ? error.name : 'unknown', latencyMs: Date.now() - started }); return c.json({ error: error instanceof Error && error.name === 'AbortError' ? 'Transcription timed out. Please try a shorter recording.' : 'Could not transcribe the recording.' }, 504); }
  finally { clearTimeout(timeout); }
});

app.post('/api/ai/structure-terms', async (c) => { const body = await c.req.json<{ transcript?: string }>(); if (!body.transcript?.trim()) return c.json({ error: 'Transcript is required.' }, 400); const prompt = `You are a contract-structuring assistant for a Pakistani freelance escrow platform. The user described a project verbally in Urdu or English. Given this transcript, output ONLY valid JSON with keys: scope (string), deliverables (string array), exclusions (string array), deadline (string or null), totalAmount (number or null), currency (string, default PKR). Transcript: ${body.transcript}`; const result = await callOpenRouter(c.env, prompt, validateTerms); return c.json(result); });
app.post('/api/ai/suggest-milestones', async (c) => { const body = await c.req.json<{ terms: unknown; total: number; currency?: string }>(); const prompt = `Given this project's structured terms: ${JSON.stringify(body.terms)} and total amount ${body.total} ${body.currency ?? 'PKR'}, suggest 3-6 sensible milestones. Output ONLY valid JSON array of objects: { title, description, percentOfTotal }. Percentages must sum to 100.`; const result = await callOpenRouter(c.env, prompt, validateMilestones); return c.json(result); });
app.post('/api/ai/mediate-dispute', requireRole('admin'), async (c) => { const body = await c.req.json<Record<string, unknown>>(); const prompt = `You are an impartial dispute mediator for a freelance escrow platform. Milestone scope: ${body.milestoneScope}. Buyer's claim: ${body.buyerStatement}. Buyer's evidence descriptions: ${body.buyerEvidence}. Seller's claim: ${body.sellerStatement}. Seller's evidence descriptions: ${body.sellerEvidence}. Output ONLY valid JSON: { recommendation, buyerSharePercent, sellerSharePercent, reasoning, confidence }.`; const result = await callOpenRouter(c.env, prompt, validateMediation); return c.json(result); });

app.post('/api/milestones/:id/dispute', requireAuth, async (c) => { const body = await c.req.json<{ statement?: string }>(); if (!body.statement) return c.json({ error: 'A justification is required.' }, 400); const user = c.get('user')!; const id = uid('dis'); const column = user.role === 'buyer' ? 'buyer_statement' : 'seller_statement'; await c.env.DB.batch([c.env.DB.prepare(`INSERT INTO disputes (id,milestone_id,raised_by,${column}) VALUES (?,?,?,?)`).bind(id, c.req.param('id'), user.id, body.statement), c.env.DB.prepare("UPDATE milestones SET status='disputed' WHERE id=?").bind(c.req.param('id'))]); return c.json({ id }, 201); });
app.post('/api/disputes/:id/respond', requireAuth, async (c) => { const body = await c.req.json<{ statement?: string }>(); if (!body.statement) return c.json({ error: 'A response is required.' }, 400); const column = c.get('user')!.role === 'buyer' ? 'buyer_statement' : 'seller_statement'; await c.env.DB.prepare(`UPDATE disputes SET ${column}=?,status='awaiting_ai' WHERE id=?`).bind(body.statement, c.req.param('id')).run(); return c.json({ ok: true }); });
app.get('/api/admin/disputes-queue', requireRole('admin'), async (c) => c.json(await c.env.DB.prepare("SELECT d.*,m.title milestone_title,m.description milestone_scope FROM disputes d JOIN milestones m ON m.id=d.milestone_id WHERE d.status IN ('awaiting_ai','awaiting_admin')").all()));
app.post('/api/admin/disputes/:id/resolve', requireRole('admin'), async (c) => { const body = await c.req.json<{ buyerSharePercent?: number; sellerSharePercent?: number; note?: string }>(); if (Number(body.buyerSharePercent) + Number(body.sellerSharePercent) !== 100) return c.json({ error: 'Buyer and seller shares must total 100.' }, 400); await c.env.DB.prepare("UPDATE disputes SET status='resolved',final_ruling_json=?,resolved_by_admin_id=?,resolved_at=? WHERE id=?").bind(JSON.stringify(body), c.get('user')!.id, now(), c.req.param('id')).run(); return c.json({ ok: true }); });

function requireRole(role: AuthUser['role']): MiddlewareHandler<AppEnv> { return async (c, next) => { const user = await optionalAuth(c); if (!user) return c.json({ error: 'Authentication required.' }, 401); if (user.role !== role) return c.json({ error: 'You do not have permission for this action.' }, 403); c.set('user', user); await next(); }; }
async function optionalAuth(c: AppContext) { const token = c.req.header('Authorization')?.replace(/^Bearer\s+/i, ''); return token ? verifyToken(token, c.env.JWT_SECRET) : null; }
async function reviewFunding(c: AppContext, status: 'approved' | 'rejected') { const body: { note?: string } = await c.req.json<{ note?: string }>().catch(() => ({})); const row = await c.env.DB.prepare('SELECT project_id FROM funding_requests WHERE id=?').bind(c.req.param('id')).first<{ project_id: string }>(); if (!row) return c.json({ error: 'Funding request not found.' }, 404); await c.env.DB.batch([c.env.DB.prepare('UPDATE funding_requests SET status=?,admin_note=?,reviewed_by=? WHERE id=?').bind(status, body.note ?? '', c.get('user')!.id, c.req.param('id')), c.env.DB.prepare('UPDATE projects SET status=? WHERE id=?').bind(status === 'approved' ? 'funded' : 'draft', row.project_id)]); return c.json({ ok: true }); }
async function consumeTranscriptionQuota(db: D1Database, key: string) { const cutoff = Date.now() - 60_000; await db.prepare('DELETE FROM transcription_rate_limits WHERE created_at<?').bind(cutoff).run(); const row = await db.prepare('SELECT COUNT(*) count FROM transcription_rate_limits WHERE user_key=? AND created_at>=?').bind(key, cutoff).first<{ count: number }>(); if ((row?.count ?? 0) >= 5) return false; await db.prepare('INSERT INTO transcription_rate_limits (id,user_key,created_at) VALUES (?,?,?)').bind(uid('rate'), key, Date.now()).run(); return true; }
async function audit(db: D1Database, actor: string, action: string, entityType: string, entityId: string, meta: unknown) { await db.prepare('INSERT INTO audit_log (id,actor_id,action,entity_type,entity_id,meta_json) VALUES (?,?,?,?,?,?)').bind(uid('audit'), actor, action, entityType, entityId, JSON.stringify(meta)).run(); }

async function callOpenRouter<T>(env: Env, prompt: string, validate: (value: unknown) => value is T): Promise<T> {
  let correction = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://yeskaro.app', 'X-Title': 'yesKaro' }, body: JSON.stringify({ model: env.OPENROUTER_MODEL ?? 'deepseek/deepseek-r1', messages: [{ role: 'user', content: `${prompt}${correction}` }], response_format: { type: 'json_object' } }) });
    if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`); const data = await response.json<{ choices?: Array<{ message?: { content?: string } }> }>(); const text = data.choices?.[0]?.message?.content ?? '';
    try { const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '')); if (validate(parsed)) return parsed; } catch { /* retry once */ }
    correction = '\nYour previous answer was invalid. Return JSON only, exactly matching the requested shape.';
  }
  throw new Error('AI response failed JSON validation');
}
function validateTerms(value: unknown): value is { scope: string; deliverables: string[]; exclusions: string[]; deadline: string | null; totalAmount: number | null; currency: string } { const v = value as Record<string, unknown>; return Boolean(v && typeof v.scope === 'string' && Array.isArray(v.deliverables) && Array.isArray(v.exclusions) && typeof v.currency === 'string'); }
function validateMilestones(value: unknown): value is Array<{ title: string; description: string; percentOfTotal: number }> { if (!Array.isArray(value) || value.length < 3 || value.length > 6) return false; return value.every((v) => typeof v.title === 'string' && typeof v.description === 'string' && typeof v.percentOfTotal === 'number') && Math.abs(value.reduce((sum, v) => sum + v.percentOfTotal, 0) - 100) < 0.01; }
function validateMediation(value: unknown): value is { recommendation: string; buyerSharePercent: number; sellerSharePercent: number; reasoning: string; confidence: number } { const v = value as Record<string, unknown>; return Boolean(v && ['full_release_to_seller', 'full_refund_to_buyer', 'partial_split'].includes(String(v.recommendation)) && typeof v.buyerSharePercent === 'number' && typeof v.sellerSharePercent === 'number' && Number(v.buyerSharePercent) + Number(v.sellerSharePercent) === 100 && typeof v.reasoning === 'string' && typeof v.confidence === 'number'); }

async function hashPassword(password: string) { const salt = crypto.getRandomValues(new Uint8Array(16)); const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' }, key, 256); return `pbkdf2:${toBase64(salt)}:${toBase64(new Uint8Array(hash))}`; }
async function verifyPassword(password: string, stored: string) { if (stored.startsWith('demo:')) return timingSafe(password, stored.slice(5)); const [, salt64, expected] = stored.split(':'); if (!salt64 || !expected) return false; const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); const actual = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromBase64(salt64), iterations: 150_000, hash: 'SHA-256' }, key, 256); return timingSafe(toBase64(new Uint8Array(actual)), expected); }
async function signToken(user: AuthUser, secret: string) { const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const payload = b64url(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })); const signature = await hmac(`${header}.${payload}`, secret); return `${header}.${payload}.${signature}`; }
async function verifyToken(token: string, secret: string): Promise<AuthUser | null> { try { const [header, payload, signature] = token.split('.'); if (!header || !payload || !signature || !timingSafe(await hmac(`${header}.${payload}`, secret), signature)) return null; const value = JSON.parse(new TextDecoder().decode(fromBase64(payload.replaceAll('-', '+').replaceAll('_', '/')))) as AuthUser & { exp: number }; return value.exp > Date.now() / 1000 ? value : null; } catch { return null; } }
async function hmac(value: string, secret: string) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))); }
function b64url(value: string | Uint8Array) { return toBase64(typeof value === 'string' ? new TextEncoder().encode(value) : value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
function toBase64(bytes: Uint8Array) { let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary); }
function fromBase64(value: string) { const padded = value.padEnd(Math.ceil(value.length / 4) * 4, '='); return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)); }
function timingSafe(a: string, b: string) { if (a.length !== b.length) return false; let result = 0; for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i); return result === 0; }
function safeName(value: string) { return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100); }

export default app;
