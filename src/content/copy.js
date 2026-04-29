/**
 * Textos del sitio en castellano (Madrid).
 * Tono: cálido, emotivo, moderno (Apple / Microsoft). Formal pero cercano.
 */
export const copy = {
  hero: {
    eyebrow: 'Un millón de gracias',
    title: '40 años. Miles de niños. Una maestra que lo ha dado todo.',
    subtitle:
      'Más de cuatro décadas dedicando cada día a sus alumnos con la misma ilusión del primero. Maestra de infantil en el Colegio Everest de Monteclaro, Mariángeles ha marcado a generaciones de niños y sus familias. Este viaje es nuestro gracias colectivo.',
    contributorCounter: (n) => {
      if (!n || n <= 0) return 'Sé el primero en sumarte.';
      if (n === 1) return '1 persona se ha sumado.';
      return `${n} personas ya se han sumado.`;
    },
    cta: 'Participar',
  },

  history: {
    title: 'Su trayectoria',
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
