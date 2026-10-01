const STORAGE_KEY = 'near-and-here-demo-notebook-v1';

function emptyNotebook() {
  return { user: null, savedPlaces: [] };
}

export function readDemoNotebook() {
  if (typeof window === 'undefined') return emptyNotebook();
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return emptyNotebook();
    const user = typeof saved.user?.name === 'string' ? { name: saved.user.name } : null;
    const savedPlaces = Array.isArray(saved.savedPlaces)
      ? saved.savedPlaces.filter(
          (place) =>
            place &&
            typeof place.id === 'string' &&
            typeof place.name === 'string' &&
            Number.isFinite(Number(place.latitude)) &&
            Number.isFinite(Number(place.longitude)),
        )
      : [];
    return user ? { user, savedPlaces } : emptyNotebook();
  } catch {
    return emptyNotebook();
  }
}

export function writeDemoNotebook(notebook) {
  const value = {
    user: notebook.user ? { name: notebook.user.name } : null,
    savedPlaces: notebook.savedPlaces,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearDemoNotebook() {
  window.localStorage.removeItem(STORAGE_KEY);
}
