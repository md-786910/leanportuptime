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
            className={`flex items-center gap-0.5 px-1.5 py-1 rounded-md transition-all border ${
              isActive
                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800 scale-105'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
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
