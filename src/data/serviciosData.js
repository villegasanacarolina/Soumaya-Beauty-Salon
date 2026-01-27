export const serviciosData = [
  {
    id: 'unas-gel',
    nombre: 'Uñas de Gel',
    slug: 'unas-gel',
    descripcionCorta: 'Manicure con esmalte en gel de larga duración',
    descripcionLarga: 'Manicure profesional con esmalte en gel de alta calidad. Nuestro tratamiento incluye preparación completa de las uñas, aplicación de gel premium y un acabado impecable que dura hasta 3 semanas sin perder brillo ni color.',
    precio: 450,
    duracion: '60-90 min',
    imagenPrincipal: '/images/servicios/index/gel-main.jpg',
    carrusel: [
      '/images/servicios/unas-gel/gel-1.jpg',
      '/images/servicios/unas-gel/gel-2.jpg',
      '/images/servicios/unas-gel/gel-3.jpg',
      '/images/servicios/unas-gel/gel-4.jpg'
    ],
    beneficios: [
      'Duración hasta 3 semanas',
      'Brillo perfecto y duradero',
      'Secado instantáneo con luz UV',
      'No daña las uñas naturales',
      'Amplia variedad de colores'
    ],
    incluye: [
      'Limado y forma de uñas',
      'Tratamiento de cutícula',
      'Aplicación de base, color y top coat',
      'Diseño básico incluido',
      'Hidratación con aceites'
    ],
    relacionados: ['unas-acrilicas', 'pedicure']
  },
  {
    id: 'unas-acrilicas',
    nombre: 'Uñas Acrílicas',
    slug: 'unas-acrilicas',
    descripcionCorta: 'Extensiones de uñas con acrílico de alta calidad',
    descripcionLarga: 'Extensiones de uñas con acrílico premium que te permiten lucir uñas largas y resistentes. Perfectas para quienes desean mayor longitud, diseños elaborados o necesitan corregir la forma de sus uñas naturales.',
    precio: 600,
    duracion: '90-120 min',
    imagenPrincipal: '/images/servicios/index/acrilico-main.jpg',
    carrusel: [
      '/images/servicios/unas-acrilicas/acrilico-1.jpg',
      '/images/servicios/unas-acrilicas/acrilico-2.jpg',
      '/images/servicios/unas-acrilicas/acrilico-3.jpg',
      '/images/servicios/unas-acrilicas/acrilico-4.jpg'
    ],
    beneficios: [
      'Mayor longitud instantánea',
      'Resistencia superior',
      'Perfectas para diseños elaborados',
      'Corrección de forma de uñas',
      'Duración de 3-4 semanas'
    ],
    incluye: [
      'Preparación de uña natural',
      'Aplicación de tips o moldes',
      'Esculpido con acrílico',
      'Limado y pulido perfecto',
      'Diseño y decoración'
    ],
    relacionados: ['unas-gel', 'cejas']
  },
  {
    id: 'pedicure',
    nombre: 'Pedicure Premium',
    slug: 'pedicure',
    descripcionCorta: 'Tratamiento completo de pies con hidratación profunda',
    descripcionLarga: 'Pedicure de lujo que incluye exfoliación, hidratación profunda y masaje relajante. Tus pies lucirán suaves, cuidados y perfectamente esmaltados con productos premium.',
    precio: 500,
    duracion: '60 min',
    imagenPrincipal: '/images/servicios/index/pedicure-main.jpg',
    carrusel: [
      '/images/servicios/pedicure/pedicure-1.jpg',
      '/images/servicios/pedicure/pedicure-2.jpg',
      '/images/servicios/pedicure/pedicure-3.jpg',
      '/images/servicios/pedicure/pedicure-4.jpg'
    ],
    beneficios: [
      'Exfoliación profunda',
      'Hidratación intensiva',
      'Masaje relajante incluido',
      'Pies suaves como seda',
      'Esmaltado de larga duración'
    ],
    incluye: [
      'Remojo con sales aromáticas',
      'Exfoliación con scrub',
      'Tratamiento de cutícula',
      'Masaje de pies y piernas',
      'Esmaltado tradicional o gel'
    ],
    relacionados: ['unas-gel', 'unas-acrilicas']
  },
  {
    id: 'keratina',
    nombre: 'Tratamiento de Keratina',
    slug: 'keratina',
    descripcionCorta: 'Alisado y nutrición profunda con keratina brasileña',
    descripcionLarga: 'Tratamiento de keratina brasileña que alisa, nutre y repara tu cabello desde la raíz hasta las puntas. Reduce el frizz hasta en 95% y proporciona un brillo espectacular por meses.',
    precio: 1200,
    duracion: '120-180 min',
    imagenPrincipal: '/images/servicios/index/keratina-main.jpg',
    carrusel: [
      '/images/servicios/keratina/keratina-1.jpg',
      '/images/servicios/keratina/keratina-2.jpg',
      '/images/servicios/keratina/keratina-3.jpg',
      '/images/servicios/keratina/keratina-4.jpg'
    ],
    beneficios: [
      'Cabello perfectamente liso',
      'Brillo intenso y natural',
      'Reduce frizz hasta 95%',
      'Protección térmica',
      'Duración de 3-6 meses'
    ],
    incluye: [
      'Lavado con shampoo especial',
      'Aplicación de keratina premium',
      'Planchado profesional',
      'Sellado con calor',
      'Tratamiento acondicionador'
    ],
    relacionados: ['tinte']
  },
  {
    id: 'tinte',
    nombre: 'Tinte Profesional',
    slug: 'tinte',
    descripcionCorta: 'Coloración profesional con productos premium',
    descripcionLarga: 'Servicio de coloración con tintes profesionales de última generación. Incluye consultoría personalizada de color para encontrar el tono perfecto que realce tu belleza natural.',
    precio: 800,
    duracion: '90 min',
    imagenPrincipal: '/images/servicios/index/tinte-main.jpg',
    carrusel: [
      '/images/servicios/tinte/tinte-1.jpg',
      '/images/servicios/tinte/tinte-2.jpg',
      '/images/servicios/tinte/tinte-3.jpg',
      '/images/servicios/tinte/tinte-4.jpg'
    ],
    beneficios: [
      'Color duradero y vibrante',
      'Cobertura total de canas',
      'Brillo natural',
      'Sin daño al cabello',
      'Amplia gama de tonos'
    ],
    incluye: [
      'Consultoría de color personalizada',
      'Aplicación profesional',
      'Lavado con productos premium',
      'Tratamiento acondicionador',
      'Secado y peinado'
    ],
    relacionados: ['keratina']
  },
  {
    id: 'pestanas',
    nombre: 'Extensión de Pestañas',
    slug: 'pestanas',
    descripcionCorta: 'Extensiones pelo a pelo para mirada impactante',
    descripcionLarga: 'Aplicación de extensiones de pestañas pelo a pelo con técnica profesional. Logra una mirada profunda e impactante con pestañas que lucen completamente naturales.',
    precio: 900,
    duracion: '120 min',
    imagenPrincipal: '/images/servicios/index/pestanas-main.jpg',
    carrusel: [
      '/images/servicios/pestanas/pestanas-1.jpg',
      '/images/servicios/pestanas/pestanas-2.jpg',
      '/images/servicios/pestanas/pestanas-3.jpg',
      '/images/servicios/pestanas/pestanas-4.jpg'
    ],
    beneficios: [
      'Volumen natural',
      'Larga duración (3-4 semanas)',
      'Sin necesidad de rímel',
      'Look personalizado',
      'Resistentes al agua'
    ],
    incluye: [
      'Consultoría de estilo',
      'Aplicación pelo a pelo',
      'Extensiones de alta calidad',
      'Sellado profesional',
      'Guía de cuidados'
    ],
    relacionados: ['cejas']
  },
  {
    id: 'cejas',
    nombre: 'Diseño de Cejas',
    slug: 'cejas',
    descripcionCorta: 'Perfilado y diseño profesional de cejas',
    descripcionLarga: 'Diseño profesional de cejas adaptado a la forma de tu rostro. Incluye análisis facial, depilación con técnica avanzada y perfilado perfecto para enmarcar tu mirada.',
    precio: 350,
    duracion: '30 min',
    imagenPrincipal: '/images/servicios/index/cejas-main.jpg',
    carrusel: [
      '/images/servicios/cejas/cejas-1.jpg',
      '/images/servicios/cejas/cejas-2.jpg',
      '/images/servicios/cejas/cejas-3.jpg',
      '/images/servicios/cejas/cejas-4.jpg'
    ],
    beneficios: [
      'Marco perfecto para tu rostro',
      'Look definido y profesional',
      'Técnicas modernas',
      'Resultados inmediatos',
      'Realza tu belleza natural'
    ],
    incluye: [
      'Análisis de forma facial',
      'Diseño personalizado',
      'Depilación profesional',
      'Perfilado con hilo o pinza',
      'Tinte opcional'
    ],
    relacionados: ['pestanas', 'tinte']
  }
];

// Función helper para obtener servicio por slug
export const getServicioBySlug = (slug) => {
  return serviciosData.find(servicio => servicio.slug === slug);
};

// Función helper para obtener servicios relacionados
export const getServiciosRelacionados = (relacionadosIds) => {
  return serviciosData.filter(servicio => relacionadosIds.includes(servicio.id));
};