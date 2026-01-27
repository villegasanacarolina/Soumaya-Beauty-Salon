import ServicioDetalle from './ServicioDetalle';
import { getServicioBySlug } from '../../data/serviciosData';

export default function Pestanas() {
  const servicio = getServicioBySlug('pestanas');
  return <ServicioDetalle servicio={servicio} />;
}