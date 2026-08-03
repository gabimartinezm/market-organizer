import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * The app ships hundreds of theme-dependent tokens but had no way to choose a
 * theme; this writes the class the stylesheet keys off, matching the boot
 * script in index.html.
 */
export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('family_theme', next ? 'dark' : 'light');
    } catch {
      /* private mode: the choice just won't persist */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-bare"
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};
