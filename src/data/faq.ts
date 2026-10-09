import { MODALITY_LABELS } from '../lib/constants';
import { business } from './business';

export const faqs = [
  {
    question: '¿Cómo hago un pedido?',
    answer:
      'Agrega los tratamientos que te interesan a "Mi pedido", elige si los quieres en el estudio o a domicilio y envíanos el pedido por WhatsApp. Una asesora te confirma el precio, la disponibilidad y los detalles.',
  },
  {
    question: '¿Por qué no aparecen precios?',
    answer:
      'Cada tratamiento se personaliza según tus necesidades: zonas, dosis o número de sesiones. Por eso te enviamos la cotización exacta por WhatsApp.',
  },
  {
    question: '¿Atienden a domicilio?',
    answer: `Sí. Algunos servicios de bienestar y de estética corporal los llevamos a tu casa en ${business.location.city}. En el catálogo puedes filtrar por "${MODALITY_LABELS.domicilio}" para verlos. Te confirmamos la cobertura y el costo del domicilio por WhatsApp.`,
  },
  {
    question: '¿Dónde están ubicados?',
    answer: `Nuestro estudio está en el barrio ${business.location.neighborhood}, ${business.location.city}. Te compartimos la dirección exacta al agendar tu cita.`,
  },
  {
    question: '¿Los tratamientos inyectables requieren valoración?',
    answer:
      'Sí. Los procedimientos de estética facial (toxina botulínica, ácido hialurónico, bioestimuladores e hilos) están a cargo de un profesional de la salud, previa valoración, para confirmar que el tratamiento es adecuado para ti y definir el protocolo. Los resultados varían según cada persona.',
  },
  {
    question: '¿Atienden hombres?',
    answer:
      'Claro que sí. El cuidado personal también es para ellos: tratamientos de estética facial, bienestar y estética corporal, buscando siempre resultados naturales.',
  },
] as const;
