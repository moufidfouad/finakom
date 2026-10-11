import { useState } from "react";
import { useField } from "formik";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface FormSelectFieldProps {
  name: string;
  label: string;
  options: Option[];
  placeholder?: string;
  wrapperClassName?: string;
}


export default function FormSelectField({
  name,
  label,
  options,
  placeholder,
  wrapperClassName,
}: FormSelectFieldProps) {
  const [field, meta, helpers] = useField(name);
  const [open, setOpen] = useState(false);
  const hasError = meta.touched && !!meta.error;
  const selected = options.find((opt) => opt.value === field.value);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) helpers.setTouched(true);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <Label htmlFor={name}>{label}</Label>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={name}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-9 w-full justify-between font-normal",
              !selected && "text-muted-foreground",
              hasError && "border-destructive",
            )}
          >
            <span className="truncate">
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Rechercher…" />
            <CommandList>
              <CommandEmpty>Aucun résultat.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      helpers.setValue(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        opt.value === field.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {hasError && <p className="text-xs text-destructive">{meta.error}</p>}
    </div>
  );
}
