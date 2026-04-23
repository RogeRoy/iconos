// elementTypes.js — fuente única de todos los tipos de elemento
// Espejo de TYPE_GROUPS / ALL_TYPES del HTML original.

export const TYPE_GROUPS = [
  {
    label: 'Títulos y Textos', icon: 'Tt',
    types: [
      { key:'h1', label:'Título grande',    desc:'Título principal del documento',         descLarga:'El título más importante del boletín. Aparece en letras grandes al inicio. Úselo para el nombre del tema principal.',                                                       chip:'chip-h1', htmlTag:'h1', cssClases:'doc-h1', hasAlign:true,  hasStyle:true,  hasRich:false, hasListBar:false, defAlign:'center'  },
      { key:'h2', label:'Título mediano',   desc:'Nombre de institución o subtítulo',      descLarga:'Título secundario, un poco más pequeño. Ideal para el nombre de la institución o para dividir grandes temas.',                                                               chip:'chip-h2', htmlTag:'h2', cssClases:'doc-h2', hasAlign:true,  hasStyle:true,  hasRich:false, hasListBar:false, defAlign:'center'  },
      { key:'h3', label:'Encabezado',       desc:'Encabezado de sección',                  descLarga:'Título pequeño para separar partes dentro del documento. Úselo para nombrar cada apartado.',                                                                                 chip:'chip-h3', htmlTag:'h3', cssClases:'doc-h3', hasAlign:true,  hasStyle:true,  hasRich:false, hasListBar:false, defAlign:'left'    },
      { key:'p',  label:'Párrafo',          desc:'Texto corrido del documento',            descLarga:'Bloque de texto para explicaciones y contenido general. Puede aplicarle negritas, cursivas y subrayado.',                                                                    chip:'chip-p',  htmlTag:'p',  cssClases:'doc-p',  hasAlign:true,  hasStyle:true,  hasRich:true,  hasListBar:false, defAlign:'justify' },
    ],
  },
  {
    label: 'Listas', icon: '☰',
    types: [
      { key:'ul',    label:'Lista con Viñetas',    desc:'• Puntos sin número',                descLarga:'Lista de puntos marcados con un círculo (•). Use este tipo cuando el orden de los puntos no importa.',                                                                      chip:'chip-ul',    htmlTag:'ul', cssClases:'doc-ul', hasAlign:true, hasStyle:false, hasRich:true, hasListBar:true, defAlign:'left' },
      { key:'ol',    label:'Lista Numerada',        desc:'1. Puntos con número',               descLarga:'Lista de puntos con número (1, 2, 3…). Use este tipo cuando el orden o la secuencia de los pasos es importante.',                                                          chip:'chip-ol',    htmlTag:'ol', cssClases:'doc-ol', hasAlign:true, hasStyle:false, hasRich:true, hasListBar:true, defAlign:'left' },
      { key:'ul-ol', label:'Viñetas + sub-lista',  desc:'Viñetas con lista numerada adentro', descLarga:'Lista de viñetas que puede contener sub-listas numeradas dentro de cada punto. Use "Anidar" para crear el sub-nivel.',                                                     chip:'chip-ul-ol', htmlTag:'ul', cssClases:'doc-ul', hasAlign:true, hasStyle:false, hasRich:true, hasListBar:true, defAlign:'left' },
    ],
  },
  {
    label: 'Avisos y Notas', icon: '⚑',
    types: [
      { key:'hl',   label:'Aviso Importante', desc:'Caja resaltada en amarillo',          descLarga:'Recuadro de color amarillo para llamar la atención sobre información muy importante que el lector no debe pasar por alto.',                                                    chip:'chip-hl',   htmlTag:'div',        cssClases:'doc-highlight', hasAlign:true,  hasStyle:false, hasRich:true,  hasListBar:false, defAlign:'left' },
      { key:'note', label:'Nota al margen',   desc:'Con línea lateral izquierda',         descLarga:'Texto con una línea de color a la izquierda, para aclaraciones, fuentes o información complementaria.',                                                                       chip:'chip-note', htmlTag:'blockquote', cssClases:'doc-note',      hasAlign:true,  hasStyle:false, hasRich:true,  hasListBar:false, defAlign:'left' },
      { key:'hr',   label:'Línea divisora',   desc:'Separador visual entre secciones',    descLarga:'Línea horizontal que separa visualmente dos partes del documento. No lleva texto.',                                                                                            chip:'chip-hr',   htmlTag:'hr',         cssClases:'doc-hr',        hasAlign:false, hasStyle:false, hasRich:false, hasListBar:false, defAlign:''     },
    ],
  },
  {
    label: 'Links y Archivos', icon: '🔗',
    types: [
      { key:'url',  label:'Enlace Web',           desc:'Dirección de internet (https://...)', descLarga:'Agrega un enlace a una página de internet. Escriba la dirección completa, por ejemplo: https://www.conamed.gob.mx',                                                        chip:'chip-url',  htmlTag:'a',   cssClases:'doc-url',    hasAlign:true, hasStyle:false, hasRich:false, hasListBar:false, defAlign:'left'   },
      { key:'mail', label:'Correo electrónico',   desc:'Dirección de email',                  descLarga:'Agrega una dirección de correo electrónico. Al hacer clic, abrirá el programa de correo del lector.',                                                                      chip:'chip-mail', htmlTag:'a',   cssClases:'doc-mailto', hasAlign:true, hasStyle:false, hasRich:false, hasListBar:false, defAlign:'left'   },
      { key:'img',  label:'Imagen',               desc:'Foto o ilustración (JPG, PNG)',       descLarga:'Inserta una imagen en el documento. Puede ser una fotografía, logo o ilustración. Formatos permitidos: JPG, PNG.',                                                         chip:'chip-img',  htmlTag:'img', cssClases:'doc-img-full img-center', hasAlign:true, hasStyle:false, hasRich:false, hasListBar:false, defAlign:'center' },
    ],
  },
]

export const ALL_TYPES = TYPE_GROUPS.flatMap((g) => g.types)
export const findType  = (key) => ALL_TYPES.find((t) => t.key === key) || ALL_TYPES[0]
