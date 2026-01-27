import ServicioDetalle from './ServicioDetalle';
import { getServicioBySlug } from '../../data/serviciosData';

export default function Tinte() {
  const servicio = getServicioBySlug('tinte');
  return <ServicioDetalle servicio={servicio} />;
}