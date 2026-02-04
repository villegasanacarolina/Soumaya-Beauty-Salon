import { MapPin, Phone, Clock, Mail } from 'lucide-react';

const Ubicaciones = () => {
  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: '300px' }}>
      <section className="bg-card py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-alex-brush text-primary mb-4">
            Encuéntranos
          </h1>
          <p className="text-xl text-foreground max-w-2xl mx-auto">
            Visítanos en nuestro salón y vive una experiencia única de belleza
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="bg-card rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3693.5!2d-100.975!3d22.15!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDA5JzAwLjAiTiAxMDDCsDU4JzMwLjAiVw!5e0!3m2!1sen!2smx!4v1234567890"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de Soumaya Beauty Bar"
                ></iframe>
              </div>
              
              {/* Imagen grande del salón */}
              <div className="bg-card rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="/images/ubicaciones/tienda-exterior.jpg"
                  alt="Exterior del Soumaya Beauty Bar"
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-card p-6 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-alex-brush text-primary mb-2">
                      Dirección
                    </h3>
                    <p className="text-foreground">
                      Calle Principal #123<br />
                      Colonia Centro<br />
                      San Luis Potosí, SLP<br />
                      CP 78000
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-alex-brush text-primary mb-2">
                      Teléfono
                    </h3>
                    <p className="text-foreground">
                      <a href="tel:+523511270276" className="hover:text-primary transition-colors">
                        +52 351 127 0276
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-alex-brush text-primary mb-2">
                      Email
                    </h3>
                    <p className="text-foreground">
                      <a href="mailto:contacto@soumayabeautybar.com" className="hover:text-primary transition-colors">
                        contacto@soumayabeautybar.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-alex-brush text-primary mb-2">
                      Horario
                    </h3>
                    <div className="text-foreground space-y-1">
                      <p>Lunes a Viernes: 10:00 AM - 8:00 PM</p>
                      <p>Sábado: 10:00 AM - 6:00 PM</p>
                      <p>Domingo: Cerrado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-alex-brush text-white mb-4">
            ¿Lista para visitarnos?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Agenda tu cita ahora y prepárate para una experiencia única
          </p>
          <a
            href="/reservaciones"
            className="inline-block bg-white text-primary hover:bg-background px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Reservar Cita
          </a>
        </div>
      </section>
    </div>
  );
};

export default Ubicaciones;