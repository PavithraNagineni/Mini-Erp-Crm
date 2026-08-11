export function Badge({ status }: { status: string }) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}
