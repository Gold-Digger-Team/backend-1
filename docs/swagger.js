// docs/swagger.js
const fs = require('fs')
const path = require('path')
const yaml = require('yaml')
const swaggerJsdoc = require('swagger-jsdoc')

const readYml = (p) => yaml.parse(fs.readFileSync(p, 'utf8'))

// --- load base files ---
const root = readYml(path.join(__dirname, './root.yml')) // wajib ada: openapi, info, servers
const comps = readYml(path.join(__dirname, './components.yml')) // hanya "components:"
const schemaFilesDir = path.join(__dirname, './schemas')

// --- simple deep merge ---
const deepMerge = (a, b) => {
  if (!b) return a
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
      a[k] = deepMerge(a[k] || {}, b[k])
    } else {
      a[k] = b[k]
    }
  }
  return a
}

// start from root (must include openapi/info/servers)
const definition = { ...root }

// ensure components exists
definition.components = definition.components || {}

// merge components.yml
deepMerge(definition.components, comps?.components)

// merge each schema file in ./schemas/*.yml
if (fs.existsSync(schemaFilesDir)) {
  const schemaFiles = fs
    .readdirSync(schemaFilesDir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  for (const f of schemaFiles) {
    const doc = readYml(path.join(schemaFilesDir, f))
    if (doc?.components) {
      deepMerge(definition.components, doc.components)
    }
  }
}

// safety: make sure securitySchemes object exists (avoid undefined)
definition.components.securitySchemes = definition.components.securitySchemes || {}

// now generate with swagger-jsdoc to add inline @openapi blocks from routes/server
const specs = swaggerJsdoc({
  definition,
  apis: [path.join(__dirname, '../routes/**/*.js'), path.join(__dirname, '../server.js')]
})

module.exports = { specs }
