// Themed table primitive used across list/detail views.
// Gradient header, alternating body rows, responsive overflow, optional sticky
// first column. Pass `columns` and `rows`; cells can be plain values or render
// functions.
//
//   <DataTable
//     columns={[
//       { key: 'name', label: 'Name', width: '40%' },
//       { key: 'value', label: 'Value', align: 'right', render: (r) => fmt(r.value) },
//     ]}
//     rows={items}
//     keyField="_id"
//   />
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [],
  rows = [],
  keyField = 'id',
  dense = false,
  emptyState,
  className = '',
}) {
  if (!rows.length) {
    return emptyState ?? (
      <EmptyState title="No records yet" description="Items will appear here once available." />
    );
  }

  const padY = dense ? 'py-2' : 'py-2.5';
  const padX = 'px-3';

  return (
    <div className={`rounded-xl border border-brand-outline-variant/60 dark:border-brand-outline/60 bg-brand-surface-container-lowest dark:bg-brand-on-surface/30 overflow-hidden shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-label" style={{ tableLayout: columns.some((c) => c.width) ? 'fixed' : 'auto' }}>
          {columns.some((c) => c.width) && (
            <colgroup>
              {columns.map((c, i) => <col key={i} style={c.width ? { width: c.width } : undefined} />)}
            </colgroup>
          )}
          <thead>
            <tr className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] dark:from-brand-on-surface/40 dark:to-brand-on-surface/20">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`${padY} ${padX} font-bold text-[10px] uppercase tracking-[0.12em] text-brand-on-surface-variant dark:text-brand-outline ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row[keyField] ?? idx}
                className={`border-t border-brand-outline-variant/40 dark:border-brand-outline/40 hover:bg-brand-surface-container-low/40 dark:hover:bg-brand-on-surface/40 transition-colors ${idx % 2 === 1 ? 'bg-[#fafafa]/50 dark:bg-brand-on-surface/15' : ''}`}
              >
                {columns.map((c) => {
                  const content = typeof c.render === 'function' ? c.render(row, idx) : row[c.key];
                  const tabular = c.align === 'right' || c.numeric;
                  return (
                    <td
                      key={c.key}
                      className={`${padY} ${padX} ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'} ${tabular ? 'tabular-nums' : ''} ${c.truncate ? 'truncate max-w-0' : ''}`}
                      title={c.truncate && typeof content === 'string' ? content : undefined}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
