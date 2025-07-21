import { httpServer } from './setup-e2e';

// Utility to get JWT token for admin user
async function loginAdmin() {
  const res = await httpServer()
    .post('/api/v1/auth/login')
    .send({ email: 'admin@g.com', password: 'admin123' });
  return res.body.access_token as string;
}

describe('Documents - Upload (e2e)', () => {
  let token: string;

  beforeAll(async () => {
    token = await loginAdmin();
  });

  it('should upload a document successfully (positive)', async () => {
    const res = await httpServer()
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('Test content', 'utf8'), 'test.txt')
      .field('title', 'E2E Upload Test')
      .field('description', 'Testing upload through e2e')
      .field('documentType', 'text');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('E2E Upload Test');
  });

  it('should reject upload without auth token (negative)', async () => {
    const res = await httpServer()
      .post('/api/v1/documents/upload')
      .attach('file', Buffer.from('No auth', 'utf8'), 'noauth.txt')
      .field('title', 'No Auth');

    expect(res.status).toBe(401);
  });

  it('should reject upload when file is missing (negative)', async () => {
    const res = await httpServer()
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Missing File');

    expect(res.status).toBe(400);
  });
}); 