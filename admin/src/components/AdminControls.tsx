import { Moon, Sun } from 'lucide-react';
import type { DisplayMode, Language } from '../types/admin';

interface AdminControlsProps {
  mode: DisplayMode;
  language: Language;
  modeLabel: string;
  languageLabel: string;
  onModeChange: (mode: DisplayMode) => void;
  onLanguageChange: (language: Language) => void;
}

export function AdminControls({
  mode,
  language,
  modeLabel,
  languageLabel,
  onModeChange,
  onLanguageChange,
}: AdminControlsProps) {
  const isDark = mode === 'dark';

  return (
    <div className="admin-controls" aria-label="Display controls">
      <button
        className="theme-toggle"
        type="button"
        aria-label={modeLabel}
        aria-pressed={isDark}
        onClick={() => onModeChange(isDark ? 'light' : 'dark')}
      >
        <span className={isDark ? 'theme-toggle__option' : 'theme-toggle__option is-active'} aria-hidden="true">
          <Sun size={15} />
        </span>
        <span className={isDark ? 'theme-toggle__option is-active' : 'theme-toggle__option'} aria-hidden="true">
          <Moon size={15} />
        </span>
      </button>

      <div className="language-toggle" aria-label={languageLabel}>
        {(['ko', 'en'] as const).map((option) => (
          <button
            key={option}
            className={language === option ? 'language-toggle__button is-active' : 'language-toggle__button'}
            type="button"
            aria-pressed={language === option}
            onClick={() => onLanguageChange(option)}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
