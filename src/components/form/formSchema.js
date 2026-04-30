import { z } from 'zod';

/**
 * Schema de validación del formulario.
 * Reglas:
 *  - name y email obligatorios
 *  - message, photo, tripItemId, amount opcionales
 *  - amount debe ser >0 si está presente
 *  - photo se valida en el componente uploader (no por zod) porque es un File
 */
export const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tu nombre completo, por favor.')
    .max(80, 'Demasiado largo.'),
  email: z
    .string()
    .trim()
    .min(1, 'Necesitamos tu correo.')
    .email('No parece un correo válido.'),
  message: z
    .string()
    .trim()
    .max(2000, 'Te has pasado un poco. Máximo 2000 caracteres.')
    .optional()
    .or(z.literal('')),
  tripItemId: z.string().optional().or(z.literal('')),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => {
      if (v === '' || v == null) return null;
      const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : NaN;
    })
    .refine((v) => v === null || (v > 0 && v <= 100000), {
      message: 'Indica un importe entre 1 y 100.000 €, o déjalo en blanco.',
    })
    .nullable()
    .optional(),
  amountPrivate: z.boolean().optional().default(false),
});

export const defaultFormValues = {
  name: '',
  email: '',
  message: '',
  tripItemId: '',
  amount: '',
  amountPrivate: false,
};
