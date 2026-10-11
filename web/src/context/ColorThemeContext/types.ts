export interface ColorThemeContextValue {
  colorTheme: string;
  setColorTheme: (value: string) => void;
  colorThemes: ColorThemeOption[];
}

export interface ColorThemeOption {
  value: string;
  label: string;
  /** Couleur d'aperçu (HSL, valeur "primary" du thème en mode clair) pour la pastille du sélecteur. */
  swatch: string;
}