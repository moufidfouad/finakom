import { useField } from 'formik';
import { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  hint?: string;
  wrapperClassName?: string;
}

export default function FormTextField({ name, label, hint, wrapperClassName, className, type, ...props }: FormTextFieldProps) {
  const [field, meta] = useField(name);
  const hasError = meta.touched && !!meta.error;
  const isPassword = type === 'password';
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          type={isPassword && visible ? 'text' : type}
          invalid={hasError}
          className={cn(isPassword && 'pr-9', className)}
          {...field}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hasError && <p className="text-xs text-destructive">{meta.error}</p>}
      {!hasError && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
