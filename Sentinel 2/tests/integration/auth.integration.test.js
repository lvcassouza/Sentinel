process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'
process.env.DB_HOST = process.env.DB_HOST || 'localhost'
process.env.DB_PORT = process.env.DB_PORT || '5432'
process.env.DB_USER = process.env.DB_USER || 'postgres'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres'
process.env.DB_DATABASE = process.env.DB_DATABASE || 'auth_db'

const run = process.env.RUN_DB_INTEGRATION === '1'

const request = require('supertest')
const app = require('../../server')
const { pool, initDb } = require('../../config/db')

;(run ? describe : describe.skip)('Integração: Auth + User com Postgres real', () => {
  beforeAll(async () => {
    await initDb()
    await pool.query('DELETE FROM users')
  })

  afterAll(async () => {
    await pool.query('DELETE FROM users')
    await pool.end()
  })

  test('Fluxo completo: register → login → profile', async () => {
    const registerRes = await request(app)
      .post('/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com', password: 'Secret#123' })
    expect(registerRes.status).toBe(201)
    expect(registerRes.body.user).toMatchObject({ name: 'Bob', email: 'bob@example.com' })
    expect(registerRes.body.user).not.toHaveProperty('password')

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'Secret#123' })
    expect(loginRes.status).toBe(200)
    expect(typeof loginRes.body.token).toBe('string')
    const token = loginRes.body.token

    const profileRes = await request(app)
      .get('/user/profile')
      .set('Authorization', `Bearer ${token}`)
    expect(profileRes.status).toBe(200)
    expect(profileRes.body.user).toMatchObject({ email: 'bob@example.com' })
  })

  test('Email duplicado retorna 409', async () => {
    const first = await request(app)
      .post('/auth/register')
      .send({ name: 'Carol', email: 'carol@example.com', password: 'Secret#123' })
    expect(first.status).toBe(201)
    const second = await request(app)
      .post('/auth/register')
      .send({ name: 'Carol', email: 'carol@example.com', password: 'Secret#123' })
    expect(second.status).toBe(409)
  })

  test('Login com senha incorreta retorna 401', async () => {
    await request(app)
      .post('/auth/register')
      .send({ name: 'Dave', email: 'dave@example.com', password: 'Correct1' })
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'dave@example.com', password: 'Wrong1' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Credenciais inválidas')
  })

  test('Profile sem token retorna 401', async () => {
    const res = await request(app).get('/user/profile')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Token ausente')
  })
})