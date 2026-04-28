import { useEffect, useState } from 'react';
import { subscribeTripItems } from '../firebase/tripItems.js';

export function useTripItems({ onlyActive = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeTripItems((data) => {
      setItems(data);
      setLoading(false);
    }, { onlyActive });
    return unsub;
  }, [onlyActive]);

  return { items, loading };
}
