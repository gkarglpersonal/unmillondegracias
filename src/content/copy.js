/**
 * Textos del sitio en castellano (Madrid).
 * Tono: cálido, emotivo, moderno (Apple / Microsoft). Formal pero cercano.
 */
export const copy = {
  hero: {
    eyebrow: 'Un millón de gracias',
    title: '40 años. Miles de niños. Una maestra que lo ha dado todo.',
    subtitle:
      'Más de cuatro décadas dedicando cada día a sus alumnos con la misma ilusión del primero. Maestra de infantil en el Colegio Everest de Monteclaro, MªÁngeles ha marcado a generaciones de niños y sus familias. Este viaje es nuestro agradecimiento.',
    contributorCounter: (n) => {
      if (!n || n <= 0) return 'Sé el primero en sumarte.';
      if (n === 1) return '1 persona se ha sumado.';
      return `${n} personas ya se han sumado.`;
    },
    cta: 'Participar',
  },

  history: {
    title: 'La maestra que nunca perdió la ilusión del primer día.',
    eyebrow: 'Su trayectoria',
    past: [
      'MªÁngeles llegó al Colegio Everest School Monteclaro en 1985. Desde entonces, no ha parado.',
      'Generación tras generación, ha sido la maestra de infantil que recibe a los niños cuando todavía son muy pequeños para entender lo que es un colegio, y les enseña que este lugar es seguro, que aprender es divertido, y que hay alguien aquí que los quiere ver crecer.',
      'Cuarenta años dan para mucho. Dan para miles de niños que hoy son adultos y que todavía recuerdan su nombre. Dan para cientos de familias que esperaban en la puerta de su clase para hablarle, para resolver dudas, para contarle cosas. Dan para festivales de Grease y de Alicia en el País de las Maravillas, para proyectos, canciones, abrazos y tardes preparando clases con la misma ilusión del primer septiembre.',
      '"Es una maestra como pocos en este mundo", dice Yvonne, su amiga y compañera en el cole durante 27 años. "Lucha mucho por sacar lo mejor de cada niño."',
      'Lo más extraordinario de MªÁngeles no es que lleve cuarenta años en el mismo colegio. Es que, a pocos meses de jubilarse, sigue pareciendo que está al inicio de su carrera. Cariñosa, alegre, dinámica, positiva. Siempre con sus tacones, sus collares y sus pendientes. Siempre ella.',
    ],
    future: [
      'Este verano, MªÁngeles cierra un capítulo que ha durado toda una vida profesional. Y familias y exalumnos queremos estar ahí para abrir el siguiente.',
    ],
    eras: [
      {
        period: 'Los primeros años',
        caption: 'Los primeros años en el Everest, finales de los 80.',
        photoUrl: '/images/Mariangeles_primeros.jpeg',
      },
      {
        period: 'Los años intermedios',
        caption: 'La misma energía de siempre, en cada lugar y en cada momento.',
        photoUrl: '/images/Mariangeles_intermedios.jpeg',
      },
      {
        period: 'Los años recientes',
        caption: 'Una maestra así solo se encuentra una vez en la vida.',
        photoUrl: '/images/Mariangeles_recientes.png',
      },
    ],
  },

  trip: {
    title: 'El nuevo capítulo',
    transition:
      'Ahora es su turno. Este viaje es nuestro agradecimiento: tiempo, libertad y una nueva etapa que empieza.',
    intro:
      'Un viaje a Argentina para dos personas, organizado con PANGEA The Travel Store. Como en una lista de bodas, puedes contribuir a la experiencia que más te emocione. Al final, ella decidirá cómo disfrutarlo.',
    howItWorks: [
      'Elige una experiencia del viaje (o deja que tu contribución vaya al fondo general).',
      'Indica cuánto quieres aportar y rellena el formulario.',
      'PANGEA The Travel Store te enviará un enlace de pago directamente a tu correo.',
      'Tu nombre aparece en el muro y la barra de progreso avanza.',
    ],
    privacyNote:
      'Los nombres son públicos en la página. Los importes no se muestran nunca, pero MªÁngeles recibirá la lista completa al final.',
  },

  recentFeed: {
    empty: 'Aún no hay contribuciones. ¡Sé el primero!',
  },

  form: {
    title: 'Súmate al regalo',
    fields: {
      name: 'Nombre y apellidos',
      email: 'Correo electrónico',
      message: 'Mensaje para MªÁngeles (opcional)',
      messagePlaceholder:
        'Si no sabes por dónde empezar:\n· ¿Cuál es el recuerdo más bonito que tienes de MªÁngeles?\n· ¿Qué es lo que más la define como persona o como profesora, en una frase?\n· ¿Qué le dirías si pudieras decirle algo en su último día de trabajo?',
      photo: 'Foto (opcional)',
      tripItem: '¿Quieres dedicar tu aportación a algo concreto?',
      tripItemDefault: 'Sin preferencia · al fondo general',
      amount: 'Importe a aportar (€)',
      amountHint: 'Opcional. Si no indicas un importe, solo se publicarán tu mensaje y/o foto.',
      amountSuggestedHint: 'Importe sugerido para esta experiencia. Puedes cambiarlo o dejarlo en blanco.',
      amountOtherLabel: 'Otro',
      amountPrivate:
        'Prefiero no mostrar mi aportación — MªÁngeles verá mi nombre y mensaje, pero no el importe.',
    },
    submit: 'Enviar',
    successTitle: '¡Gracias!',
    successBody:
      'Tu participación ha quedado registrada. Si has indicado un importe, PANGEA The Travel Store te enviará un correo con el enlace de pago. Tu mensaje ya está en el muro.',
    successClose: 'Cerrar',
  },

  floatingCta: {
    label: 'Participar',
  },

  privacy: {
    public: [
      'Tu nombre',
      'Tu mensaje (si lo escribes)',
      'Tu foto (tras aprobación)',
    ],
    notPublic: [
      'Tu correo',
      'Tu importe exacto',
    ],
    forMariangeles:
      'MªÁngeles recibirá al final la lista completa de quienes han participado y los mensajes y fotos compartidos.',
  },
};
