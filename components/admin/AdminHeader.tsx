export default function AdminHeader({
  title,
  sub,
  children
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display font-extrabold uppercase text-2xl md:text-3xl tracking-tight">
          <span className="text-gradient">{title.split(' ')[0]}</span> {title.split(' ').slice(1).join(' ')}
        </h1>
        {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
