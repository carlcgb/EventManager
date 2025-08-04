import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFrenchDate(date: Date | string | null): string {
  if (!date) return 'Date non disponible';
  
  let dateObj: Date;
  if (typeof date === 'string') {
    // Pour éviter les problèmes de timezone avec les dates au format YYYY-MM-DD,
    // on force l'interprétation en tant que date locale
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day); // month est 0-indexé
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  return format(dateObj, 'dd MMMM yyyy', { locale: fr }).toUpperCase();
}
