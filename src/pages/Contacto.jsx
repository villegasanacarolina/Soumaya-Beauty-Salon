import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';

const Contacto = () => {
  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: '300px' }}>
      {/* Header */}
      <section className="bg-card py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-alex-brush text-primary mb-4">
            Información de Contacto
          </h1>
        </div>
      </section>

      {/* Contenido Principal */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Información de contacto */}
          <div className="bg-card p-8 rounded-2xl shadow-lg space-y-8">
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Phone className="w-8 h-8 text-primary flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">Teléfono</h3>
                  <a href="tel:+523511270276" className="text-xl text-foreground hover:text-primary transition-colors">
                    +52 351 127 0276
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Mail className="w-8 h-8 text-primary flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">Email</h3>
                  <a href="mailto:contacto@soumayabeautybar.com" className="text-xl text-foreground hover:text-primary transition-colors">
                    contacto@soumayabeautybar.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="bg-primary/10 p-4 rounded-full">
                  <MapPin className="w-8 h-8 text-primary flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">Dirección</h3>
                  <p className="text-xl text-foreground">
                    Calle Principal #123<br />
                    Colonia Centro<br />
                    San Luis Potosí, SLP 78000
                  </p>
                </div>
              </div>
            </div>

            {/* Horario de Atención */}
            <div className="pt-8 border-t border-border">
              <h3 className="text-3xl font-alex-brush text-primary mb-6">
                Horario de Atención
              </h3>
              <div className="space-y-3 text-xl text-foreground">
                <p><strong>Lunes - Viernes:</strong> 10:00 AM - 8:00 PM</p>
                <p><strong>Sábado:</strong> 10:00 AM - 6:00 PM</p>
                <p><strong>Domingo:</strong> Cerrado</p>
              </div>
            </div>

            {/* Redes Sociales - Botones MÁS GRANDES */}
            <div className="pt-8 border-t border-border">
              <h3 className="text-3xl font-alex-brush text-primary mb-8 text-center">
                Síguenos en redes
              </h3>
              <div className="flex flex-wrap justify-center gap-6">
                <a
                  href="https://facebook.com/soumayabeautysalon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl min-w-[200px] min-h-[200px]"
                >
                  <Facebook className="w-16 h-16 mb-4" />
                  <span className="text-2xl font-semibold">Facebook</span>
                </a>
                
                <a
                  href="https://instagram.com/soumayabeautysalon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 text-white p-8 rounded-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl min-w-[200px] min-h-[200px]"
                >
                  <Instagram className="w-16 h-16 mb-4" />
                  <span className="text-2xl font-semibold">Instagram</span>
                </a>
                
                <a
                  href="https://wa.me/523511270276"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center bg-green-600 hover:bg-green-700 text-white p-8 rounded-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl min-w-[200px] min-h-[200px]"
                >
                  <MessageCircle className="w-16 h-16 mb-4" />
                  <span className="text-2xl font-semibold">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contacto;