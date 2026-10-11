import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchBar({ value, onChange, placeholder = 'Rechercher…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-8 pr-8" />
      {value && (
        <Button
          variant="ghost" size="icon"
          className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
