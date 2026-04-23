import { useSeoReportStore } from '../../store/seoReportStore';
import { THEMES } from './colorThemes';

const themeKeys = Object.keys(THEMES);

export default function ColorPalettePicker() {
  const colorTheme = useSeoReportStore((s) => s.colorTheme);
  const setColorTheme = useSeoReportStore((s) => s.setColorTheme);

  return (
    <div className="flex items-center gap-2">
      {themeKeys.map((key) => {
        const theme = THEMES[key];
        const isActive = colorTheme === key;

        return (
          <button
            key={key}
            onClick={() => setColorTheme(key)}
            title={theme.name}
            className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-all border ${ isActive ? 'border-brand-outline dark:border-white bg-brand-surface-container-low dark:bg-brand-on-surface scale-105' : 'border-transparent hover:border-brand-outline-variant dark:hover:border-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface' }`}
          >
            {theme.preview.map((color, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
            ))}
          </button>
        );
      })}
    </div>
  );
}
