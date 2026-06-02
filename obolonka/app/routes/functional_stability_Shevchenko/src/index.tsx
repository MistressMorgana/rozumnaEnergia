import { useState, useEffect } from 'react';

export default function FunctionalStabilityShevchenko() {
  const [App, setApp] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import('./App')
      .then((mod) => setApp(() => mod.default))
      .catch((err) => setError(err.message || String(err)));
  }, []);

  if (error) return <div style={{ color: 'red', padding: 40 }}>Помилка: {error}</div>;
  if (!App) return <div style={{ color: '#94a3b8', padding: 40 }}>Завантаження...</div>;

  return <App />;
}
