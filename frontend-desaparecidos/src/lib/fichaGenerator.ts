/**
 * Generador de Ficha Oficial de Búsqueda Ciudadana (DMQ Desaparecidos)
 * Renderiza un afiche digital de alta resolución (1200x1200px) en Canvas y lo descarga como PNG.
 */

export interface CasoFichaData {
  id: string;
  nombres: string;
  apellidos: string;
  edad: number;
  sexo: string;
  fecha_desaparicion: string;
  parroquia_desaparicion?: string;
  barrio?: string;
  ropa_descripcion?: string;
  senas_particulares?: string;
  foto_url?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

export async function generarFichaBusqueda(caso: CasoFichaData): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el contexto 2D del Canvas');

  const nombreCompleto = `${caso.nombres || ''} ${caso.apellidos || ''}`.trim().toUpperCase();
  const sector = (caso.parroquia_desaparicion || caso.barrio || 'DISTRITO METROPOLITANO DE QUITO').toUpperCase();
  const fecha = caso.fecha_desaparicion || 'NO ESPECIFICADA';
  const vestimenta = caso.ropa_descripcion || 'No detallada al momento del reporte.';
  const senas = caso.senas_particulares || 'Sin señas particulares reportadas.';
  const codigoCaso = `DMQ-${caso.id.slice(0, 8).toUpperCase()}`;
  const caseUrl = `https://proyecto-desaparecidos.vercel.app/casos/${caso.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(caseUrl)}`;

  // 1. Fondo principal oscuro institucional con degradado elegante
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1200);
  bgGrad.addColorStop(0, '#070b14');
  bgGrad.addColorStop(1, '#0c1322');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 1200);

  // Marco exterior grueso
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 1186, 1186);

  // 2. Franja superior de Alerta Oficial (Rojo / Amarillo)
  const headerGrad = ctx.createLinearGradient(0, 0, 1200, 0);
  headerGrad.addColorStop(0, '#991b1b');
  headerGrad.addColorStop(0.5, '#dc2626');
  headerGrad.addColorStop(1, '#991b1b');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(14, 14, 1172, 145);

  // Texto de la franja superior
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚨 ALERTA OFICIAL DE BÚSQUEDA 🚨', 600, 64);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 22px sans-serif';
  ctx.fillText('DISTRITO METROPOLITANO DE QUITO • PLATAFORMA CIUDADANA', 600, 104);

  ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
  ctx.font = '600 15px sans-serif';
  ctx.fillText('LEY ORGÁNICA DE PROTECCIÓN DE DATOS PERSONALES (LOPDP - ART. 8)', 600, 136);

  // 3. Columna Izquierda: Fotografía de la persona
  const photoX = 45;
  const photoY = 175;
  const photoW = 450;
  const photoH = 540;

  // Fondo y marco de foto
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  let fotoCargada = false;
  if (caso.foto_url) {
    try {
      const img = await loadImage(caso.foto_url);
      ctx.drawImage(img, photoX + 6, photoY + 6, photoW - 12, photoH - 12);
      fotoCargada = true;
    } catch {
      fotoCargada = false;
    }
  }

  if (!fotoCargada) {
    ctx.fillStyle = '#64748b';
    ctx.font = '110px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👤', photoX + photoW / 2, photoY + photoH / 2 + 30);
    ctx.font = '700 20px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SIN FOTOGRAFÍA DISPONIBLE', photoX + photoW / 2, photoY + photoH / 2 + 80);
  }

  // Cinta de estado sobre la foto
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(photoX, photoY + photoH - 52, photoW, 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DESAPARECIDO/A', photoX + photoW / 2, photoY + photoH - 16);

  // Bloque inferior de la foto: Código oficial del caso
  const codeBoxY = photoY + photoH + 15;
  const codeBoxH = 145;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.fillRect(photoX, codeBoxY, photoW, codeBoxH);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, codeBoxY, photoW, codeBoxH);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CÓDIGO ÚNICO DE EXPEDIENTE:', photoX + photoW / 2, codeBoxY + 32);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 30px monospace';
  ctx.fillText(codigoCaso, photoX + photoW / 2, codeBoxY + 74);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '800 15px sans-serif';
  ctx.fillText('⚡ BÚSQUEDA ACTIVA EN TODO EL DMQ', photoX + photoW / 2, codeBoxY + 116);

  // 4. Columna Derecha: Ficha de Datos
  const dataX = 525;
  let currentY = 210;

  ctx.textAlign = 'left';

  // Nombre completo
  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 36px sans-serif';
  ctx.fillText(nombreCompleto, dataX, currentY);
  currentY += 40;

  // Línea divisoria
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dataX, currentY);
  ctx.lineTo(1155, currentY);
  ctx.stroke();
  currentY += 34;

  // Filas de datos (Medición dinámica para evitar cualquier solapamiento)
  const drawDataRow = (label: string, value: string, icon = '•') => {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 20px sans-serif';
    const labelText = `${icon} ${label}:`;
    ctx.fillText(labelText, dataX, currentY);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 22px sans-serif';
    // Offset seguro de 280px para que jamás se sobreponga
    ctx.fillText(value, dataX + 280, currentY);
    currentY += 42;
  };

  drawDataRow('EDAD', `${caso.edad} AÑOS`, '👤');
  drawDataRow('SEXO', `${caso.sexo.toUpperCase()}`, '⚧');
  drawDataRow('DESAPARICIÓN', `${fecha}`, '🗓️');
  drawDataRow('SECTOR / LUGAR', `${sector}`, '📍');

  currentY += 8;

  // Cuadros descriptivos (Vestimenta y Señas)
  const drawTextBox = (title: string, text: string, boxH: number) => {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.fillRect(dataX, currentY, 630, boxH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(dataX, currentY, 630, boxH);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 18px sans-serif';
    ctx.fillText(title, dataX + 16, currentY + 30);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 18px sans-serif';
    // Multi-line wrap
    const words = text.split(' ');
    let line = '';
    let lineY = currentY + 62;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 590 && n > 0) {
        ctx.fillText(line, dataX + 16, lineY);
        line = words[n] + ' ';
        lineY += 25;
        if (lineY > currentY + boxH - 15) break;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, dataX + 16, lineY);
    currentY += boxH + 14;
  };

  drawTextBox('👕 VESTIMENTA AL MOMENTO DE LA DESAPARICIÓN:', vestimenta, 130);
  drawTextBox('🔍 SEÑAS PARTICULARES (CICATRICES / TATUAJES):', senas, 130);

  // Banner de Zona de Búsqueda
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.fillRect(dataX, currentY, 630, 85);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(dataX, currentY, 630, 85);

  ctx.fillStyle = '#fef08a';
  ctx.font = '800 18px sans-serif';
  ctx.fillText(`📍 ZONA PRIORITARIA DE RASTREO: ${sector}`, dataX + 16, currentY + 32);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 15px sans-serif';
  ctx.fillText('Si viste a esta persona en este sector, ingresa tu pista confidencial.', dataX + 16, currentY + 62);

  // 5. Franja Inferior: Canales de Emergencia y Código QR
  const footerY = 905;
  const footerH = 275;
  ctx.fillStyle = '#080c16';
  ctx.fillRect(18, footerY, 1164, footerH);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, footerY, 1164, footerH);

  // Cargar y dibujar QR
  const qrBoxX = 35;
  const qrBoxY = footerY + 18;
  const qrBoxSize = 238;

  try {
    const qrImg = await loadImage(qrUrl);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
    ctx.drawImage(qrImg, qrBoxX + 6, qrBoxY + 6, qrBoxSize - 12, qrBoxSize - 12);
  } catch {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
    ctx.fillStyle = '#000000';
    ctx.font = '700 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESCANEAR QR', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize / 2);
  }

  // Texto de números de emergencia
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 28px sans-serif';
  ctx.fillText('📞 SI TIENES INFORMACIÓN O LO/LA HAS VISTO:', 305, footerY + 52);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px sans-serif';
  ctx.fillText('🚨 ECU 911   |   🚔 1800-DELITO (335486)', 305, footerY + 105);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 22px sans-serif';
  ctx.fillText(`🌐 Portal Oficial: proyecto-desaparecidos.vercel.app`, 305, footerY + 152);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 16px sans-serif';
  ctx.fillText('📲 Escanea el código QR con tu celular para abrir este caso directamente y aportar pistas.', 305, footerY + 192);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
  ctx.font = '500 13px sans-serif';
  ctx.fillText('Ficha oficial generada bajo la Ley Orgánica de Protección de Datos Personales (LOPDP) para fines exclusivos de búsqueda.', 305, footerY + 235);

  return canvas.toDataURL('image/png');
}

export async function descargarFichaOficial(caso: CasoFichaData) {
  const dataUrl = await generarFichaBusqueda(caso);
  const nombreLimpio = `${caso.nombres}_${caso.apellidos}`.replace(/\s+/g, '_');
  const link = document.createElement('a');
  link.download = `Alerta_Busqueda_DMQ_${nombreLimpio}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
