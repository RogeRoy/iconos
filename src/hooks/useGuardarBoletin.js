// useGuardarBoletin.js — v4
// Usa devLog para que los logs aparezcan en browser Y terminal npm.
import { useState, useCallback } from 'react'
import { guardarBoletin, actualizarBoletin, guardarImagen, generarNombreImagen } from '../services/api'
import { encodeHtml, sanitizePlain } from '../utils/htmlTokens'
import { buildCss, encodeCssToIndex } from '../utils/cssTokens'
import { devLog, devLogGroup, devSeparator } from '../utils/devLog'

const RICH_TYPES  = ['p', 'ul', 'ol', 'ul-ol', 'hl', 'note']
const PLAIN_TYPES = ['h1', 'h2', 'h3']

function procesarSeccion(sec) {
  const tipo  = sec._meta_type  || ''
  const align = sec._meta_align || 'left'
  const font  = ''

  // ── 1. HTML: tokenizar ────────────────────────────────
  const htmlCrudo = sec.section_html || ''
  let   htmlToken = ''

  if (PLAIN_TYPES.includes(tipo)) {
    htmlToken = sanitizePlain(htmlCrudo)
  } else if (RICH_TYPES.includes(tipo)) {
    htmlToken = encodeHtml(htmlCrudo)
  } else {
    htmlToken = htmlCrudo
  }

  // Log HTML — aparece en browser Y terminal npm
  if (RICH_TYPES.includes(tipo) || PLAIN_TYPES.includes(tipo)) {
    devLogGroup('TOKEN', `SEG=${sec.section_segment} SUB=${sec.section_subsegment} tipo=${tipo} orden=${sec.section_order}`, [
      { label: 'section_html ANTES  (HTML crudo)', valor: htmlCrudo  },
      { label: 'section_html DESPUÉS (tokens)    ', valor: htmlToken  },
    ])
  }

  // ── 2. CSS: construir → codificar a índices ────────────
  const cssClases  = buildCss(tipo, align, font)
  const cssIndices = encodeCssToIndex(cssClases)

  // Log CSS — aparece en browser Y terminal npm
  devLogGroup('CSS', `SEG=${sec.section_segment} tipo=${tipo} orden=${sec.section_order}`, [
    { label: 'section_css_temp ANTES  (clases) ', valor: cssClases  },
    { label: 'section_css DESPUÉS (índices)     ', valor: cssIndices },
  ])

  return {
    ...sec,
    section_html_temp: htmlCrudo,
    section_css_temp:  cssClases,
    section_html:      htmlToken,
    section_css:       cssIndices,
  }
}

export function useGuardarBoletin() {
  const [cargando,  setCargando]  = useState(false)
  const [error,     setError]     = useState(null)
  const [resultado, setResultado] = useState(null)

  const guardar = useCallback(async (flatJson, imagenesArchivos = {}, bulletinIdExistente = null) => {
    setCargando(true); setError(null); setResultado(null)

    try {
      const baseBullId = bulletinIdExistente || 'draft'
      const urlsSubidas = {}; let consecutivo = 1

      for (const [elemId, archivo] of Object.entries(imagenesArchivos)) {
        const nombre = generarNombreImagen(archivo, baseBullId, consecutivo)
        devLog('IMG', `Subiendo imagen ${nombre}…`)
        try {
          const resp = await guardarImagen(archivo, baseBullId, consecutivo)
          urlsSubidas[elemId] = resp.url; consecutivo++
          devLog('IMG', `✅ Guardada: ${resp.filename}`)
        } catch {
          urlsSubidas[elemId] = URL.createObjectURL(archivo)
          devLog('IMG', `⚠ ${nombre} no subida — usando URL local temporal`)
        }
      }

      const jsonConUrls = {
        ...flatJson,
        bulletin_sections: flatJson.bulletin_sections.map(sec => {
          if (sec._meta_type === 'img' && sec.section_content) {
            const url = Object.values(urlsSubidas).find(u =>
              u.includes(sec.section_content) || u.endsWith(sec.section_content)
            )
            if (url) return { ...sec, section_content: url, path_desc: url }
          }
          return sec
        }),
      }

      devSeparator('TOKENIZACIÓN + CODIFICACIÓN CSS — inicio')

      const jsonFinal = {
        ...jsonConUrls,
        bulletin_sections: jsonConUrls.bulletin_sections.map(procesarSeccion),
      }

      devSeparator('JSON FINAL listo para la BD')
      devLog('INFO', 'JSON completo', jsonFinal)

      let respGuardado
      if (bulletinIdExistente) {
        respGuardado = await actualizarBoletin(bulletinIdExistente, jsonFinal)
      } else {
        respGuardado = await guardarBoletin(jsonFinal)
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
