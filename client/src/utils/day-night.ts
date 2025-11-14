/**
 * Sistema de Dia e Noite + Calendário Real
 * Calcula hora do dia, estado (dia/noite) e calendário baseado no tempo real de Brasília
 */

export interface TimeOfDay {
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  isNight: boolean; // true se for noite (18:00 - 04:59)
  timeString: string; // "HH:MM"
}

export interface CalendarDate {
  year: number; // Ano (ex: 2024)
  month: number; // Mês (1-12)
  day: number; // Dia do mês (1-31)
  dayOfWeek: number; // Dia da semana (0 = Domingo, 6 = Sábado)
  dayOfWeekName: string; // Nome do dia (ex: "Segunda-feira")
  monthName: string; // Nome do mês (ex: "Janeiro")
  dateString: string; // "DD/MM/YYYY"
  fullDateString: string; // "Segunda-feira, 15 de Janeiro de 2024"
  dayOfYear: number; // Dia do ano (1-365/366)
  isLeapYear: boolean; // Se é ano bissexto
}

export interface GameTime {
  timeOfDay: TimeOfDay;
  calendar: CalendarDate;
  timestamp: number; // Timestamp UTC
  brasiliaTimestamp: number; // Timestamp em Brasília
}

/**
 * Calcula a hora do dia atual (timezone de Brasília)
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  const now = new Date();
  
  // Converter para timezone de Brasília
  const brasiliaTime = new Date(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo'
  }));
  
  const hour = brasiliaTime.getHours();
  const minute = brasiliaTime.getMinutes();
  const second = brasiliaTime.getSeconds();
  
  // Noite: 18:00 (18) até 04:59 (4)
  const isNight = hour >= 18 || hour < 5;
  
  // Formatar hora como "HH:MM"
  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  return {
    hour,
    minute,
    second,
    isNight,
    timeString,
  };
}

/**
 * Calcula o progresso do dia (0.0 = meia-noite, 1.0 = próxima meia-noite)
 */
export function getDayProgress(): number {
  const time = getCurrentTimeOfDay();
  // Converter hora + minuto + segundo em progresso (0-1)
  const totalSeconds = time.hour * 3600 + time.minute * 60 + time.second;
  const dayProgress = totalSeconds / 86400; // 86400 segundos em um dia
  return dayProgress;
}

/**
 * Calcula o progresso da transição dia/noite (0.0 = dia completo, 1.0 = noite completa)
 * Suave transição entre 17:00-19:00 e 04:00-06:00
 */
export function getDayNightBlend(): number {
  const time = getCurrentTimeOfDay();
  const hour = time.hour;
  const minute = time.minute;
  
  // Transição para noite: 17:00 - 19:00 (2 horas)
  if (hour >= 17 && hour < 19) {
    const progress = ((hour - 17) * 60 + minute) / 120; // 0-1 em 2 horas
    return Math.min(1, progress);
  }
  
  // Noite completa: 19:00 - 04:59
  if (hour >= 19 || hour < 5) {
    // Transição para dia: 04:00 - 06:00 (2 horas)
    if (hour >= 4 && hour < 6) {
      const progress = ((hour - 4) * 60 + minute) / 120; // 0-1 em 2 horas
      return 1 - Math.min(1, progress); // Inverter: 1 -> 0
    }
    return 1; // Noite completa
  }
  
  // Dia completo: 06:00 - 16:59
  return 0;
}

/**
 * Obtém a intensidade da luz ambiente (0.0 = noite escura, 1.0 = dia claro)
 */
export function getAmbientLightIntensity(): number {
  const blend = getDayNightBlend();
  // Dia: 1.0, Noite: 0.4 (mais claro à noite)
  return 1.0 - (blend * 0.6);
}

/**
 * Obtém a cor do céu (RGB) baseado na hora do dia
 */
export function getSkyColor(): { r: number; g: number; b: number } {
  const blend = getDayNightBlend();
  
  // Céu diurno (azul claro)
  const daySky = { r: 135 / 255, g: 206 / 255, b: 250 / 255 }; // Sky blue
  
  // Céu noturno (azul escuro/roxo)
  const nightSky = { r: 60 / 255, g: 82 / 255, b: 130 / 255 }; // Gentle moonlit blue
  
  // Interpolar entre dia e noite
  return {
    r: daySky.r + (nightSky.r - daySky.r) * blend,
    g: daySky.g + (nightSky.g - daySky.g) * blend,
    b: daySky.b + (nightSky.b - daySky.b) * blend,
  };
}

/**
 * Nomes dos dias da semana em português
 */
const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

/**
 * Nomes dos meses em português
 */
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

/**
 * Calcula a data atual do calendário (timezone de Brasília)
 */
export function getCurrentCalendar(): CalendarDate {
  const now = new Date();
  
  // Obter data em Brasília
  const brasiliaDateStr = now.toLocaleString('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  });
  
  // Obter componentes individuais
  const year = parseInt(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric'
  }));
  
  const month = parseInt(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    month: 'numeric'
  }));
  
  const day = parseInt(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    day: 'numeric'
  }));
  
  // Calcular dia da semana corretamente
  // Criar Date object com valores de Brasília
  const brasiliaDate = new Date(year, month - 1, day);
  const dayOfWeek = brasiliaDate.getDay(); // 0 = Domingo, 6 = Sábado
  
  // Calcular dia do ano
  const startOfYear = new Date(year, 0, 1);
  const currentDate = new Date(year, month - 1, day);
  const dayOfYear = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Verificar se é ano bissexto
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  
  // Formatar strings
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
 * Obtém o tempo completo do jogo (hora + calendário)
 */
export function getGameTime(): GameTime {
  const now = new Date();
  
  return {
    timeOfDay: getCurrentTimeOfDay(),
    calendar: getCurrentCalendar(),
    timestamp: now.getTime(),
    brasiliaTimestamp: getBrasiliaTimestamp(),
  };
}

/**
 * Obtém timestamp atual em Brasília (em milissegundos)
 */
export function getBrasiliaTimestamp(): number {
  const now = new Date();
  
  // Obter hora atual em Brasília
  const brasiliaTimeStr = now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Converter para Date e obter timestamp
  // Formato: "MM/DD/YYYY, HH:MM:SS"
  const [datePart, timePart] = brasiliaTimeStr.split(', ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  
  // Criar Date em UTC mas com valores de Brasília
  // Depois ajustar para o offset correto
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  
  // Calcular offset de Brasília
  const testDate = new Date();
  const utcHour = testDate.getUTCHours();
  const brasiliaHour = parseInt(testDate.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false
  }));
  
  let offsetHours = brasiliaHour - utcHour;
  if (offsetHours < -12) offsetHours += 24;
  if (offsetHours > 12) offsetHours -= 24;
  
  // Ajustar timestamp para refletir o offset
  return utcDate.getTime() - (offsetHours * 60 * 60 * 1000);
}

/**
 * Calcula o timestamp da meia-noite de hoje em Brasília
 */
export function getMidnightTimestampBrasilia(): number {
  const calendar = getCurrentCalendar();
  
  // Criar data para meia-noite de hoje em Brasília
  // Usar Date.UTC e ajustar para timezone de Brasília
  const now = new Date();
  const utcHour = now.getUTCHours();
  const brasiliaHour = parseInt(now.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false
  }));
  
  let offsetHours = brasiliaHour - utcHour;
  if (offsetHours < -12) offsetHours += 24;
  if (offsetHours > 12) offsetHours -= 24;
  
  // Criar timestamp para meia-noite UTC
  const midnightUTC = Date.UTC(calendar.year, calendar.month - 1, calendar.day, 0, 0, 0, 0);
  
  // Ajustar para meia-noite em Brasília
  return midnightUTC - (offsetHours * 60 * 60 * 1000);
}

/**
 * Calcula quantos dias se passaram desde uma data específica (em dias do calendário real)
 */
export function getDaysSinceDate(startDate: CalendarDate): number {
  const current = getCurrentCalendar();
  
  // Converter para Date objects para calcular diferença
  const start = new Date(startDate.year, startDate.month - 1, startDate.day);
  const end = new Date(current.year, current.month - 1, current.day);
  
  // Calcular diferença em dias
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

