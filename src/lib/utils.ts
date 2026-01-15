import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/**
 * Formata uma string de data para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

/**
 * Formata uma data com hora no formato brasileiro
 */
export function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Calcula quantos dias faltam até uma determinada data
 * Retorna número negativo se a data já passou
 */
export function getDaysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Gera opções de anos (ano atual e X anos anteriores)
 */
export function getYearOptions(yearsBack: number = 5): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = 0; i <= yearsBack; i += 1) {
        years.push(currentYear - i);
    }
    return years;
}

/**
 * Array de nomes de meses abreviados em português
 */
export const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Array de nomes de meses completos em português
 */
export const MONTHS_FULL = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
