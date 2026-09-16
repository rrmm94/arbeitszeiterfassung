interface CategoryItem {
  name: string;
  color: string;
  hours: number;
}

export function CategoryDistribution({ items }: { items: CategoryItem[] }) {
  const total = items.reduce((s, c) => s + c.hours, 0);
  const sorted = [...items].filter((c) => c.hours > 0).sort((a, b) => b.hours - a.hours);

  if (sorted.length === 0 || total === 0) {
    return <p className="text-[12.5px] text-text-tertiary">Noch keine Daten für dieses Schuljahr.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bg-hover">
        {sorted.map((c, i) => (
          <div
            key={i}
            style={{ width: `${(c.hours / total) * 100}%`, background: c.color }}
            className="h-full first:rounded-l-full last:rounded-r-full"
            title={`${c.name}: ${Math.round((c.hours / total) * 100)}%`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {sorted.map((c, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-secondary">{c.name}</span>
            <span className="shrink-0 text-[12.5px] font-medium tabular text-text-primary">
              {Math.round((c.hours / total) * 100)}%
            </span>
            <span className="w-14 shrink-0 text-right text-[11.5px] tabular text-text-tertiary">
              {c.hours.toFixed(1)}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
