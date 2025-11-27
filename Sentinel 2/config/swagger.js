const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Sentinel Auth API',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:' + (process.env.PORT || 3000) }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Registrar usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } },
          },
        },
        responses: {
          201: { description: 'Criado' },
          400: { description: 'Dados inválidos' },
          409: { description: 'Email já registrado' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: { description: 'OK' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Credenciais inválidas' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Renova token de acesso',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } },
          },
        },
        responses: {
          200: { description: 'OK' },
          400: { description: 'Refresh token ausente' },
          401: { description: 'Refresh token inválido/expirado/revogado' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoga o refresh token atual',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } },
          },
        },
        responses: {
          200: { description: 'Revogado' },
          400: { description: 'Refresh token ausente' },
        },
      },
    },
    '/user/profile': {
      get: {
        summary: 'Perfil do usuário',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK' },
          401: { description: 'Token inválido/ausente' },
        },
      },
    },
  },
}

module.exports = { spec }