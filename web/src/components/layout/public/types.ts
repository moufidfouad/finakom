import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export type NavItem =
  | {
      to: string;
      label: string;
      icon: ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
      >;
      end: boolean;
      description?: string;
      featured?: boolean;
    }
  | {
      to: string;
      label: string;
      description: string;
      icon: ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
      >;
      end: boolean;
      featured: boolean;
    }
  | {
      to: string;
      label: string;
      description: string;
      icon: ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
      >;
      end: boolean;
      featured?: boolean;
    };
