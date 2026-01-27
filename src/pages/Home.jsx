import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Heart, Crown, Star } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/Carousel"

const Home = () => {
  const heroImages = [
    { src: "/images/home/hero-1.jpg", alt: "Interior del salón 1" },
    { src: "/images/home/hero-2.jpg", alt: "Interior del salón 2" },
    { src: "/images/home/hero-3.jpg", alt: "Interior del salón 3" },
    { src: "/images/home/hero-4.jpg", alt: "Interior del salón 4" },
  ]

  const features = [
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Productos Premium",
      description: "Trabajamos exclusivamente con las mejores marcas internacionales de cosmética profesional"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Experiencia Única",
      description: "Un ambiente elegante y relajante diseñado para tu comodidad y satisfacción"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Atención Personalizada",
      description: "Cada cliente es especial. Adaptamos nuestros servicios a tus necesidades específicas"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Carousel Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                Donde el cuidado personal se convierte en{' '}
                <span className="text-primary">arte</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Transformamos el cuidado personal en una experiencia artística, donde la elegancia se refleja en cada detalle
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/servicios">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                    Ver Servicios
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/contacto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Agendar Cita
                  </Button>
                </Link>
              </div>
            </div>

            {/* Carousel del local */}
            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {heroImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
                        />
                        <div className="absolute -bottom-6 -left-6 bg-primary text-white p-6 rounded-xl shadow-lg">
                          <p className="text-3xl font-bold">+5 años</p>
                          <p className="text-sm">de experiencia</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En Soumaya Beauty Salon nos distinguimos por la calidad y el trato excepcional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-lg group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <div className="text-primary">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Lo que dicen nuestras clientas
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-6 rounded-xl border border-border">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Excelente servicio, productos de primera calidad y un ambiente muy agradable. Totalmente recomendado."
                </p>
                <p className="font-semibold">- Cliente Satisfecha</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12 md:p-16 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Lista para sentirte hermosa?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Agenda tu cita hoy y descubre por qué somos el salón de belleza favorito de Andares
            </p>
            <Link to="/contacto">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Reservar ahora
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home