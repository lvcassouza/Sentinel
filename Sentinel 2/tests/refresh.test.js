process.env.JWT_SECRET = 'testsecret'

const request = require('supertest')
const app = require('../server')
const crypto = require('crypto')

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

const { findUserByEmail } = require('../models/userModel')
const { createRefreshToken, findRefreshTokenByHash, revokeRefreshToken } = require('../models/tokenModel')

describe('Refresh token', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('login retorna refreshToken', async () => {
    findUserByEmail.mockResolvedValueOnce({ id: 1, email: 'a@b.com', password: 'hash' })
    jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValueOnce(true)
    createRefreshToken.mockResolvedValueOnce({})
    const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'x' })
    expect(res.status).toBe(200)
    expect(createRefreshToken).toHaveBeenCalled()
    expect(typeof res.body.refreshToken).toBe('string')
  })

  test('refresh sem token retorna 400', async () => {
    const res = await request(app).post('/auth/refresh').send({})
    expect(res.status).toBe(400)
  })

  test('refresh válido rotaciona token', async () => {
    const rt = crypto.randomBytes(10).toString('hex')
    const hash = require('crypto').createHash('sha256').update(rt).digest('hex')
    findRefreshTokenByHash.mockResolvedValueOnce({ user_id: 1, token_hash: hash, expires_at: new Date(Date.now() + 10000).toISOString(), revoked_at: null })
    const res = await request(app).post('/auth/refresh').send({ refreshToken: rt })
    expect(res.status).toBe(200)
    expect(revokeRefreshToken).toHaveBeenCalled()
    expect(createRefreshToken).toHaveBeenCalled()
    expect(typeof res.body.token).toBe('string')
    expect(typeof res.body.refreshToken).toBe('string')
  })
})