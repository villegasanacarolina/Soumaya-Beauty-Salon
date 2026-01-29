import { Link } from 'react-router-dom';
import Carousel from '../components/ui/Carousel';

const Home = () => {
  const heroImages = [
    '/images/home/hero1.jpg',
    '/images/home/hero2.jpg',
    '/images/home/hero3.jpg',
  ];

  const services = [
    {
      title: 'Uñas de Gel',
      description: 'Manicure profesional con acabado perfecto y duradero',
      image: 'public/images/servicios/gel-main.jpg',
      link: '/servicios/unas-gel',
    },
    {
      title: 'Tratamiento de Keratina',
      description: 'Cabello suave, brillante y sin frizz por meses',
      image: 'public/images/servicios/index/keratina-main.jpg',
      link: '/servicios/keratina',
    },
    {
      title: 'Extensión de Pestañas',
      description: 'Mirada impactante con pestañas naturales y voluminosas',
      image: 'public/images/servicios/index/pestanas-main.jpg',
      link: '/servicios/pestanas',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section con Carrusel - MODIFICADO */}
      <section className="relative h-screen" style={{ marginTop: '280px' }}>
        <Carousel images={heroImages} autoPlayInterval={5000} />
        
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Contenedor con fondo blanco */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl mx-4">
            <div className="text-center">
              {/* Título en rosa y cursiva */}
              <h1 className="text-5xl md:text-7xl font-alex-brush text-pink-500 italic mb-4">
                Soumaya Beauty Salon
              </h1>
              {/* Subtítulo en negro */}
              <p className="text-xl md:text-2xl mb-8 text-black">
                Donde el cuidado personal se convierte en arte
              </p>
              <Link
                to="/servicios"
                className="inline-block bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors"
              >
                Descubre Nuestros Servicios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Destacados */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-alex-brush text-primary text-center mb-12">
            Nuestros Servicios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Link
                key={index}
                to={service.link}
                className="group bg-background rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-alex-brush text-primary mb-2">
                    {service.title}
                  </h3>
                  <p className="text-foreground">
                    {service.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/servicios"
              className="inline-block bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Ver Todos los Servicios
            </Link>
          </div>
        </div>
      </section>

      {/* Sección Sobre Nosotros */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-alex-brush text-primary mb-6">
            Sobre Nosotros
          </h2>
          <p className="text-lg text-foreground mb-6">
            En Soumaya Beauty Bar, creemos que el cuidado personal es una forma de arte. 
            Nuestro equipo de profesionales altamente capacitados se dedica a realzar tu 
            belleza natural con técnicas innovadoras y productos de la más alta calidad.
          </p>
          <p className="text-lg text-foreground">
            Cada visita es una experiencia personalizada donde tu comodidad y satisfacción 
            son nuestra prioridad. Te invitamos a descubrir un espacio donde la belleza 
            y el bienestar se encuentran.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-alex-brush mb-6">
            ¿Lista para tu transformación?
          </h2>
          <p className="text-xl mb-8">
            Agenda tu cita hoy y descubre la mejor versión de ti
          </p>
          <Link
            to="/reservaciones"
            className="inline-block bg-white text-primary hover:bg-background px-8 py-3 rounded-full text-lg font-semibold transition-colors"
          >
            Reservar Ahora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;