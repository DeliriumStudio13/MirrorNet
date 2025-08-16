import { Timestamp } from 'firebase/firestore';

/**
 * Safely formats a date to a localized string
 * Handles Firestore Timestamps, Date objects, and string dates
 */
export function formatDate(date: Date | Timestamp | string | number | null | undefined, fallback: string = 'Recently'): string {
  if (!date) return fallback;
  
  try {
    let dateObj: Date;
    
    if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return fallback;
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    
    return dateObj.toLocaleDateString();
  } catch (error) {
    console.warn('Error formatting date:', error);
    return fallback;
  }
}

/**
 * Safely formats a date to a detailed localized string
 */
export function formatDetailedDate(date: Date | Timestamp | string | number | null | undefined, fallback: string = 'Recently'): string {
  if (!date) return fallback;
  
  try {
    let dateObj: Date;
    
    if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return fallback;
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting detailed date:', error);
    return fallback;
  }
}

/**
 * Safely converts various date formats to a Date object
 */
export function toDate(date: Date | Timestamp | string | number | null | undefined): Date {
  if (!date) return new Date();
  
  try {
    if (date instanceof Timestamp) {
      return date.toDate();
    } else if (date instanceof Date) {
      return date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) ? new Date() : dateObj;
    }
  } catch (error) {
    console.warn('Error converting to date:', error);
  }
  
  return new Date();
}
