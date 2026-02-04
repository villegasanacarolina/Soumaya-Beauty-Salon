import { Link } from 'react-router-dom';
import { Clock, DollarSign, ArrowRight } from 'lucide-react';

const ServiciosIndex = () => {
  const servicios = [
    {
      id: 'unas-gel',
      titulo: 'Uñas de Gel',
      descripcion: 'Manicure profesional con acabado perfecto y duradero',
      precio: '$450',
      duracion: '60 min',
      imagen: '/images/servicios/unas-gel/gel-main.jpg',
    },
    {
      id: 'unas-acrilicas',
      titulo: 'Uñas Acrílicas',
      descripcion: 'Uñas con extensión de acrílico y diseños personalizados',
      precio: '$600',
      duracion: '90 min',
      imagen: '/images/servicios/unas-acrilicas/acrilicas-main.jpg',
    },
    {
      id: 'pedicure',
      titulo: 'Pedicure Premium',
      descripcion: 'Tratamiento completo para pies con exfoliación y masaje',
      precio: '$500',
      duracion: '90 min',
      imagen: '/images/servicios/pedicure/pedicure-main.jpg',
    },
    {
      id: 'keratina',
      titulo: 'Tratamiento de Keratina',
      descripcion: 'Cabello suave, brillante y sin frizz por meses',
      precio: '$1,200',
      duracion: '180 min',
      imagen: '/images/servicios/keratina/keratina-main.jpg',
    },
    {
      id: 'tinte',
      titulo: 'Tinte Profesional',
      descripcion: 'Coloración profesional con productos de alta calidad',
      precio: '$800',
      duracion: '180 min',
      imagen: '/images/servicios/tinte/tinte-main.jpg',
    },
    {
      id: 'pestanas',
      titulo: 'Extensión de Pestañas',
      descripcion: 'Mirada impactante con pestañas naturales y voluminosas',
      precio: '$900',
      duracion: '60 min',
      imagen: '/images/servicios/pestanas/pestanas-main.jpg',
    },
    {
      id: 'cejas',
      titulo: 'Diseño de Cejas',
      descripcion: 'Perfilado y diseño profesional de cejas',
      precio: '$350',
      duracion: '30 min',
      imagen: '/images/servicios/cejas/cejas-main.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: '300px' }}>
      {/* Hero Section */}
      <section className="bg-card py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-alex-brush text-primary mb-4">
            Nuestros Servicios
          </h1>
          <p className="text-xl text-foreground max-w-2xl mx-auto">
            Descubre nuestra amplia gama de tratamientos de belleza diseñados para realzar tu belleza natural
          </p>
        </div>
      </section>

      {/* Servicios Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((servicio) => (
              <div
                key={servicio.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={servicio.imagen}
                    alt={servicio.titulo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-alex-brush text-primary mb-2">
                    {servicio.titulo}
                  </h2>
                  <p className="text-foreground mb-4">
                    {servicio.descripcion}
                  </p>
                  <div className="flex items-center justify-between mb-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-semibold">{servicio.precio}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>{servicio.duracion}</span>
                    </div>
                  </div>
                  
                  {/* Botón Ver más */}
                  <Link
                    to={`/servicios/${servicio.id}`}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    Ver más
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-alex-brush text-white mb-4">
            ¿Lista para tu cita?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Agenda ahora y recibe atención personalizada
          </p>
          <Link
            to="/reservaciones"
            className="inline-block bg-white text-primary hover:bg-background px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Reservar Ahora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ServiciosIndex;