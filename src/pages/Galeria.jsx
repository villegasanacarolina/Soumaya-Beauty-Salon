import { useState } from 'react';
import { Image as ImageIcon, ZoomIn } from 'lucide-react';

const Galeria = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Array de imágenes de la galería
  const galleryImages = [
    { id: 1, src: '/images/galeria/obra-1.jpg', category: 'gel', alt: 'Uñas de gel' },
    { id: 2, src: '/images/galeria/obra-2.jpg', category: 'acrilico', alt: 'Uñas acrílicas' },
    { id: 3, src: '/images/galeria/obra-3.jpg', category: 'pedicure', alt: 'Pedicure' },
    { id: 4, src: '/images/galeria/obra-4.jpg', category: 'keratina', alt: 'Keratina' },
    { id: 5, src: '/images/galeria/obra-5.jpg', category: 'tinte', alt: 'Tinte' },
    { id: 6, src: '/images/galeria/obra-6.jpg', category: 'pestanas', alt: 'Pestañas' },
    { id: 7, src: '/images/galeria/obra-7.jpg', category: 'cejas', alt: 'Cejas' },
    { id: 8, src: '/images/galeria/obra-8.jpg', category: 'gel', alt: 'Uñas de gel' },
    { id: 9, src: '/images/galeria/obra-9.jpg', category: 'acrilico', alt: 'Uñas acrílicas' },
  ];

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'gel', name: 'Uñas de Gel' },
    { id: 'acrilico', name: 'Uñas Acrílicas' },
    { id: 'pedicure', name: 'Pedicure' },
    { id: 'keratina', name: 'Keratina' },
    { id: 'tinte', name: 'Tinte' },
    { id: 'pestanas', name: 'Pestañas' },
    { id: 'cejas', name: 'Cejas' },
  ];

  const filteredImages = selectedCategory === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="min-h-screen page-container bg-crema dark:bg-negro">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-rosa/10 via-crema to-crema dark:to-negro">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-rosa/10 rounded-full">
            <span className="text-rosa font-semibold">✨ Galería</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-alex-brush text-rosa mb-6">
            Nuestros Trabajos
          </h1>
          
          <p className="text-xl text-texto dark:text-crema max-w-2xl mx-auto">
            Descubre la calidad y belleza de nuestros servicios
          </p>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-8 bg-crema-dark dark:bg-negro-claro sticky top-20 z-10 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-rosa text-white'
                    : 'bg-crema dark:bg-negro text-texto dark:text-crema border-2 border-rosa hover:bg-rosa hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Galería Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-xl shadow-lg cursor-pointer"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-negro/80 via-negro/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="text-white">
                    <p className="font-semibold text-lg">{image.alt}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <ZoomIn className="w-4 h-4" />
                      <span className="text-sm">Click para ampliar</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mensaje si no hay resultados */}
          {filteredImages.length === 0 && (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 text-gris mx-auto mb-4" />
              <p className="text-xl text-gris dark:text-gris-claro">
                No hay imágenes en esta categoría
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-crema-dark dark:bg-negro-claro">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-alex-brush text-rosa mb-4">
            ¿Te gustó lo que viste?
          </h2>
          <p className="text-lg text-texto dark:text-crema mb-8 max-w-2xl mx-auto">
            Agenda tu cita y vive la experiencia Soumaya Beauty Bar
          </p>
          <a href="/contacto">
            <button className="bg-rosa hover:bg-rosa-dark text-white px-8 py-4 rounded-full transition-all duration-300 font-semibold">
              Agendar Cita
            </button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Galeria;