import ServicioDetalle from './ServicioDetalle';
import { getServicioBySlug } from '../../data/serviciosData';

export default function Cejas() {
  const servicio = getServicioBySlug('cejas');
  return <ServicioDetalle servicio={servicio} />;
}