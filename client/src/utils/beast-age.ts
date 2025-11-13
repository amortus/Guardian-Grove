/**
 * Sistema de Idade das Beasts usando Calendário Real
 * Calcula idade baseado em dias reais do calendário de Brasília
 */

import { getCurrentCalendar, CalendarDate, getDaysSinceDate } from './day-night';

/**
 * Calcula a idade de uma besta em dias do calendário real
 */
export function calculateBeastAgeInRealDays(birthDate: CalendarDate | number | null | undefined): number {
  if (!birthDate) {
    return 0;
  }
  
  // Se birthDate é um timestamp, converter para CalendarDate
  let birthCalendar: CalendarDate;
  if (typeof birthDate === 'number') {
    birthCalendar = timestampToCalendarDate(birthDate);
  } else {
    birthCalendar = birthDate;
  }
  
  // Calcular diferença em dias do calendário real
  return getDaysSinceDate(birthCalendar);
}

/**
 * Converte timestamp para CalendarDate (timezone de Brasília)
 */
export function timestampToCalendarDate(timestamp: number): CalendarDate {
  const date = new Date(timestamp);
  
  // Obter componentes em Brasília
  const year = parseInt(date.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric'
  }));
  
  const month = parseInt(date.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    month: 'numeric'
  }));
  
  const day = parseInt(date.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    day: 'numeric'
  }));
  
  const dayOfWeek = parseInt(date.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'numeric'
  })) - 1;
  
  const DAY_NAMES = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Calcular dia do ano
  const startOfYear = new Date(year, 0, 1);
  const currentDate = new Date(year, month - 1, day);
  const dayOfYear = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  
  const dateString = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  const fullDateString = `${DAY_NAMES[dayOfWeek]}, ${day} de ${MONTH_NAMES[month - 1]} de ${year}`;
  
  return {
    year,
    month,
    day,
    dayOfWeek,
    dayOfWeekName: DAY_NAMES[dayOfWeek],
    monthName: MONTH_NAMES[month - 1],
    dateString,
    fullDateString,
    dayOfYear,
    isLeapYear,
  };
}

/**
 * Obtém a data de nascimento atual (hoje) em formato CalendarDate
 */
export function getCurrentBirthDate(): CalendarDate {
  return getCurrentCalendar();
}

/**
 * Converte CalendarDate para timestamp (meia-noite em Brasília)
 */
export function calendarDateToTimestamp(date: CalendarDate): number {
  // Criar Date para meia-noite UTC
  const utcDate = Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0, 0);
  
  // Calcular offset de Brasília
  const now = new Date();
  const utcHour = now.getUTCHours();
  const brasiliaHour = parseInt(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false
  }));
  
  const offsetHours = brasiliaHour - utcHour;
  if (offsetHours < -12) offsetHours += 24;
  if (offsetHours > 12) offsetHours -= 24;
  
  // Ajustar para meia-noite em Brasília
  return utcDate - (offsetHours * 60 * 60 * 1000);
}

