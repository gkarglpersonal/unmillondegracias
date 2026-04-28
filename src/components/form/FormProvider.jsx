import { createContext, useContext, useState } from 'react';
import FormModal from './FormModal.jsx';

const FormCtx = createContext({ openForm: () => {} });

/**
 * Provider que mantiene el estado del modal del formulario.
 * Expone openForm({ tripItemId? }) para que cualquier componente del árbol
 * (FloatingCTA, tarjeta de partida, etc.) lo dispare.
 */
export function FormProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [lockedTripItemId, setLockedTripItemId] = useState(null);

  const openForm = (opts = {}) => {
    setLockedTripItemId(opts.tripItemId || null);
    setOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setLockedTripItemId(null);
  };

  return (
    <FormCtx.Provider value={{ openForm, closeForm }}>
      {children}
      <FormModal
        open={open}
        onClose={closeForm}
        lockedTripItemId={lockedTripItemId}
      />
    </FormCtx.Provider>
  );
}

export const useFormModal = () => useContext(FormCtx);
