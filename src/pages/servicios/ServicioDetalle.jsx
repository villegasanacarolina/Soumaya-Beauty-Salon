import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import Carousel from '../../components/ui/Carousel';
import { getServiciosRelacionados } from '../../data/serviciosData';
import { Clock, DollarSign, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ServicioDetalle({ servicio }) {
  const serviciosRelacionados = getServiciosRelacionados(servicio.relacionados);

  // MAPA DE SLUG A PREFIJO
  const prefixMap = {
    'unas-gel': 'gel',
    'unas-acrilicas': 'acrilicas',
    'pedicure': 'pedicure',
    'keratina': 'keratina',
    'tinte': 'tinte',
    'pestanas': 'pestanas',
    'cejas': 'cejas'
  };

  const prefix = prefixMap[servicio.slug] || servicio.slug;

  // CARRUSEL PRINCIPAL (3 imágenes: 1-3)
  const carruselImages = [
    `/images/servicios/${servicio.slug}/${prefix}-1.jpg`,
    `/images/servicios/${servicio.slug}/${prefix}-2.jpg`,
    `/images/servicios/${servicio.slug}/${prefix}-3.jpg`
  ];

  // GRID 3x3 (9 imágenes: 1-9)
  const gridImages = Array.from({ length: 9 }, (_, i) => 
    `/images/servicios/${servicio.slug}/${prefix}-${i + 1}.jpg`
  );

  const breadcrumbItems = [
    { label: 'Servicios', href: '/servicios' },
    { label: servicio.nombre }
  ];

  return (
    <div className="page-container" style={{ paddingTop: '250px' }}>
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4">
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Botón regresar */}
        <Link
          to="/servicios"
          className="inline-flex items-center gap-2 text-rosa hover:text-rosa-dark transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar a Servicios
        </Link>
      </div>

      {/* Título principal */}
      <section className="text-center py-8">
        <h1 className="text-5xl md:text-7xl font-alex-brush text-rosa mb-4">
          {servicio.nombre}
        </h1>
        <p className="text-xl text-texto dark:text-crema max-w-3xl mx-auto px-4">
          {servicio.descripcionCorta}
        </p>
      </section>

      {/* Carrusel */}
      <section className="py-8 px-4">
        <Carousel images={carruselImages} />
      </section>

      {/* Información principal */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Columna principal */}
          <div className="lg:col-span-2">
            {/* Descripción */}
            <div className="mb-12">
              <h2 className="text-3xl font-alex-brush text-rosa mb-4">
                Sobre este servicio
              </h2>
              <p className="text-lg text-texto dark:text-crema leading-relaxed">
                {servicio.descripcionLarga}
              </p>
            </div>

            {/* Beneficios */}
            <div className="mb-12">
              <h2 className="text-3xl font-alex-brush text-rosa mb-6">
                Beneficios
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servicio.beneficios.map((beneficio, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-rosa flex-shrink-0 mt-1" />
                    <span className="text-texto dark:text-crema">{beneficio}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ¿Qué incluye? */}
            <div className="mb-12">
              <h2 className="text-3xl font-alex-brush text-rosa mb-6">
                ¿Qué incluye?
              </h2>
              <ul className="space-y-3">
                {servicio.incluye.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-rosa mt-2 flex-shrink-0" />
                    <span className="text-texto dark:text-crema">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Carrusel Grid 3x3 */}
            <div>
              <h2 className="text-3xl font-alex-brush text-rosa mb-6">
                Galería del Servicio
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {gridImages.map((image, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={image}
                      alt={`${servicio.nombre} - Imagen ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-crema-dark dark:bg-negro-claro p-8 rounded-lg shadow-lg">
              {/* Precio */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-gris dark:text-gris-claro mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm uppercase tracking-wide">Precio</span>
                </div>
                <p className="text-4xl font-bold text-rosa">
                  ${servicio.precio}
                  <span className="text-lg font-normal text-gris dark:text-gris-claro ml-2">
                    MXN
                  </span>
                </p>
                <p className="text-sm text-gris dark:text-gris-claro mt-1">
                  Precio desde
                </p>
              </div>

              {/* Duración */}
              <div className="mb-8 pb-8 border-b border-gris dark:border-gris-oscuro">
                <div className="flex items-center gap-2 text-gris dark:text-gris-claro mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm uppercase tracking-wide">Duración</span>
                </div>
                <p className="text-2xl font-semibold text-texto dark:text-crema">
                  {servicio.duracion}
                </p>
              </div>

              {/* CTA */}
              <Link
                to="/contacto"
                className="block w-full bg-rosa hover:bg-rosa-dark text-white text-center px-6 py-4 rounded-full transition-all duration-300 font-semibold"
              >
                Agendar este servicio
              </Link>

              <p className="text-xs text-center text-gris dark:text-gris-claro mt-4">
                Respuesta en menos de 24 horas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios relacionados */}
      {serviciosRelacionados.length > 0 && (
        <section className="bg-crema-dark dark:bg-negro py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-alex-brush text-rosa text-center mb-12">
              También te podría interesar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {serviciosRelacionados.map((servicioRel) => (
                <Link
                  key={servicioRel.id}
                  to={`/servicios/${servicioRel.slug}`}
                  className="group bg-crema dark:bg-negro-claro rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={`/images/servicios/${servicioRel.slug}/${prefixMap[servicioRel.slug] || servicioRel.slug}-main.jpg`}
                      alt={servicioRel.nombre}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-alex-brush text-rosa mb-2">
                      {servicioRel.nombre}
                    </h3>
                    <p className="text-sm text-texto dark:text-crema mb-4">
                      {servicioRel.descripcionCorta}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-rosa font-semibold">
                        Desde ${servicioRel.precio}
                      </span>
                      <ArrowRight className="w-5 h-5 text-rosa group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}