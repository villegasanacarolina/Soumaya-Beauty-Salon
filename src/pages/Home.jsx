import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const heroImages = [
    '/images/home/hero-1.jpg',
    '/images/home/hero-2.jpg',
    '/images/home/hero-3.jpg',
    '/images/home/hero-4.jpg'
  ];

  const services = [
    {
      title: 'Uñas de Gel',
      description: 'Manicure profesional con acabado perfecto y duradero',
      image: '/images/servicios/unas-gel/gel-main.jpg',
      link: '/servicios/unas-gel',
    },
    {
      title: 'Tratamiento de Keratina',
      description: 'Cabello suave, brillante y sin frizz por meses',
      image: '/images/servicios/keratina/keratina-main.jpg',
      link: '/servicios/keratina',
    },
    {
      title: 'Extensión de Pestañas',
      description: 'Mirada impactante con pestañas naturales y voluminosas',
      image: '/images/servicios/pestanas/pestanas-main.jpg',
      link: '/servicios/pestanas',
    },
  ];

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? heroImages.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Modificada */}
      <section className="relative" style={{ marginTop: '280px' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Texto a la izquierda */}
            <div className="lg:w-1/2">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12">
                <div className="text-center">
                  <h1 className="text-5xl md:text-7xl font-alex-brush text-pink-500 italic mb-4">
                    Soumaya Beauty Salon
                  </h1>
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

            {/* Carrusel a la derecha */}
            <div className="lg:w-1/2 relative">
              <div className="bg-card rounded-2xl shadow-2xl overflow-hidden">
                {/* Contenedor de imagen */}
                <div className="relative aspect-[4/3]">
                  <img
                    src={heroImages[currentImageIndex]}
                    alt={`Hero ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Botones de navegación */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6 text-primary" />
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6 text-primary" />
                  </button>
                </div>
                
                {/* Indicadores */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {heroImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentImageIndex 
                          ? 'bg-primary' 
                          : 'bg-white/70 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>
              </div>
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
              <div
                key={index}
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
                  <p className="text-foreground mb-4">
                    {service.description}
                  </p>
                  <Link
                    to={service.link}
                    className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Ver más
                  </Link>
                </div>
              </div>
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