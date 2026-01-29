import { useState } from 'react';
import { Send, Phone, Mail, MapPin } from 'lucide-react';

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