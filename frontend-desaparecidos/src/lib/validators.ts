const PROVINCIAS_EC: Record<number, string> = {
  1: 'Azuay', 2: 'Bolívar', 3: 'Cañar', 4: 'Carchi', 5: 'Cotopaxi',
  6: 'Chimborazo', 7: 'El Oro', 8: 'Esmeraldas', 9: 'Guayas', 10: 'Imbabura',
  11: 'Loja', 12: 'Los Ríos', 13: 'Manabí', 14: 'Morona Santiago', 15: 'Napo',
  16: 'Pastaza', 17: 'Pichincha', 18: 'Tungurahua', 19: 'Zamora Chinchipe',
  20: 'Galápagos', 21: 'Sucumbíos', 22: 'Orellana', 23: 'Santo Domingo de los Tsáchilas',
  24: 'Santa Elena', 30: 'Ecuatorianos en el Exterior'
};

/**
 * Análisis exhaustivo de Cédula Ecuatoriana - Módulo 10 del Registro Civil
 */
export function analizarCedulaEC(cedula: string): { valida: boolean; mensaje: string; provincia?: string } {
  if (!cedula || cedula.trim() === '') return { valida: false, mensaje: '' };
  if (!/^\d+$/.test(cedula)) return { valida: false, mensaje: 'Solo se permiten dígitos numéricos.' };
  if (cedula.length < 10) return { valida: false, mensaje: `Faltan ${10 - cedula.length} dígitos (10 requeridos).` };
  if (cedula.length > 10) return { valida: false, mensaje: 'La cédula debe tener exactamente 10 dígitos.' };

  const provinciaCod = parseInt(cedula.substring(0, 2), 10);
  const provinciaNombre = PROVINCIAS_EC[provinciaCod];
  if (!provinciaNombre) {
    return { valida: false, mensaje: `Código de provincia '${cedula.substring(0, 2)}' no existe en Ecuador (01-24 o 30).` };
  }

  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito > 5) {
    return { valida: false, mensaje: 'Tercer dígito inválido para persona natural (debe ser de 0 a 5).' };
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula[i], 10) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }
  const digitoVerificador = (10 - (suma % 10)) % 10;
  if (digitoVerificador !== parseInt(cedula[9], 10)) {
    return { valida: false, mensaje: 'Dígito verificador incorrecto. Cédula no válida según el Registro Civil (Módulo 10).' };
  }

  return { valida: true, mensaje: `✓ Cédula válida (${provinciaNombre})`, provincia: provinciaNombre };
}

/**
 * Validación booleana rápida de Cédula Ecuatoriana
 */
export function validarCedulaEC(cedula: string): boolean {
  return analizarCedulaEC(cedula).valida;
}

/**
 * Validate DMQ bounding box coordinates
 */
export function validarCoordenadasDMQ(lat: number, lng: number): boolean {
  return lat >= -0.55 && lat <= 0.10 && lng >= -78.80 && lng <= -78.20;
}

/**
 * Validate age range
 */
export function validarEdad(edad: number): boolean {
  return Number.isInteger(edad) && edad >= 0 && edad <= 120;
}

/**
 * Validate date is not in the future
 */
export function validarFechaNoFutura(fecha: string): boolean {
  return new Date(fecha) <= new Date();
}
