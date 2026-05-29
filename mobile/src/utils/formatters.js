import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(d)) return '';
    return format(d, 'MMM d, yyyy');
  } catch {
    return '';
  }
};

export const formatDateShort = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(d)) return '';
    return format(d, 'MMM d');
  } catch {
    return '';
  }
};

export const timeAgo = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(d)) return '';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '';
  }
};

export const formatAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  try {
    const d = typeof dueDate === 'string' ? parseISO(dueDate) : new Date(dueDate);
    return d < new Date();
  } catch {
    return false;
  }
};

export const getCategoryColor = (category) => {
  const categoryColors = {
    Rent: '#4F46E5',
    Groceries: '#10B981',
    Utilities: '#F59E0B',
    Internet: '#3B82F6',
    Cleaning: '#8B5CF6',
    Other: '#6B7280',
  };
  return categoryColors[category] || '#6B7280';
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
