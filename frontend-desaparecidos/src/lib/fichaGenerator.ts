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
    img.crossOrigin = 'anonymous';
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
  const caseUrl = `https://proyecto-desaparecidos.vercel.app/casos/${caso.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(caseUrl)}`;

  // 1. Fondo principal oscuro institucional con degradado elegante
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1200);
  bgGrad.addColorStop(0, '#0a0e17');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 1200);

  // Marco exterior
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 1188, 1188);

  // 2. Franja superior de Alerta Oficial (Rojo / Amarillo)
  const headerGrad = ctx.createLinearGradient(0, 0, 1200, 0);
  headerGrad.addColorStop(0, '#b91c1c');
  headerGrad.addColorStop(0.5, '#dc2626');
  headerGrad.addColorStop(1, '#b91c1c');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(12, 12, 1176, 150);

  // Texto de la franja superior
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚨 ALERTA OFICIAL DE BÚSQUEDA 🚨', 600, 68);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px sans-serif';
  ctx.fillText('DISTRITO METROPOLITANO DE QUITO • PLATAFORMA CIUDADANA', 600, 112);

  ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
  ctx.font = '600 16px sans-serif';
  ctx.fillText('LEY ORGÁNICA DE PROTECCIÓN DE DATOS PERSONALES (LOPDP - ART. 8)', 600, 142);

  // 3. Columna Izquierda: Fotografía de la persona
  const photoX = 50;
  const photoY = 190;
  const photoW = 420;
  const photoH = 520;

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
    ctx.font = '100px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👤', photoX + photoW / 2, photoY + photoH / 2 + 30);
    ctx.font = '700 20px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SIN FOTOGRAFÍA DISPONIBLE', photoX + photoW / 2, photoY + photoH / 2 + 80);
  }

  // Cinta de estado sobre la foto
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(photoX, photoY + photoH - 50, photoW, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DESAPARECIDO/A', photoX + photoW / 2, photoY + photoH - 16);

  // 4. Columna Derecha: Ficha de Datos
  const dataX = 510;
  let currentY = 220;

  ctx.textAlign = 'left';

  // Nombre completo
  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 36px sans-serif';
  ctx.fillText(nombreCompleto, dataX, currentY);
  currentY += 45;

  // Línea divisoria
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dataX, currentY);
  ctx.lineTo(1150, currentY);
  ctx.stroke();
  currentY += 35;

  const drawDataRow = (label: string, value: string, icon = '•') => {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 20px sans-serif';
    ctx.fillText(`${icon} ${label}:`, dataX, currentY);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(value, dataX + 220, currentY);
    currentY += 42;
  };

  drawDataRow('EDAD', `${caso.edad} AÑOS`, '👤');
  drawDataRow('SEXO', `${caso.sexo.toUpperCase()}`, '⚧');
  drawDataRow('FECHA DESAPARICIÓN', `${fecha}`, '🗓️');
  drawDataRow('SECTOR / LUGAR', `${sector}`, '📍');

  currentY += 10;
  // Cuadros descriptivos (Vestimenta y Señas)
  const drawTextBox = (title: string, text: string) => {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(dataX, currentY, 640, 110);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(dataX, currentY, 640, 110);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 18px sans-serif';
    ctx.fillText(title, dataX + 16, currentY + 30);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 18px sans-serif';
    // Multi-line wrap
    const words = text.split(' ');
    let line = '';
    let lineY = currentY + 60;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 600 && n > 0) {
        ctx.fillText(line, dataX + 16, lineY);
        line = words[n] + ' ';
        lineY += 24;
        if (lineY > currentY + 95) break; // evitar desbordar
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, dataX + 16, lineY);
    currentY += 125;
  };

  drawTextBox('👕 VESTIMENTA AL MOMENTO DE LA DESAPARICIÓN:', vestimenta);
  drawTextBox('🔍 SEÑAS PARTICULARES (CICATRICES / TATUAJES):', senas);

  // 5. Franja Inferior: Canales de Emergencia y Código QR
  const footerY = 960;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, footerY, 1160, 215);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, footerY, 1160, 215);

  // Cargar y dibujar QR
  try {
    const qrImg = await loadImage(qrUrl);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, footerY + 15, 185, 185);
    ctx.drawImage(qrImg, 45, footerY + 20, 175, 175);
  } catch {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, footerY + 15, 185, 185);
    ctx.fillStyle = '#000000';
    ctx.font = '700 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PORTAL DMQ', 132, footerY + 110);
  }

  // Texto de números de emergencia
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 28px sans-serif';
  ctx.fillText('📞 SI TIENES INFORMACIÓN O LO/LA HAS VISTO:', 250, footerY + 55);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 32px sans-serif';
  ctx.fillText('🚨 ECU 911   |   🚔 1800-DELITO (335486)', 250, footerY + 105);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 22px sans-serif';
  ctx.fillText(`🌐 Aporta pistas en: proyecto-desaparecidos.vercel.app`, 250, footerY + 145);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 15px sans-serif';
  ctx.fillText('Escanea el código QR con la cámara de tu celular para abrir el caso y enviar reportes confidenciales.', 250, footerY + 180);

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
