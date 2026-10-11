/** Affiché pendant le chargement différé (React.lazy) d'une page. */
export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
    </div>
  );
}
