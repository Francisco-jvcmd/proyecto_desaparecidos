/**
 * Validación de Cédula Ecuatoriana - Algoritmo Módulo 10
 * Implementación del algoritmo del Registro Civil del Ecuador
 */
export function validarCedulaEC(cedula: string): boolean {
  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(cedula)) return false;
  
  // Province code: 01-24 or 30
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;
  
  // Third digit must be 0-5 (natural person)
  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito > 5) return false;
  
  // Módulo 10 checksum
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula[i], 10) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }
  
  const digitoVerificador = (10 - (suma % 10)) % 10;
  return digitoVerificador === parseInt(cedula[9], 10);
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
