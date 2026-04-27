// useGuardarBoletin.js — v2
// Integra encodeHtml + guardarImagen con nombre document-image-{id}-{n}.ext
import { useState, useCallback } from 'react'
import { guardarBoletin, actualizarBoletin, guardarImagen, generarNombreImagen } from '../services/api'
import { encodeHtml, sanitizePlain } from '../utils/htmlTokens'

// ── Aplica tokenización al JSON antes de enviarlo a la BD ─
// Recorre bulletin_sections y codifica section_content según el tipo.
// Títulos (h1/h2/h3): texto plano puro.
// Elementos ricos (p, ul, ol, hl, note): tokens HTML.
// Resto: sin cambios.
function tokenizarJson(flatJson) {
  const RICH_TYPES = ['p', 'ul', 'ol', 'ul-ol', 'hl', 'note']
  const PLAIN_TYPES = ['h1', 'h2', 'h3']

  return {
    ...flatJson,
    bulletin_sections: flatJson.bulletin_sections.map(sec => {
      const tipo = sec._meta_type || ''
      let content = sec.section_content || ''

      if (PLAIN_TYPES.includes(tipo)) {
        content = sanitizePlain(content)
      } else if (RICH_TYPES.includes(tipo)) {
        content = encodeHtml(content)
      }
      // url, mail, img, hr → sin cambios (ya son texto plano)

      return { ...sec, section_content: content }
    }),
  }
}

export function useGuardarBoletin() {
  const [cargando,  setCargando]  = useState(false)
  const [error,     setError]     = useState(null)
  const [resultado, setResultado] = useState(null)

  const guardar = useCallback(async (flatJson, imagenesArchivos = {}, bulletinIdExistente = null) => {
    setCargando(true); setError(null); setResultado(null)

    try {
      // PASO 1: Subir imágenes con nombre document-image-{id}-{n}.ext
      // Si el boletín ya existe, usamos su ID. Si es nuevo, usamos 'draft'.
      const baseBullId = bulletinIdExistente || 'draft'
      const urlsSubidas = {}
      let consecutivo = 1

      for (const [elemId, archivo] of Object.entries(imagenesArchivos)) {
        const nombre = generarNombreImagen(archivo, baseBullId, consecutivo)
        console.log(`[API] Subiendo imagen ${nombre}…`)
        try {
          const resp = await guardarImagen(archivo, baseBullId, consecutivo)
          urlsSubidas[elemId] = resp.url
          consecutivo++
          console.log(`[API] ✅ ${resp.filename}`)
        } catch {
          // Si falla la subida, usar URL local temporal (no bloquear el guardado)
          urlsSubidas[elemId] = URL.createObjectURL(archivo)
          console.warn(`[API] ⚠ Imagen ${nombre} no subida, usando URL local`)
        }
      }

      // PASO 2: Reemplazar nombres de archivo por URLs en el JSON
      const jsonConUrls = {
        ...flatJson,
        bulletin_sections: flatJson.bulletin_sections.map(sec => {
          if (sec._meta_type === 'img' && sec.section_content) {
            const urlNueva = Object.values(urlsSubidas).find(u =>
              u.includes(sec.section_content) || u.endsWith(sec.section_content)
            )
            if (urlNueva) return { ...sec, section_content: urlNueva, path_desc: urlNueva }
          }
          return sec
        }),
      }

      // PASO 3: Tokenizar HTML antes de enviar a la BD
      const jsonTokenizado = tokenizarJson(jsonConUrls)

      // PASO 4: Guardar o actualizar
      let respGuardado
      if (bulletinIdExistente) {
        respGuardado = await actualizarBoletin(bulletinIdExistente, jsonTokenizado)
      } else {
        respGuardado = await guardarBoletin(jsonTokenizado)
      }

      setResultado(respGuardado)
      return respGuardado

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error desconocido'
      setError(msg)
      throw err
    } finally {
      setCargando(false)
    }
  }, [])

  const limpiar = useCallback(() => { setError(null); setResultado(null) }, [])

  return { guardar, cargando, error, resultado, limpiar }
}
