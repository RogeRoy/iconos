// vite.config.js
// ─────────────────────────────────────────────────────────────────────────
// Este archivo configura el servidor de desarrollo de Vite.
// Agrega dos middlewares (intermediarios) personalizados:
//
//   /__devlog  → recibe logs del browser y los muestra en la terminal npm
//   /__upload  → recibe imágenes del browser y las guarda en public/assets/
//
// ¿POR QUÉ NECESITAMOS ESTO?
//   El browser (Chrome/Firefox) NO puede escribir archivos en el disco por
//   razones de seguridad. Solo puede leer archivos que el usuario selecciona.
//   Pero Vite corre en Node.js, que SÍ puede escribir en el sistema de archivos.
//   Entonces el browser le manda la imagen a Vite via HTTP, y Vite la escribe.
//
//   Browser ──POST /__ upload──▶ Vite (Node.js) ──fs.writeFile──▶ public/assets/
//
// IMPORTANTE: Esto solo funciona en DESARROLLO (npm run dev).
//   En producción, el servidor backend (el que tiene la API en puerto 3001)
//   debería recibir las imágenes y guardarlas en su propio sistema de archivos.
// ─────────────────────────────────────────────────────────────────────────
import { defineConfig } from 'vite'
import react            from '@vitejs/plugin-react'
import fs               from 'fs'
import path             from 'path'

// ── Plugin 1: devLog ──────────────────────────────────────────────────────
// Recibe los logs del browser (desde devLog.js) y los imprime en la terminal.
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
              : level === 'warn' ? '\x1b[33m[WARN]\x1b[0m'
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

// ── Plugin 2: uploadImage ─────────────────────────────────────────────────
// Recibe imágenes del browser como multipart/form-data y las escribe en disco.
//
// Endpoint: POST /__upload
// Body: multipart/form-data con los campos:
//   filename  → nombre final del archivo (ej: secimg_logo_1_20260428_143055.png)
//   bull_id   → ID del boletín (para crear la subcarpeta)
//   image     → el archivo binario (el File del browser)
//
// Respuesta: { ok: true, url: "/assets/section_images/1/secimg_logo_1_...png" }
//
// El archivo queda en: {proyecto}/public/assets/section_images/{bull_id}/{filename}
// Y es accesible en el browser como: http://localhost:5173/assets/section_images/...
function uploadImagePlugin() {
  return {
    name: 'upload-image',
    configureServer(server) {
      server.middlewares.use('/__upload', (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }

        // Recopilar los bytes del cuerpo de la petición
        // req es un stream — los datos llegan en "chunks" (pedazos)
        const chunks = []
        req.on('data', chunk => chunks.push(chunk))
        req.on('end', () => {
          try {
            // Unir todos los chunks en un solo Buffer (arreglo de bytes)
            const buffer = Buffer.concat(chunks)

            // ── Parsear multipart/form-data manualmente ──────────────────
            // multipart separa los campos con un "boundary" (delimitador).
            // El Content-Type se ve así:
            //   multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
            const contentType = req.headers['content-type'] || ''
            const boundaryMatch = contentType.match(/boundary=(.+)/)
            if (!boundaryMatch) throw new Error('Sin boundary en Content-Type')

            const boundary = boundaryMatch[1].trim()
            const parsed   = parseMultipart(buffer, boundary)

            // Obtener los campos del form
            const filename = parsed.fields['filename']
            const bullId   = parsed.fields['bull_id'] || '1'
            const fileData = parsed.files['image']    // { data: Buffer, filename, contentType }

            if (!filename || !fileData) throw new Error('Faltan campos filename o image')

            // ── Crear la carpeta si no existe ────────────────────────────
            // path.resolve() construye la ruta absoluta desde la raíz del proyecto
            // __dirname aquí es el directorio de vite.config.js (raíz del proyecto)
            const carpeta = path.resolve('public', 'assets', 'section_images', String(bullId))
            if (!fs.existsSync(carpeta)) {
              fs.mkdirSync(carpeta, { recursive: true })
              console.log(`\x1b[32m[IMG] Carpeta creada: ${carpeta}\x1b[0m`)
            }

            // ── Escribir el archivo en disco ─────────────────────────────
            const rutaArchivo = path.join(carpeta, filename)
            fs.writeFileSync(rutaArchivo, fileData.data)

            // URL relativa que el browser usará para mostrar la imagen
            const url = `/assets/section_images/${bullId}/${filename}`

            console.log(`\x1b[32m[IMG] ✅ Guardada: ${rutaArchivo}\x1b[0m`)
            console.log(`\x1b[32m[IMG]    URL: ${url}\x1b[0m`)

            // Responder con éxito
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true, url, filename, path: rutaArchivo }))

          } catch (err) {
            console.error(`\x1b[31m[IMG] ❌ Error al guardar imagen: ${err.message}\x1b[0m`)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: err.message }))
          }
        })
      })
    }
  }
}

// ── parseMultipart: parsea el body de un form multipart ──────────────────
// Esta función entiende el formato multipart/form-data que usa el browser
// para enviar formularios con archivos.
//
// El formato se ve así en bytes:
//   --boundary\r\n
//   Content-Disposition: form-data; name="filename"\r\n
//   \r\n
//   secimg_logo_1_20260428.png\r\n
//   --boundary\r\n
//   Content-Disposition: form-data; name="image"; filename="logo.png"\r\n
//   Content-Type: image/png\r\n
//   \r\n
//   [bytes de la imagen]
//   --boundary--
//
// Retorna: { fields: { filename: "...", bull_id: "1" }, files: { image: { data, filename, contentType } } }
function parseMultipart(buffer, boundary) {
  const fields = {}
  const files  = {}

  // Convertir el boundary a bytes para buscarlo en el buffer binario
  const boundaryBuf = Buffer.from('--' + boundary)
  const CRLF        = Buffer.from('\r\n')
  const CRLFCRLF    = Buffer.from('\r\n\r\n')

  let pos = 0

  // Buscar cada parte del multipart
  while (pos < buffer.length) {
    // Buscar el inicio del próximo boundary
    const bPos = buffer.indexOf(boundaryBuf, pos)
    if (bPos === -1) break
    pos = bPos + boundaryBuf.length + 2  // saltar el boundary + CRLF

    // Buscar el doble CRLF que separa los headers del contenido
    const headerEnd = buffer.indexOf(CRLFCRLF, pos)
    if (headerEnd === -1) break

    // Extraer los headers de esta parte
    const headerStr = buffer.slice(pos, headerEnd).toString('utf8')
    pos = headerEnd + 4  // saltar el \r\n\r\n

    // Buscar el siguiente boundary para saber dónde termina el contenido
    const nextBoundary = buffer.indexOf(boundaryBuf, pos)
    const contentEnd   = nextBoundary === -1 ? buffer.length : nextBoundary - 2  // -2 por el CRLF antes del boundary

    // El contenido es el slice entre pos y contentEnd
    const content = buffer.slice(pos, contentEnd)
    pos = nextBoundary === -1 ? buffer.length : nextBoundary

    // Parsear los headers para saber el nombre del campo y si es archivo
    const dispositionMatch = headerStr.match(/Content-Disposition:[^\r\n]*name="([^"]+)"/)
    const filenameMatch    = headerStr.match(/Content-Disposition:[^\r\n]*filename="([^"]+)"/)
    const ctypeMatch       = headerStr.match(/Content-Type:\s*([^\r\n]+)/)

    if (!dispositionMatch) continue
    const fieldName = dispositionMatch[1]

    if (filenameMatch) {
      // Es un archivo binario
      files[fieldName] = {
        data:        content,
        filename:    filenameMatch[1],
        contentType: ctypeMatch ? ctypeMatch[1].trim() : 'application/octet-stream',
      }
    } else {
      // Es un campo de texto
      fields[fieldName] = content.toString('utf8')
    }
  }

  return { fields, files }
}

export default defineConfig({
  plugins: [react(), devLogPlugin(), uploadImagePlugin()],
})
