import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '@/components/theme-provider'
import './AnimatedLogo.css'

const AnimatedLogo = () => {
  const [isAnimating, setIsAnimating] = useState(false)
  const location = useLocation()
  const { theme } = useTheme()

  useEffect(() => {
    // Activar animación al cargar la página o cambiar de ruta
    setIsAnimating(true)
    
    // Desactivar después de que termine la animación (4 segundos)
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 4000)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="animated-logo-container">
      {/* El texto que se queda fijo (BASE) */}
      <img 
        src={theme === 'dark' ? '/images/logo-text-dark.png' : '/images/logo-text-light.png'}
        alt="Soumaya Beauty Salon" 
        className={`logo-text ${theme === 'light' ? 'logo-text-light-mode' : ''}`}
      />
      
      {/* La S que gira en 3D (ENCIMA - al lado izquierdo) */}
      <img 
        src={theme === 'dark' ? '/images/logo-s-dark.png' : '/images/logo-s-light.png'}
        alt="S" 
        className={`logo-s ${isAnimating ? 'logo-spin' : ''}`}
      />
    </div>
  )
}

export default AnimatedLogo