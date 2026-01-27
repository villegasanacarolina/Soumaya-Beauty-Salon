import ServicioDetalle from './ServicioDetalle';
import { getServicioBySlug } from '../../data/serviciosData';

export default function UnasAcrilicas() {
  const servicio = getServicioBySlug('unas-acrilicas');
  return <ServicioDetalle servicio={servicio} />;
}