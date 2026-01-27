import ServicioDetalle from './ServicioDetalle';
import { getServicioBySlug } from '../../data/serviciosData';

export default function Pedicure() {
  const servicio = getServicioBySlug('pedicure');
  return <ServicioDetalle servicio={servicio} />;
}