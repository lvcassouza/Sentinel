process.env.JWT_SECRET = 'testsecret'

const request = require('supertest')
const app = require('../server')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

jest.mock('../models/userModel', () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
}))

jest.mock('../models/tokenModel', () => ({
  createRefreshToken: jest.fn(),
  findRefreshTokenByHash: jest.fn(),
  revokeRefreshToken: jest.fn(),
}))

const { createUser, findUserByEmail, findUserById } = require('../models/userModel')
const { createRefreshToken } = require('../models/tokenModel')

describe('Auth and User endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('POST /auth/register valida campos', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'a@b.com', password: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Dados inválidos')
  })

  test('POST /auth/register rejeita email duplicado', async () => {
    findUserByEmail.mockResolvedValueOnce({ id: 1 })
    const res = await request(app).post('/auth/register').send({ name: 'Alice', email: 'alice@example.com', password: 'secret' })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Email já registrado')
  })

  test('POST /auth/register sucesso', async () => {
    findUserByEmail.mockResolvedValueOnce(null)
    createUser.mockResolvedValueOnce({ id: 1, name: 'Alice', email: 'alice@example.com', created_at: new Date().toISOString() })
    const res = await request(app).post('/auth/register').send({ name: 'Alice', email: 'alice@example.com', password: 'secret' })
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ id: 1, name: 'Alice', email: 'alice@example.com' })
    expect(res.body.user).not.toHaveProperty('password')
  })

  test('POST /auth/login valida campos', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'alice@example.com' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Dados inválidos')
  })

  test('POST /auth/login credenciais inválidas (usuário inexistente)', async () => {
    findUserByEmail.mockResolvedValueOnce(null)
    const res = await request(app).post('/auth/login').send({ email: 'alice@example.com', password: 'secret' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Credenciais inválidas')
  })

  test('POST /auth/login credenciais inválidas (senha incorreta)', async () => {
    findUserByEmail.mockResolvedValueOnce({ id: 1, name: 'Alice', email: 'alice@example.com', password: 'hash' })
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false)
    const res = await request(app).post('/auth/login').send({ email: 'alice@example.com', password: 'wrong' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Credenciais inválidas')
  })

  test('POST /auth/login sucesso retorna token', async () => {
    findUserByEmail.mockResolvedValueOnce({ id: 1, name: 'Alice', email: 'alice@example.com', password: 'hash' })
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true)
    createRefreshToken.mockResolvedValueOnce({})
    const res = await request(app).post('/auth/login').send({ email: 'alice@example.com', password: 'secret' })
    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.token.length).toBeGreaterThan(10)
  })

  test('GET /user/profile sem token retorna 401', async () => {
    const res = await request(app).get('/user/profile')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Token ausente')
  })

  test('GET /user/profile com token válido retorna dados', async () => {
    findUserById.mockResolvedValueOnce({ id: 1, name: 'Alice', email: 'alice@example.com', created_at: new Date().toISOString() })
    const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' })
    const res = await request(app).get('/user/profile').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ id: 1, email: 'alice@example.com' })
  })
})