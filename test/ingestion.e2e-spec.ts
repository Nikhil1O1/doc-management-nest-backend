import { httpServer } from './setup-e2e';

async function loginAdmin() {
  const res = await httpServer()
    .post('/api/v1/auth/login')
    .send({ email: 'admin@g.com', password: 'admin123' });
  return res.body.access_token as string;
}

describe('Ingestion Jobs (e2e)', () => {
  let token: string;
  let documentId: string;
  let jobId: string;

  beforeAll(async () => {
    token = await loginAdmin();

    // Upload a document to use for ingestion
    const docRes = await httpServer()
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('Ingestion content', 'utf8'), 'ingestion.txt')
      .field('title', 'Doc for Ingestion')
      .field('documentType', 'text');

    documentId = docRes.body.id;
  });

  it('should create a single-document ingestion job (positive)', async () => {
    const res = await httpServer()
      .post('/api/v1/ingestion/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'E2E Ingestion Job',
        ingestionType: 'single_document',
        documentId,
        configuration: {
          embedding_model: 'text-embedding-ada-002',
          chunk_size: 500,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    jobId = res.body.id;
  });

  it('should fail to create ingestion job with invalid type (negative)', async () => {
    const res = await httpServer()
      .post('/api/v1/ingestion/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ingestionType: 'invalid_type',
      });

    expect(res.status).toBe(400);
  });

  it('should get the ingestion job by ID (positive)', async () => {
    const res = await httpServer()
      .get(`/api/v1/ingestion/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(jobId);
  });
}); 