import { Link } from 'react-router-dom';
import { serviciosData } from '../data/serviciosData';
import { ArrowRight, Clock, DollarSign } from 'lucide-react';

export default function ServiciosIndex() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="hero-section text-center py-16">
        <h1 className="text-5xl md:text-7xl font-alex-brush text-rosa mb-6">
          Nuestros Servicios
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto text-texto dark:text-crema">
          Descubre nuestra amplia gama de servicios de belleza premium, 
          diseñados para realzar tu belleza natural con productos de la más alta calidad.
        </p>
      </section>

      {/* Servicios Grid */}
      <section className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
          {serviciosData.map((servicio) => (
            <div
              key={servicio.id}
              className="servicio-card group bg-crema dark:bg-negro-claro rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              {/* Imagen */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={servicio.imagenPrincipal}
                  alt={servicio.nombre}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-negro/60 to-transparent" />
              </div>

              {/* Contenido */}
              <div className="p-6">
                <h3 className="text-3xl font-alex-brush text-rosa mb-3">
                  {servicio.nombre}
                </h3>
                
                <p className="text-texto dark:text-crema mb-4">
                  {servicio.descripcionCorta}
                </p>

                {/* Info rápida */}
                <div className="flex items-center gap-4 mb-6 text-sm text-gris dark:text-gris-claro">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{servicio.duracion}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>Desde ${servicio.precio}</span>
                  </div>
                </div>

                {/* Botón */}
                <Link
                  to={`/servicios/${servicio.slug}`}
                  className="inline-flex items-center gap-2 bg-rosa hover:bg-rosa-dark text-white px-6 py-3 rounded-full transition-all duration-300 group-hover:gap-4"
                >
                  Ver más
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-crema-dark dark:bg-negro">
        <h2 className="text-4xl md:text-5xl font-alex-brush text-rosa mb-6">
          ¿Lista para transformar tu look?
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/galeria"
            className="bg-transparent border-2 border-rosa text-rosa hover:bg-rosa hover:text-white px-8 py-3 rounded-full transition-all duration-300"
          >
            Ver Galería
          </Link>
          <Link
            to="/contacto"
            className="bg-rosa hover:bg-rosa-dark text-white px-8 py-3 rounded-full transition-all duration-300"
          >
            Agendar Cita
          </Link>
        </div>
      </section>
    </div>
  );
}