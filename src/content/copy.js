/**
 * Textos del sitio en castellano (Madrid).
 * Tono: cálido, emotivo, moderno (Apple / Microsoft). Formal pero cercano.
 */
export const copy = {
  hero: {
    eyebrow: 'Un millón de gracias',
    title: '40 años. Miles de niños. Una maestra que lo ha dado todo.',
    subtitle:
      'Mariángeles ha dedicado más de cuatro décadas a su vocación con ánimo, ilusión y una entrega que ha marcado a generaciones. Es nuestro turno de devolverle aunque sea una pequeña parte de todo lo que nos ha dado.',
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
      'Hace más de cuarenta años, Mariángeles entró por primera vez al Colegio Everest School Monteclaro, en Pozuelo de Alarcón. Desde entonces, no ha parado.',
      'Generación tras generación, ha sido la maestra de infantil que recibe a los niños cuando todavía son muy pequeños para entender lo que es un colegio, y les enseña — con paciencia, con alegría, con un amor que se nota desde el primer día — que este lugar es seguro, que aprender es divertido, y que hay alguien aquí que los quiere ver crecer.',
      'Cuarenta años dan para mucho. Dan para miles de niños que hoy son adultos y que todavía recuerdan su nombre. Dan para cientos de familias que le confiaron lo más importante que tienen. Dan para proyectos, canciones, manualidades, abrazos y tardes preparando clases con la misma ilusión que el primer septiembre.',
      'Lo más extraordinario de Mariángeles no es que lleve cuarenta años en el mismo colegio. Es que, a pocos meses de jubilarse, sigue pareciendo que está al inicio de su carrera.',
    ],
    future: [
      'Ahora es su turno.',
      'Este verano, Mariángeles cierra un capítulo que ha durado toda una vida profesional. Y nosotros — familias, exalumnos, compañeras — queremos estar ahí para abrir el siguiente.',
      'Este viaje a Argentina es nuestro gracias colectivo. Un regalo de tiempo, de libertad y de aventura para alguien que ha dedicado cada día de su vida profesional a los demás.',
      'Ahora le toca a ella descubrir, explorar y disfrutar. Y nosotros queremos ser parte de ese momento.',
    ],
    eras: [
      {
        period: 'Los primeros años',
        caption: 'Una vocación que apenas empezaba.',
      },
      {
        period: 'Los años intermedios',
        caption: 'Generación tras generación, siempre ella.',
      },
      {
        period: 'Los años recientes',
        caption: 'Cuatro décadas después, la misma ilusión del primer día.',
      },
    ],
  },

  trip: {
    title: 'El nuevo capítulo',
    transition:
      'Ahora es su turno. Este viaje es nuestro gracias colectivo: tiempo, libertad y una nueva etapa que empieza.',
    intro:
      'Un viaje a Argentina para dos personas, organizado con PANGEA The Travel Store. Como en una lista de bodas, puedes contribuir a la experiencia que más te emocione. Al final, ella decidirá cómo disfrutarlo.',
    howItWorks: [
      'Elige una experiencia del viaje (o deja que tu contribución vaya al fondo general).',
      'Indica cuánto quieres aportar y rellena el formulario.',
      'PANGEA The Travel Store te enviará un enlace de pago directamente a tu correo.',
      'Tu nombre aparece en el muro y la barra de progreso avanza.',
    ],
    privacyNote:
      'Los nombres son públicos en la página. Los importes no se muestran nunca, pero Mariángeles recibirá la lista completa al final.',
  },

  recentFeed: {
    empty: 'Aún no hay contribuciones. ¡Sé el primero!',
  },

  form: {
    title: 'Súmate al regalo',
    fields: {
      name: 'Nombre y apellidos',
      email: 'Correo electrónico',
      message: 'Mensaje para Mariángeles (opcional)',
      messagePlaceholder:
        'Si no sabes por dónde empezar:\n· ¿Cuál es el recuerdo más bonito que tienes de Mariángeles?\n· ¿Qué es lo que más la define como persona o como profesora, en una frase?\n· ¿Qué le dirías si pudieras decirle algo en su último día de trabajo?',
      photo: 'Foto (opcional)',
      tripItem: '¿Quieres dedicar tu aportación a algo concreto?',
      tripItemDefault: 'Sin preferencia · al fondo general',
      amount: 'Importe a aportar (€)',
      amountHint: 'Opcional. Si no indicas un importe, solo se publicarán tu mensaje y/o foto.',
      amountSuggestedHint: 'Importe sugerido para esta experiencia. Puedes cambiarlo o dejarlo en blanco.',
      amountOtherLabel: 'Otro',
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
      'Mariángeles recibirá al final la lista completa de quienes han participado y los mensajes y fotos compartidos.',
  },
};
