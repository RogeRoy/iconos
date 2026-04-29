import { defineConfig }    from 'vite'
import react               from '@vitejs/plugin-react'
import fs                  from 'fs'
import path                from 'path'
import { fileURLToPath }   from 'url'

// ── Obtener el directorio raíz del proyecto ──────────────────────────
// En ES Modules (import/export), __dirname NO existe.
// Usamos import.meta.url para obtener la ruta del archivo actual (vite.config.js)
// y de ahí calculamos el directorio raíz del proyecto.
const __filename = fileURLToPath(import.meta.url)  // /home/.../build-test/vite.config.js
const __dirname  = path.dirname(__filename)          // /home/.../build-test/

// ── Plugin 1: devLog ──────────────────────────────────────────────────
// Recibe logs del browser y los imprime en la terminal de npm.
function devLogPlugin() {
  return {
    name: 'dev-log',
    configureServer(server) {
      server.middlewares.use('/__devlog', (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { level, msg, data } = JSON.parse(body)
            const prefix = level === 'error' ? '\x1b[31m[ERROR]\x1b[0m'
              : level === 'warn'  ? '\x1b[33m[WARN]\x1b[0m'
              : '\x1b[36m[LOG]\x1b[0m'
            const extra = data !== undefined
              ? (typeof data === 'string' ? data : JSON.stringify(data, null, 2).slice(0, 600))
              : ''
            console.log(`${prefix} ${msg}`, extra || '')
          } catch { /* body malformado — ignorar */ }
          res.writeHead(204); res.end()
        })
      })
    }
  }
}

// ── Plugin 2: uploadImage ──────────────────────────────────────────────
// Recibe imágenes del browser y las escribe físicamente en disco.
// Ruta destino: {proyecto}/public/assets/section_images/{bull_id}/{filename}
//
// FIXES en esta versión:
//   1. Usar __dirname para calcular la ruta absoluta correcta
//      (evita el bug de path.resolve resolviendo desde CWD incorrecto)
//   2. Quitar comillas del boundary si Chrome las incluye
//      (bug: boundary="----WebKitFormBoundary..." con comillas literales)
//   3. Logs más detallados para diagnosticar fácilmente
function uploadImagePlugin() {
  return {
    name: 'upload-image',
    configureServer(server) {
      server.middlewares.use('/__upload', (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }

        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks)

            // ── FIX 1: parsear boundary quitando comillas opcionales ──
            // Chrome a veces envía: boundary="----WebKitFormBoundaryXYZ"
            // con comillas literales que rompen el parse del multipart.
            const contentType    = req.headers['content-type'] || ''
            const boundaryMatch  = contentType.match(/boundary=(.+)/i)
            if (!boundaryMatch) {
              console.error('[IMG] ❌ Content-Type sin boundary:', contentType)
              throw new Error('Sin boundary en Content-Type')
            }
            // Quitar comillas dobles si existen: "valor" → valor
            const boundary = boundaryMatch[1].replace(/^"|"$/g, '').trim()
            console.log('[IMG] Boundary detectado:', boundary)

            const parsed = parseMultipart(buffer, boundary)
            console.log('[IMG] Campos recibidos:', Object.keys(parsed.fields))
            console.log('[IMG] Archivos recibidos:', Object.keys(parsed.files))

            const filename = parsed.fields['filename']
            const bullId   = parsed.fields['bull_id'] || '1'
            const fileData = parsed.files['image']

            if (!filename) throw new Error(`Campo 'filename' no encontrado. Campos: ${Object.keys(parsed.fields).join(',')}`)
            if (!fileData) throw new Error(`Campo 'image' no encontrado. Archivos: ${Object.keys(parsed.files).join(',')}`)
            if (!fileData.data || fileData.data.length === 0) throw new Error('El archivo de imagen está vacío')

            // ── FIX 2: usar __dirname para ruta absoluta correcta ──────
            // __dirname = directorio de vite.config.js = raíz del proyecto
            // Antes: path.resolve('public', ...) usaba process.cwd() que podía ser '/'
            const carpeta = path.join(__dirname, 'public', 'assets', 'section_images', String(bullId))
            console.log('[IMG] Carpeta destino:', carpeta)

            if (!fs.existsSync(carpeta)) {
              fs.mkdirSync(carpeta, { recursive: true })
              console.log(`\x1b[32m[IMG] ✅ Carpeta creada: ${carpeta}\x1b[0m`)
            }

            const rutaArchivo = path.join(carpeta, filename)
            fs.writeFileSync(rutaArchivo, fileData.data)

            const url = `/assets/section_images/${bullId}/${filename}`
            console.log(`\x1b[32m[IMG] ✅ Guardada: ${rutaArchivo} (${fileData.data.length} bytes)\x1b[0m`)
            console.log(`\x1b[32m[IMG]    URL pública: ${url}\x1b[0m`)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true, url, filename, path: rutaArchivo, size: fileData.data.length }))

          } catch (err) {
            console.error(`\x1b[31m[IMG] ❌ ${err.message}\x1b[0m`)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: err.message }))
          }
        })
      })
    }
  }
}

// ── parseMultipart ─────────────────────────────────────────────────────
// Parsea manualmente el cuerpo multipart/form-data.
// Extrae campos de texto (fields) y archivos binarios (files).
function parseMultipart(buffer, boundary) {
  const fields = {}
  const files  = {}

  const sep      = Buffer.from('--' + boundary)
  const CRLF     = '\r\n'
  const CRLFCRLF = '\r\n\r\n'

  let pos = 0
  while (pos < buffer.length) {
    const bPos = buffer.indexOf(sep, pos)
    if (bPos === -1) break

    pos = bPos + sep.length

    // Fin del multipart: -- al final
    if (buffer[pos] === 0x2D && buffer[pos+1] === 0x2D) break

    // Saltar CRLF después del boundary
    if (buffer[pos] === 0x0D && buffer[pos+1] === 0x0A) pos += 2

    // Buscar el doble CRLF que separa headers del contenido
    const headerEndIdx = buffer.indexOf(CRLFCRLF, pos)
    if (headerEndIdx === -1) break

    const headerStr = buffer.slice(pos, headerEndIdx).toString('utf8')
    pos = headerEndIdx + 4

    // Buscar el siguiente boundary para delimitar el contenido
    const nextSep  = buffer.indexOf(sep, pos)
    const endPos   = nextSep !== -1 ? nextSep - 2 : buffer.length  // -2 por CRLF antes del boundary
    const content  = buffer.slice(pos, endPos)
    pos = nextSep !== -1 ? nextSep : buffer.length

    // Parsear headers de esta parte
    const dispMatch = headerStr.match(/content-disposition[^;]*;[^]*?name="([^"]+)"/i)
    const fileMatch = headerStr.match(/filename="([^"]+)"/i)
    const ctMatch   = headerStr.match(/content-type:\s*([^\r\n]+)/i)

    if (!dispMatch) continue
    const fieldName = dispMatch[1]

    if (fileMatch) {
      files[fieldName] = {
        data:        content,
        filename:    fileMatch[1],
        contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
      }
    } else {
      fields[fieldName] = content.toString('utf8')
    }
  }

  return { fields, files }
}

export default defineConfig({
  plugins: [react(), devLogPlugin(), uploadImagePlugin()],
})
