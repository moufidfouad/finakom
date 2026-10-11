import { useField } from 'formik';
import { TextareaHTMLAttributes } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
  wrapperClassName?: string;
}

export default function FormTextArea({ name, label, wrapperClassName, className, ...props }: FormTextAreaProps) {
  const [field, meta] = useField(name);
  const hasError = meta.touched && !!meta.error;

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} invalid={hasError} className={className} {...field} {...props} />
      {hasError && <p className="text-xs text-destructive">{meta.error}</p>}
    </div>
  );
}
