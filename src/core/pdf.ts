import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function gerarPDF(auditoria: any, fotos: File[]) {
  const pdf = new jsPDF("p", "mm", "a4");

  // 1) Página conteúdo textual (gerada do #pdf-content offscreen)
  const node = document.getElementById("pdf-content")!;
  node.classList.add("is-rendering");
  const canvas = await html2canvas(node as HTMLElement, { scale: 2, useCORS: true });
  node.classList.remove("is-rendering");

  const img = canvas.toDataURL("image/jpeg", 0.95);
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const iw = pw - 20;
  const ih = iw * (canvas.height / canvas.width);

  pdf.addImage(img, "JPEG", 10, 10, iw, ih);

  // 2) Relatório Fotográfico (título + 4 fotos por página)
  if (fotos?.length) {
    const slots = [
      { x: 10, y: 25, w: (pw - 30) / 2, h: (ph - 40) / 2 },
      { x: 20 + (pw - 30) / 2, y: 25, w: (pw - 30) / 2, h: (ph - 40) / 2 },
      { x: 10, y: 25 + (ph - 40) / 2, w: (pw - 30) / 2, h: (ph - 40) / 2 },
      { x: 20 + (pw - 30) / 2, y: 25 + (ph - 40) / 2, w: (pw - 30) / 2, h: (ph - 40) / 2 }
    ];

    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text("Relatório fotográfico", 10, 15);

    for (let i = 0; i < fotos.length; i++) {
      if (i && i % 4 === 0) { pdf.addPage(); pdf.text("Relatório fotográfico", 10, 15); }
      const s = slots[i % 4];
      const dataUrl = await toDataURL(fotos[i]);
      pdf.addImage(dataUrl, "JPEG", s.x, s.y, s.w, s.h);
    }
  }

  pdf.save(`auditoria_${auditoria.MetaKey}_${auditoria.DataAuditoria}.pdf`);
}

function toDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
