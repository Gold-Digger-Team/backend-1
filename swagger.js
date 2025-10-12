// swagger.js
const swaggerJsdoc = require('swagger-jsdoc') // ESM: import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API Nama Aplikasi',
      version: '1.0.0',
      description: 'Dokumentasi REST API'
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local' }
      // { url: 'https://api.prod.com', description: 'Prod' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        // contoh kalau pakai CSRF cookie+header:
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token'
        }
      }
    },
    security: [{ bearerAuth: [] }] // hapus kalau endpoint publik
  },
  // Scan file yang berisi anotasi JSDoc untuk endpoint
  apis: ['./routes/**/*.js', './controllers/**/*.js', './schemas/**/*.yml']
}

const specs = swaggerJsdoc(options)
module.exports = { specs }
