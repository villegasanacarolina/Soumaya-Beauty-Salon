import { Link } from 'react-router-dom';
import { Clock, DollarSign, Calendar } from 'lucide-react';
import Carousel from '../../components/Carousel';

const UnasGel = () => {
  const images = [
    '/images/servicios/unas-gel-1.jpg',
    '/images/servicios/unas-gel-2.jpg',
    '/images/servicios/unas-gel-3.jpg',
  ];

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: '300px' }}>
      {/* Hero con Carrusel */}
      <section className="relative h-96">
        <Carousel images={images} autoPlayInterval={4000} />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-5xl md:text-6xl font-alex-brush text-white text-center px-4">
            Uñas de Gel
          </h1>
        </div>
      </section>

      {/* Información del Servicio */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="w-6 h-6 text-primary" />
                <span className="font-semibold">60 minutos</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <DollarSign className="w-6 h-6 text-primary" />
                <span className="font-semibold">$450 MXN</span>
              </div>
            </div>

            <h2 className="text-3xl font-alex-brush text-primary mb-4">
              Descripción
            </h2>
            <p className="text-foreground mb-6 leading-relaxed">
              Nuestro servicio de uñas de gel ofrece un acabado perfecto, brillante y duradero. 
              Utilizamos productos de la más alta calidad que protegen y embellecen tus uñas 
              naturales, proporcionando un resultado profesional que puede durar hasta 3 semanas.
            </p>

            <h2 className="text-3xl font-alex-brush text-primary mb-4">
              Beneficios
            </h2>
            <ul className="space-y-3 text-foreground mb-6">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Acabado brillante y profesional</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Mayor duración (2-3 semanas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>No daña la uña natural</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Amplia variedad de colores</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Secado rápido con lámpara UV/LED</span>
              </li>
            </ul>

            <h2 className="text-3xl font-alex-brush text-primary mb-4">
              El Proceso
            </h2>
            <ol className="space-y-3 text-foreground">
              <li className="flex gap-3">
                <span className="font-semibold text-primary">1.</span>
                <span>Preparación y limpieza de la uña natural</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">2.</span>
                <span>Aplicación de base protectora</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">3.</span>
                <span>Aplicación del color en capas finas</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">4.</span>
                <span>Secado con lámpara UV/LED</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary">5.</span>
                <span>Aplicación de top coat para mayor brillo y duración</span>
              </li>
            </ol>
          </div>

          {/* Call to Action */}
          <div className="bg-primary rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-alex-brush text-white mb-4">
              ¿Lista para lucir uñas perfectas?
            </h2>
            <p className="text-white/90 mb-6">
              Agenda tu cita ahora y disfruta de un manicure profesional
            </p>
            <Link
              to="/reservaciones"
              className="inline-flex items-center gap-2 bg-white text-primary hover:bg-background px-8 py-3 rounded-full font-semibold transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Reservar Ahora
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UnasGel;