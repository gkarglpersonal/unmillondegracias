import { createContext, useContext, useState } from 'react';
import FormModal from './FormModal.jsx';

const FormCtx = createContext({
  openForm: () => {},
  closeForm: () => {},
  sidebarLockedTripItemId: null,
});

const DESKTOP_BREAKPOINT = 1024;
const isDesktop = () =>
  typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT;

/**
 * Provider del flujo del formulario.
 *
 * - openForm({ tripItemId }) en mobile → abre modal con esa partida bloqueada.
 * - openForm({ tripItemId }) en desktop → no abre modal, no hace scroll;
 *   solo expone el id en `sidebarLockedTripItemId` para que el StickySidebar
 *   lo consuma. El sidebar es sticky y siempre está visible.
 */
export function FormProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [modalLockedTripItemId, setModalLockedTripItemId] = useState(null);
  const [sidebarLockedTripItemId, setSidebarLockedTripItemId] = useState(null);

  const openForm = (opts = {}) => {
    const tripItemId = opts.tripItemId || null;

    if (isDesktop()) {
      // Sidebar siempre visible (sticky). Solo actualizamos el id;
      // no hacemos scroll para no distraer al usuario.
      setSidebarLockedTripItemId(tripItemId);
    } else {
      setModalLockedTripItemId(tripItemId);
      setOpen(true);
    }
  };

  const closeForm = () => {
    setOpen(false);
    setModalLockedTripItemId(null);
  };

  return (
    <FormCtx.Provider value={{ openForm, closeForm, sidebarLockedTripItemId }}>
      {children}
      <FormModal
        open={open}
        onClose={closeForm}
        lockedTripItemId={modalLockedTripItemId}
      />
    </FormCtx.Provider>
  );
}

export const useFormModal = () => useContext(FormCtx);
