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
    expect(res.body.priority).toBe('medium');
    expect(res.body.status).toBe('not_started');
    expect(res.body.completedAt).toBeNull();
    expect(res.body.id).toBeDefined();
  });

  test('PUT /api/tasks/:id records completion time', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .send({ title: 'Timed task' });
    const id = create.body.id;

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ completed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).toBeDefined();
  });

  test('PUT /api/tasks/:id moves unchecked done task to in progress', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .send({ title: 'Resume task' });
    const id = create.body.id;

    await request(app)
      .put(`/api/tasks/${id}`)
      .send({ completed: true });

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ completed: false });

    expect(res.statusCode).toBe(200);
    expect(res.body.completed).toBe(false);
    expect(res.body.status).toBe('in_progress');
    expect(res.body.completedAt).toBeNull();
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
