 const request = require('supertest');
const app = require('../index');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/tasks.json');

beforeEach(() => {
  fs.writeFileSync(dataPath, '[]', 'utf8');
});

describe('Task API', () => {
  test('POST /api/tasks creates a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task' });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test task');
    expect(res.body.completed).toBe(false);
    expect(res.body.id).toBeDefined();
  });

  test('DELETE /api/tasks/:id deletes a task', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task to delete' });
    const id = create.body.id;
    const res = await request(app).delete(`/api/tasks/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Task deleted');
  });
});
