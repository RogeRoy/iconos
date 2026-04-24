export const CHIP_STYLE = {
  h1:    { bg:'#611232', color:'#fff',    border:'none' },
  h2:    { bg:'#9b2247', color:'#fff',    border:'none' },
  h3:    { bg:'#1e5b4f', color:'#fff',    border:'none' },
  p:     { bg:'#eaf5f2', color:'#1e5b4f', border:'none' },
  ul:    { bg:'#fdf9ee', color:'#a57f2c', border:'none' },
  ol:    { bg:'#fff3d0', color:'#7b5800', border:'none' },
  'ul-ol':{ bg:'#fce4d0',color:'#8b3a00',border:'none' },
  hl:    { bg:'#fff9c4', color:'#7b5800', border:'1px solid #f5c800' },
  note:  { bg:'#f8eff3', color:'#611232', border:'none' },
  url:   { bg:'#eaf5f2', color:'#002f2a', border:'none' },
  mail:  { bg:'#fce4ec', color:'#880e4f', border:'none' },
  img:   { bg:'#fdf9ee', color:'#a57f2c', border:'none' },
  hr:    { bg:'#f0f0ee', color:'#666',    border:'none' },
}

export const TYPE_GROUPS = [
  { label:'Títulos y Textos', icon:'Tt', types:[
    { key:'h1', label:'Título grande',   desc:'Título principal del documento',        descLarga:'El título más importante del boletín. Úselo para el nombre del tema principal.',                              htmlTag:'h1', cssClases:'doc-h1', hasAlign:true,  hasStyle:true,  hasRich:false, hasListBar:false, defAlign:'center'  },
    { key:'h2', label:'Título mediano',  desc:'Nombre de institución o subtítulo',     descLarga:'Título secundario. Ideal para el nombre de la institución o para dividir grandes temas.',                      htmlTag:'h2', cssClases:'doc-h2', hasAlign:true,  hasStyle:true,  hasRich:false, hasListBar:false, defAlign:'center'  },
    { key:'h3', label:'Encabezado',      desc:'Encabezado de sección',                 descLarga:'Título pequeño para separar partes dentro del documento.',                                                      htmlTag:'h3', cssClases:'doc-h3', hasAlign:true,  hasStyle:true,  hasRich:false, hasListBar:false, defAlign:'left'    },
    { key:'p',  label:'Párrafo',         desc:'Texto corrido del documento',           descLarga:'Bloque de texto. Puede aplicarle negritas, cursivas y subrayado.',                                             htmlTag:'p',  cssClases:'doc-p',  hasAlign:true,  hasStyle:true,  hasRich:true,  hasListBar:false, defAlign:'justify' },
  ]},
  { label:'Listas', icon:'☰', types:[
    { key:'ul',    label:'Lista con Viñetas',   desc:'• Puntos sin número',               descLarga:'Lista de puntos con círculo (•).',                                                                           htmlTag:'ul', cssClases:'doc-ul', hasAlign:true, hasStyle:true, hasRich:true, hasListBar:true, defAlign:'left' },
    { key:'ol',    label:'Lista Numerada',       desc:'1. Puntos con número',              descLarga:'Lista numerada (1, 2, 3…).',                                                                                 htmlTag:'ol', cssClases:'doc-ol', hasAlign:true, hasStyle:true, hasRich:true, hasListBar:true, defAlign:'left' },
    { key:'ul-ol', label:'Viñetas + sub-lista', desc:'Viñetas con lista numerada adentro',descLarga:'Viñetas con sub-listas numeradas. Use "Anidar" para crear el sub-nivel.',                                    htmlTag:'ul', cssClases:'doc-ul', hasAlign:true, hasStyle:true, hasRich:true, hasListBar:true, defAlign:'left' },
  ]},
  { label:'Avisos y Notas', icon:'⚑', types:[
    { key:'hl',   label:'Aviso Importante', desc:'Caja resaltada en amarillo',         descLarga:'Recuadro amarillo para información muy importante.',                                                            htmlTag:'div',        cssClases:'doc-highlight', hasAlign:true,  hasStyle:true,  hasRich:true,  hasListBar:false, defAlign:'left' },
    { key:'note', label:'Nota al margen',   desc:'Con línea lateral izquierda',        descLarga:'Texto con línea guinda a la izquierda, para aclaraciones o notas.',                                            htmlTag:'blockquote', cssClases:'doc-note',      hasAlign:true,  hasStyle:true,  hasRich:true,  hasListBar:false, defAlign:'left' },
    { key:'hr',   label:'Línea divisora',   desc:'Separador visual entre secciones',   descLarga:'Línea horizontal separadora. No lleva texto.',                                                                  htmlTag:'hr',         cssClases:'doc-hr',        hasAlign:false, hasStyle:false, hasRich:false, hasListBar:false, defAlign:''     },
  ]},
  { label:'Links y Archivos', icon:'🔗', types:[
    { key:'url',  label:'Enlace Web',          desc:'Dirección de internet (https://...)',descLarga:'Enlace a una página de internet.',                                                                            htmlTag:'a',   cssClases:'doc-url',    hasAlign:true, hasStyle:false, hasRich:false, hasListBar:false, defAlign:'left'   },
    { key:'mail', label:'Correo electrónico',  desc:'Dirección de email',                descLarga:'Al hacer clic abrirá el programa de correo del lector.',                                                      htmlTag:'a',   cssClases:'doc-mailto', hasAlign:true, hasStyle:false, hasRich:false, hasListBar:false, defAlign:'left'   },
    { key:'img',  label:'Imagen',              desc:'Foto o ilustración (JPG, PNG)',     descLarga:'Inserta una imagen. Seleccione el archivo desde su computadora.',                                              htmlTag:'img', cssClases:'doc-img-full img-center', hasAlign:true, hasStyle:false, hasRich:false, hasListBar:false, defAlign:'center' },
  ]},
]
export const ALL_TYPES = TYPE_GROUPS.flatMap(g=>g.types)
export const findType  = (key) => ALL_TYPES.find(t=>t.key===key) || ALL_TYPES[0]
