import ServicioDetalle from './ServicioDetalle';
import { getServicioBySlug } from '../../data/serviciosData';

export default function Keratina() {
  const servicio = getServicioBySlug('keratina');
  return <ServicioDetalle servicio={servicio} />;
}