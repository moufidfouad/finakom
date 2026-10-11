import { toast } from 'sonner';

/**
 * Point d'entrée unique pour les notifications d'opération (création, mise à
 * jour, suppression...). Centraliser ici permet de changer de librairie ou
 * d'uniformiser les messages sans toucher à chaque hook API.
 */
export { toast };
