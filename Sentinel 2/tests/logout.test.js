process.env.JWT_SECRET = 'testsecret'

const request = require('supertest')
const app = require('../server')

jest.mock('../models/tokenModel', () => ({
  findRefreshTokenByHash: jest.fn(),
  revokeRefreshToken: jest.fn(),
}))

const crypto = require('crypto')
const { findRefreshTokenByHash, revokeRefreshToken } = require('../models/tokenModel')

describe('Logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('sem refreshToken retorna 400', async () => {
    const res = await request(app).post('/auth/logout').send({})
    expect(res.status).toBe(400)
  })

  test('revoga token existente retorna 200', async () => {
    const rt = crypto.randomBytes(8).toString('hex')
    const hash = crypto.createHash('sha256').update(rt).digest('hex')
    findRefreshTokenByHash.mockResolvedValueOnce({ token_hash: hash })
    const res = await request(app).post('/auth/logout').send({ refreshToken: rt })
    expect(res.status).toBe(200)
    expect(revokeRefreshToken).toHaveBeenCalled()
    expect(res.body).toMatchObject({ revoked: true })
  })

  test('token inexistente responde 200 idempotente', async () => {
    const rt = crypto.randomBytes(8).toString('hex')
    findRefreshTokenByHash.mockResolvedValueOnce(null)
    const res = await request(app).post('/auth/logout').send({ refreshToken: rt })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ revoked: true })
  })
})