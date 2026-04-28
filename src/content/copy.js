/**
 * Textos placeholder en español. Editar libremente.
 * Tono: cálido, emotivo, moderno (Apple / Microsoft).
 */
export const copy = {
  hero: {
    eyebrow: 'Un millón de gracias',
    title: '40 años. Miles de niños. Una maestra que lo dio todo.',
    subtitle:
      'Mariángeles dedicó más de cuatro décadas a su vocación con ánimo, ilusión y una entrega que marcó a generaciones. Es nuestro turno de devolverle un poquito de todo lo que nos dio.',
    contributorCounter: (n) => `${n} ${n === 1 ? 'persona se ha sumado' : 'personas ya se han sumado'}.`,
    cta: 'Participar',
  },

  history: {
    title: 'Su trayectoria',
    eras: [
      {
        period: 'Los primeros años',
        caption: 'Una vocación que recién comenzaba.',
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
      'Un viaje a Argentina para dos personas, organizado con PANGEA The Travel Store. Como en una lista de bodas, podés sumar tu aporte a la experiencia que más te emocione. Al final, ella decidirá cómo vivirlo.',
    howItWorks: [
      'Elige una experiencia del viaje (o deja que tu aporte vaya al fondo general).',
      'Indica cuánto quieres aportar y completa el formulario.',
      'PANGEA The Travel Store te enviará un enlace de pago directamente por correo.',
      'Tu nombre se suma al muro y la barra avanza.',
    ],
    privacyNote:
      'Los nombres son públicos en la página. Los montos no se muestran nunca, pero Mariángeles recibirá la lista completa al final.',
  },

  form: {
    title: 'Sumarme al regalo',
    fields: {
      name: 'Nombre y apellido',
      email: 'Correo electrónico',
      message: 'Mensaje para Mariángeles (opcional)',
      messagePlaceholder:
        'Si no sabes por dónde empezar:\n· ¿Cuál es el recuerdo más bonito que tienes de Mariángeles?\n· ¿Qué es lo que más la define como persona o profesora, en una frase?\n· ¿Qué le dirías si pudieras decirle algo en su último día de trabajo?',
      photo: 'Foto (opcional)',
      tripItem: '¿Quieres dedicar tu aportación a algo concreto?',
      tripItemDefault: 'Sin preferencia · al fondo general',
      amount: 'Monto a aportar (€)',
      amountHint: 'Opcional. Si no indicas monto, solo se publicarán tu mensaje y/o foto.',
    },
    submit: 'Enviar',
    successTitle: '¡Gracias!',
    successBody:
      'Tu aportación ha quedado registrada. Si indicaste un monto, PANGEA The Travel Store te enviará un correo con el enlace de pago. Tu mensaje ya está en el muro.',
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
      'Tu monto exacto',
    ],
    forMariangeles:
      'Mariángeles recibirá al final la lista completa de quienes han participado y los mensajes y fotos compartidos.',
  },
};
