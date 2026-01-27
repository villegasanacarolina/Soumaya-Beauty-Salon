import ServicioDetalle from './ServicioDetalle';
import { getServicioBySlug } from '../../data/serviciosData';

export default function UnasGel() {
  const servicio = getServicioBySlug('unas-gel');
  return <ServicioDetalle servicio={servicio} />;
}