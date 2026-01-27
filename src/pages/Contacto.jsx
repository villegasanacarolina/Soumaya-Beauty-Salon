import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Instagram, Facebook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const Contacto = () => {
  const contactMethods = [
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Teléfono",
      description: "Llámanos de Lun - Dom, 10AM - 9PM",
      content: "+52 33 1234 5678",
      action: "tel:+523312345678",
      buttonText: "Llamar"
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Email",
      description: "Respuesta en menos de 24 horas",
      content: "soumayabeautysalon@gmail.com",
      action: "mailto:soumayabeautysalon@gmail.com",
      buttonText: "Enviar email"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Ubicación",
      description: "Visítanos en Andares",
      content: "Local 123, Andares Zapopan",
      action: "/ubicaciones",
      buttonText: "Ver mapa"
    }
  ]

  const faqs = [
    {
      question: "¿Necesito hacer cita previa?",
      answer: "Sí, trabajamos únicamente con cita previa para garantizar una atención personalizada y sin esperas."
    },
    {
      question: "¿Cuál es su política de cancelación?",
      answer: "Puedes cancelar o reagendar tu cita con al menos 24 horas de anticipación sin ningún cargo."
    },
    {
      question: "¿Qué productos utilizan?",
      answer: "Trabajamos exclusivamente con marcas premium internacionales de la más alta calidad."
    },
    {
      question: "¿Ofrecen servicios a domicilio?",
      answer: "Por el momento solo atendemos en nuestro salón de Andares para garantizar la mejor experiencia."
    }
  ]

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-primary font-semibold">💬 Contáctanos</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Estamos aquí para ti
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              ¿Tienes dudas? ¿Quieres agendar una cita? Contáctanos por el medio que prefieras
            </p>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Síguenos en redes sociales</h2>
            <p className="text-muted-foreground mb-6">
              Mantente al día con nuestras promociones, tips de belleza y trabajos recientes
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center max-w-3xl mx-auto">
            <a
              href="https://wa.me/3511270276"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[250px]"
            >
              <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </Button>
            </a>

            <a
              href="https://facebook.com/soumayabeautysalon"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[250px]"
            >
              <Button size="lg" className="w-full bg-[#1877F2] hover:bg-[#0C63D4] text-white">
                <Facebook className="w-6 h-6 mr-2" fill="currentColor" />
                Facebook
              </Button>
            </a>

            <a
              href="https://instagram.com/soumayabeautysalon"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[250px]"
            >
              <Button size="lg" className="w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white">
                <Instagram className="w-6 h-6 mr-2" />
                Instagram
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {method.icon}
                  </div>
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold mb-4">{method.content}</p>
                  <a href={method.action}>
                    <Button variant="outline" className="w-full">
                      {method.buttonText}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Envíanos un mensaje
              </h2>
              <p className="text-lg text-muted-foreground">
                Completa el formulario y nos pondremos en contacto contigo
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre completo *</label>
                      <input
                        type="text"
                        placeholder="María González"
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        placeholder="maria@ejemplo.com"
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Teléfono *</label>
                      <input
                        type="tel"
                        placeholder="+52 351 127 0276"
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Servicio de interés *</label>
                      <select className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" required>
                        <option value="">Selecciona un servicio</option>
                        <option value="gel">Uñas de Gel</option>
                        <option value="acrilico">Uñas Acrílicas</option>
                        <option value="pedicure">Pedicure Premium</option>
                        <option value="keratina">Tratamiento de Keratina</option>
                        <option value="tinte">Tinte Profesional</option>
                        <option value="pestanas">Extensión de Pestañas</option>
                        <option value="cejas">Diseño de Cejas</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Mensaje *</label>
                    <textarea
                      rows={6}
                      placeholder="Cuéntanos qué servicio te interesa o cualquier duda que tengas..."
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      required
                    ></textarea>
                  </div>

                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="privacy" className="mt-1" required />
                    <label htmlFor="privacy" className="text-sm text-muted-foreground">
                      Acepto la política de privacidad y el tratamiento de mis datos personales
                    </label>
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar mensaje
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Preguntas frecuentes</h2>
              <p className="text-lg text-muted-foreground">
                Encuentra respuestas rápidas a las dudas más comunes
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground pl-8">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl text-center">Horario de atención</CardTitle>
                <CardDescription className="text-center">Estamos disponibles todos los días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="font-medium">Lunes - Domingo</span>
                    <span className="text-muted-foreground">10:00 AM - 9:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="font-medium">Días festivos</span>
                    <span className="text-muted-foreground">10:00 AM - 6:00 PM</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-center">
                    <strong>Nota:</strong> Trabajamos únicamente con cita previa para brindarte la mejor atención personalizada
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contacto