document.addEventListener("DOMContentLoaded", () => {
  // -------- Configuración de radios por sección --------
  const items = document.querySelectorAll(".radios");

  const estructuraPozo = ["tuberia","tapon","fernco","soldaduras","mangasGas","samplePort"];
  const areaCircundante = ["lixiviados","erosion","vegetacion","accesibilidad"];
  const sistemaCaptacionSiNo = ["conexionLateral","condensado","azufre"];
  const sistemaCaptacionEstado = ["valvulaGas"];

  items.forEach(item => {
    const name = item.dataset.item;
    let opciones = [];
    if (estructuraPozo.includes(name)) opciones = ["Buena","Regular","Mala"];
    else if (areaCircundante.includes(name)) opciones = ["Leve","Moderado","Severo"];
    else if (sistemaCaptacionSiNo.includes(name)) opciones = ["Sí","No"];
    else if (sistemaCaptacionEstado.includes(name)) opciones = ["Funcional","Dañada","Ausente"];

    // radios
    opciones.forEach(option => {
      const label = document.createElement("label");
      const radio = document.createElement("input");
      radio.type = "radio"; radio.name = name; radio.value = option;
      // permitir desmarcar haciendo clic sobre el radio ya seleccionado
      radio.addEventListener("mousedown", (e) => {
        const wasChecked = e.target.checked;
        if (wasChecked) {
          // retrasar para después del toggle nativo
          setTimeout(() => { e.target.checked = false; }, 0);
        }
      });
      label.appendChild(radio); label.append(` ${option}`);
      item.appendChild(label);
    });

    // botón "Borrar" por grupo (desmarcar)
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "clear-group";
    clearBtn.textContent = "Borrar";
    clearBtn.addEventListener("click", () => {
      document.querySelectorAll(`input[type="radio"][name="${name}"]`).forEach(r => r.checked = false);
    });
    item.appendChild(clearBtn);
  });

  // -------- Limpiar por sección --------
  const sectionMap = {
    "estructura": estructuraPozo,
    "captacion": [...sistemaCaptacionSiNo, ...sistemaCaptacionEstado],
    "circundante": areaCircundante
  };
  document.querySelectorAll(".clear-section").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.section;
      (sectionMap[key] || []).forEach(group => {
        document.querySelectorAll(`input[type="radio"][name="${group}"]`).forEach(r => r.checked = false);
      });
    });
  });

  // -------- Envío de formulario (prevent default) --------
  document.getElementById("inspectionForm").addEventListener("submit", e => {
    e.preventDefault();
    alert("✅ Formulario enviado correctamente");
  });

  // -------- GPS: automático y manual --------
  const gpsField = document.getElementById("gps");
  const gpsModeAuto = document.getElementById("gpsModeAuto");
  const gpsModeManual = document.getElementById("gpsModeManual");
  const btnCaptureGPS = document.getElementById("btnCaptureGPS");

  function getBrowserGPS() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude.toFixed(6);
          const lon = pos.coords.longitude.toFixed(6);
          gpsField.value = `${lat}, ${lon}`;
        },
        err => {
          if (!gpsModeManual.checked) gpsField.placeholder = "Error al obtener GPS";
          console.error("Error de geolocalización:", err.message);
        }
      );
    } else {
      if (!gpsModeManual.checked) gpsField.placeholder = "Geolocalización no soportada";
    }
  }

  // Estado inicial: Automático
  function setGPSMode() {
    if (gpsModeAuto.checked) {
      gpsField.readOnly = true;
      gpsField.placeholder = "Obteniendo ubicación...";
      getBrowserGPS();
    } else {
      gpsField.readOnly = false;
      gpsField.placeholder = "Escriba lat, lon (decimal)";
    }
  }

  gpsModeAuto.addEventListener("change", setGPSMode);
  gpsModeManual.addEventListener("change", setGPSMode);
  btnCaptureGPS.addEventListener("click", () => getBrowserGPS());

  // Inicializar al cargar
  setGPSMode();

  // -------- Email (mailto) --------
  document.getElementById("btnEmail").addEventListener("click", () => {
    const form = document.getElementById("inspectionForm");
    const data = new FormData(form);
    let body = "";
    for (let [key, value] of data.entries()) body += `${key}: ${value}\n`;
    window.location.href = `mailto:?subject=Hoja de Inspección Pozo de Gas&body=${encodeURIComponent(body)}`;
  });

  // -------- Impresión --------
  document.getElementById("btnPrint").addEventListener("click", () => window.print());

  // -------- Limpiar todo --------
  document.getElementById("btnLimpiarTodo").addEventListener("click", () => {
    // limpiar radios
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    // limpiar textos/selects/fechas/areas
    document.querySelectorAll('input[type="text"], input[type="date"], input[type="time"]').forEach(i => { if (i.id !== "gps") i.value = ""; });
    document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    document.querySelectorAll('textarea').forEach(t => t.value = "");
  });

  // -------- Fotos --------
  const photosInput = document.getElementById("photos");
  const preview = document.getElementById("photoPreview");
  const clearBtn = document.getElementById("clearPhotos");
  let photoFiles = [];

  function renderGallery() {
    preview.innerHTML = "";
    photoFiles.forEach((file, idx) => {
      const card = document.createElement("div"); card.className = "thumb";
      const img = document.createElement("img"); img.alt = file.name;
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target.result; };
      reader.readAsDataURL(file);
      const actions = document.createElement("div"); actions.className = "thumb-actions";
      const removeBtn = document.createElement("button");
      removeBtn.className = "small-btn"; removeBtn.type = "button"; removeBtn.textContent = "✖"; removeBtn.title = "Eliminar";
      removeBtn.addEventListener("click", () => { photoFiles.splice(idx, 1); renderGallery(); });
      actions.appendChild(removeBtn); card.appendChild(img); card.appendChild(actions); preview.appendChild(card);
    });
  }
  photosInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    const imgs = files.filter(f => f.type.startsWith("image/"));
    photoFiles = photoFiles.concat(imgs);
    renderGallery();
    photosInput.value = "";
  });
  clearBtn.addEventListener("click", () => { photoFiles = []; renderGallery(); });

  // -------- Tabla dinámica de Acciones Correctivas --------
  document.getElementById("addRow").addEventListener("click", () => {
    const tbody = document.querySelector("#accionesTable tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" name="accion[]"></td>
      <td><input type="text" name="responsable[]"></td>
      <td>
        <select name="prioridad[]">
          <option>Alta</option>
          <option>Media</option>
          <option>Baja</option>
        </select>
      </td>
      <td><input type="date" name="fechaAccion[]"></td>
      <td><button type="button" class="removeRow">✖</button></td>
    `;
    tbody.appendChild(row);
    row.querySelector(".removeRow").addEventListener("click", () => row.remove());
  });
  document.querySelectorAll(".removeRow").forEach(btn => btn.addEventListener("click", (e) => e.target.closest("tr").remove()));

  // -------- PDF con datos + fotos + acciones --------
  document.getElementById("btnPDF").addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    doc.setFont("helvetica","bold"); doc.setFontSize(16);
    doc.text("Hoja de Inspección – Pozo de Gas", pageW/2, y, { align: "center" }); y += 24;

    const form = document.getElementById("inspectionForm");
    const data = new FormData(form);
    doc.setFont("helvetica","normal"); doc.setFontSize(11);

    const addLine = (line) => {
      const lines = doc.splitTextToSize(line, pageW - margin*2);
      lines.forEach(l => { if (y > pageH - margin) { doc.addPage(); y = margin; } doc.text(l, margin, y); y += 14; });
    };

    addLine(`Fecha: ${data.get("fecha") || ""}   Hora: ${data.get("hora") || ""}`);
    addLine(`Inspector: ${data.get("inspector") || ""}`);
    addLine(`Pozo ID: ${data.get("pozoId") || ""}`);
    addLine(`GPS: ${data.get("gps") || ""}`);
    addLine(`Clima: ${data.get("clima") || ""}`);
    addLine("");

    const radioNames = new Set();
    document.querySelectorAll('input[type="radio"]').forEach(r => radioNames.add(r.name));
    radioNames.forEach(name => {
      const checked = document.querySelector(`input[type="radio"][name="${name}"]:checked`);
      if (checked) addLine(`${name}: ${checked.value}`);
    });

    addLine("");
    addLine(`Observaciones: ${data.get("observaciones") || ""}`);

    addLine("");
    addLine("Acciones Correctivas:");
    const rows = document.querySelectorAll("#accionesTable tbody tr");
    rows.forEach((row, idx) => {
      const accion = row.querySelector('input[name="accion[]"]').value || "";
      const responsable = row.querySelector('input[name="responsable[]"]').value || "";
      const prioridad = row.querySelector('select[name="prioridad[]"]').value || "";
      const fechaAccion = row.querySelector('input[name="fechaAccion[]"]').value || "";
      addLine(` ${idx + 1}. Acción: ${accion} | Responsable: ${responsable} | Prioridad: ${prioridad} | Fecha: ${fechaAccion}`);
    });

    addLine(`Firma Inspector: ${data.get("firmaInspector") || ""}`);
    addLine(`Firma Supervisor: ${data.get("firmaSupervisor") || ""}`);

    if (photoFiles.length) {
      if (y < margin + 20) { doc.addPage(); y = margin; }
      y += 6;
      doc.setFont("helvetica","bold");
      doc.text("Fotografías:", margin, y);
      y += 12;
      doc.setFont("helvetica","normal");

      for (const file of photoFiles) {
        const dataUrl = await fileToDataURL(file);
        const imgProps = doc.getImageProperties(dataUrl);
        const maxW = pageW - margin*2;
        const maxH = 260;
        const { w, h } = scaleToFit(imgProps.width, imgProps.height, maxW, maxH);
        if (y + h > pageH - margin) { doc.addPage(); y = margin; }
        doc.addImage(dataUrl, "JPEG", margin, y, w, h);
        y += h + 12;
      }
    }

    doc.save("hoja_inspeccion.pdf");
  });

  // Utilidades
  function fileToDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsDataURL(file); }); }
  function scaleToFit(origW, origH, maxW, maxH) { const ratio = Math.min(maxW / origW, maxH / origH); return { w: Math.round(origW * ratio), h: Math.round(origH * ratio) }; }
});
const CACHE = "pozo-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./Asset 1@4x.png",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
));
self.addEventListener("fetch", e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}