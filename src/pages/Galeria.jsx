import { useState } from 'react';
import { X } from 'lucide-react';

const Galeria = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const images = [
    { id: 1, src: '/images/galeria/obra-1.jpg', category: 'uñas', alt: 'Diseño de uñas gel' },
    { id: 2, src: '/images/galeria/obra-2.jpg', category: 'cabello', alt: 'Tratamiento de keratina' },
    { id: 3, src: '/images/galeria/obra-3.jpg', category: 'pestañas', alt: 'Extensión de pestañas' },
    { id: 4, src: '/images/galeria/obra-4.jpg', category: 'uñas', alt: 'Uñas acrílicas' },
    { id: 5, src: '/images/galeria/obra-5.jpg', category: 'cejas', alt: 'Diseño de cejas' },
    { id: 6, src: '/images/galeria/obra-6.jpg', category: 'cabello', alt: 'Tinte profesional' },
    { id: 7, src: '/images/galeria/obra-7.jpg', category: 'pedicure', alt: 'Pedicure premium' },
    { id: 8, src: '/images/galeria/obra-8.jpg', category: 'uñas', alt: 'Arte en uñas' },
    { id: 9, src: '/images/galeria/obra-9.jpg', category: 'cabello', alt: 'Corte y peinado' },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: '300px' }}>
      <section className="bg-card py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-alex-brush text-primary mb-4">
            Galería
          </h1>
          <p className="text-xl text-foreground max-w-2xl mx-auto">
            Descubre nuestro trabajo y déjate inspirar por las transformaciones que hemos creado
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                onClick={() => setSelectedImage(image)}
                className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold">
                    Ver imagen
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-primary transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage.src}
            alt={selectedImage.alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-alex-brush text-primary mb-4">
            ¿Te gustó lo que viste?
          </h2>
          <p className="text-xl text-foreground mb-8">
            Agenda tu cita y experimenta la transformación
          </p>
          <a
            href="/reservaciones"
            className="inline-block bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Reservar Ahora
          </a>
        </div>
      </section>
    </div>
  );
};

export default Galeria;