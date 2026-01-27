import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const Ubicaciones = () => {
  const googleMapsUrl = "https://www.google.com/maps/place/Andares+Centro+Comercial/@20.7104414,-103.4145372,17z/data=!3m2!4b1!5s0x8428af03ca81f51d:0x60ce01867b4490ec!4m6!3m5!1s0x8428aefd86a6e48d:0xee86b7bd74920eeb!8m2!3d20.7104414!4d-103.4119623!16s%2Fm%2F056whm0?entry=ttu&g_ep=EgoyMDI2MDExOS4wIKXMDSoASAFQAw%3D%3D"

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-primary font-semibold">📍 Visítanos</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Nuestra Ubicación
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Estamos en Andares, uno de los centros comerciales más exclusivos de Guadalajara
            </p>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-card p-6 rounded-xl border text-center hover:border-primary/50 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Teléfono</h3>
              <p className="text-muted-foreground mb-3">+52 33 1234 5678</p>
              <a href="tel:+523511270276">
                <Button variant="link" size="sm" className="text-primary">
                  Llamar ahora
                </Button>
              </a>
            </div>

            <div className="bg-card p-6 rounded-xl border text-center hover:border-primary/50 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-muted-foreground mb-3">hola@soumayabeautybar.com</p>
              <a href="mailto:soumayabeautysalon@gmail.com">
                <Button variant="link" size="sm" className="text-primary">
                  Enviar email
                </Button>
              </a>
            </div>

            <div className="bg-card p-6 rounded-xl border text-center hover:border-primary/50 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Horario</h3>
              <p className="text-muted-foreground mb-3">Lun - Dom: 10AM - 9PM</p>
              <Button variant="link" size="sm" className="text-primary">
                Ver horarios completos
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="overflow-hidden border-2">
              <div className="grid md:grid-cols-2">
                <div className="relative h-64 md:h-auto">
                  <img
                    src="/images/ubicaciones/tienda-exterior.jpg"
                    alt="Soumaya Beauty Bar - Fachada"
                    className="w-full h-full object-cover"
                  />
                </div>

                <CardContent className="p-8 flex flex-col justify-center">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold mb-2">Soumaya Beauty Bar</h2>
                    <p className="text-primary font-semibold">Centro Comercial Andares</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium">Andares, Local 123</p>
                        <p className="text-sm text-muted-foreground">Blvd. Puerta de Hierro 4965</p>
                        <p className="text-sm text-muted-foreground">Zapopan, Jalisco 45116</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <a href="tel:+523511270276" className="hover:text-primary transition-colors">
                        +52 33 1234 5678
                      </a>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <a href="mailto:soumayabeautysalon@gmail.com" className="hover:text-primary transition-colors">
                        hola@soumayabeautybar.com
                      </a>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium">Horario de atención:</p>
                        <p className="text-sm text-muted-foreground">Lunes a Domingo</p>
                        <p className="text-sm text-muted-foreground">10:00 AM - 9:00 PM</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-semibold mb-3">Cómo llegar:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        🅿️ Estacionamiento disponible
                      </span>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        ♿ Acceso para discapacitados
                      </span>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        🚗 Valet parking
                      </span>
                    </div>
                  </div>

                  <a 
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full mt-6 bg-primary hover:bg-primary/90">
                      <Navigation className="w-4 h-4 mr-2" />
                      Abrir en Google Maps
                    </Button>
                  </a>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Mapa de Ubicación</h2>
              <p className="text-lg text-muted-foreground">Andares Centro Comercial, Zapopan, Jalisco</p>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 shadow-lg mb-6">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3731.8588326750647!2d-103.41453722541358!3d20.710441398203657!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8428aefd86a6e48d%3A0xee86b7bd74920eeb!2sAndares%20Centro%20Comercial!5e0!3m2!1ses-419!2smx!4v1737495000000!5m2!1ses-419!2smx"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de Andares Centro Comercial"
              />
            </div>

            <div className="text-center">
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <MapPin className="w-5 h-5 mr-2" />
                  Ver en Google Maps
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Información de Estacionamiento</CardTitle>
                <CardDescription>Tu comodidad es nuestra prioridad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-background p-6 rounded-lg border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Estacionamiento
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Estacionamiento techado disponible</li>
                      <li>• Más de 2,000 lugares</li>
                      <li>• Tarifa preferencial con consumo</li>
                      <li>• Servicio de valet parking</li>
                    </ul>
                  </div>

                  <div className="bg-background p-6 rounded-lg border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-primary" />
                      Cómo llegar
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Por Av. Patria dirección oeste</li>
                      <li>• Por Blvd. Puerta de Hierro</li>
                      <li>• Entrada por Fashion Drive</li>
                      <li>• Zona de descenso en entrada principal</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-center">
                    <strong>Tip:</strong> Te recomendamos llegar 10 minutos antes de tu cita para encontrar estacionamiento cómodamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12 md:p-16 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Lista para visitarnos?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Agenda tu cita ahora y déjanos consentirte en nuestro exclusivo salón en Andares
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  <MapPin className="w-5 h-5 mr-2" />
                  Ver Ubicación
                </Button>
              </a>
              <a href="https://wa.me/523511270276" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Contactar por WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Ubicaciones