import { useState } from 'react';
import { Send, Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';

const Contacto = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: '',
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    // Simulación de envío
    setTimeout(() => {
      setSending(false);
      setSuccess(true);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        asunto: '',
        mensaje: '',
      });

      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: '300px' }}>
      {/* Header */}
      <section className="bg-card py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-alex-brush text-primary mb-4">
            Contáctanos
          </h1>
          <p className="text-xl text-foreground max-w-2xl mx-auto">
            ¿Tienes preguntas? Estamos aquí para ayudarte
          </p>
        </div>
      </section>

      {/* Contenido Principal */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Formulario */}
            <div className="bg-card p-8 rounded-2xl shadow-lg">
              <h2 className="text-3xl font-alex-brush text-primary mb-6">
                Envíanos un mensaje
              </h2>

              {success && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg">
                  ¡Mensaje enviado exitosamente! Te contactaremos pronto.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-input rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
                    placeholder="María García"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-input rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
                    placeholder="maria@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-input rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
                    placeholder="+52 555 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Asunto
                  </label>
                  <input
                    type="text"
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-input rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
                    placeholder="Consulta sobre servicios"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Mensaje
                  </label>
                  <textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-input rounded-lg focus:border-primary focus:outline-none bg-background text-foreground resize-none"
                    placeholder="Escribe tu mensaje aquí..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar Mensaje
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-6">
              {/* Mapa */}
              <div className="bg-card p-6 rounded-2xl shadow-lg">
                <h2 className="text-3xl font-alex-brush text-primary mb-6">
                  Ubicación
                </h2>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3700.123456789!2d-100.987654321!3d22.123456789!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDA5JzAwLjAiTiAxMDDCsDU4JzMwLjAiVw!5e0!3m2!1ses!2smx!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación Soumaya Beauty Salon"
                  ></iframe>
                </div>
              </div>

              {/* Imagen del salón */}
              <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
                <img
                  src="/images/contacto/salon-interior.jpg"
                  alt="Interior del Soumaya Beauty Salon"
                  className="w-full h-64 object-cover"
                />
              </div>

              {/* Información de contacto */}
              <div className="bg-card p-6 rounded-2xl shadow-lg">
                <h2 className="text-3xl font-alex-brush text-primary mb-6">
                  Información de Contacto
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Teléfono</h3>
                      <a href="tel:+523511270276" className="text-foreground hover:text-primary transition-colors">
                        +52 351 127 0276
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <a href="mailto:contacto@soumayabeautybar.com" className="text-foreground hover:text-primary transition-colors">
                        contacto@soumayabeautybar.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Dirección</h3>
                      <p className="text-foreground">
                        Calle Principal #123<br />
                        Colonia Centro<br />
                        San Luis Potosí, SLP 78000
                      </p>
                    </div>
                  </div>
                </div>

                {/* Redes Sociales */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="text-xl font-alex-brush text-primary mb-4">
                    Síguenos en redes
                  </h3>
                  <div className="flex gap-4">
                    <a
                      href="https://facebook.com/soumayabeautysalon"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Facebook className="w-5 h-5" />
                      Facebook
                    </a>
                    <a
                      href="https://instagram.com/soumayabeautysalon"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                      Instagram
                    </a>
                    <a
                      href="https://wa.me/523511270276"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-alex-brush text-primary mb-4">
                  Horario de Atención
                </h3>
                <div className="space-y-2 text-foreground">
                  <p><strong>Lunes - Viernes:</strong> 10:00 AM - 8:00 PM</p>
                  <p><strong>Sábado:</strong> 10:00 AM - 6:00 PM</p>
                  <p><strong>Domingo:</strong> Cerrado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contacto;