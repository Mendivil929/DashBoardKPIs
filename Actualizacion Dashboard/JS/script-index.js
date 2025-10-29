//  -------------------- SELECCION DE OPCIONES EN TOPBAR --------------------

procesarSeleccionActual();  //Nos aseguramos de procesar la seleccion por default

const opcionesMenu = document.querySelectorAll('.topbar-menu .opciones');
function seleccionarOpcion(evento) {
  const opcionSeleccionada = evento.currentTarget; //El <li> que fue clickeado
  opcionesMenu.forEach(opcion => {
    opcion.classList.remove('seleccionado');
  });
  opcionSeleccionada.classList.add('seleccionado');

  procesarSeleccionActual();
  const textoOpcion = opcionSeleccionada.textContent;
  console.log(`Has seleccionado: ${textoOpcion}`);
}

opcionesMenu.forEach(opcion => {
  opcion.addEventListener('click', seleccionarOpcion);
});

//Importamos la funcion que necesitamos del archivo chartsJS.js
import { generarGraficosScrap } from './chartsJS.js';

//Funcion para determinar las fechas de inicio y actuales segun la opcion seleccionada
function procesarSeleccionActual() {
    // Busca el elemento que esta seleccionado o que contiene la clase .seleccionado
    const opcionActiva = document.querySelector('.opciones.seleccionado');

    // Si no se encuentra ninguna opcion seleccionada
    if (!opcionActiva) {
        console.warn("No se encontró ninguna opción seleccionada.");
        return;
    }

    let fechaInicio;
    let identificadorSeleccion;
    const fechaActual = new Date(); // Siempre es la fecha de hoy

    // Usamos .classList.contains() para ver qué opción es
    if (opcionActiva.classList.contains('diario')) {
        console.log("Lógica para: DIARIO");
        // Restamos 5 días hábiles a la fecha actual
        fechaInicio = restarDiasHabiles(new Date(), 5);
        identificadorSeleccion = "DIARIO";
    } else if (opcionActiva.classList.contains('semanal')) {
        console.log("Lógica para: SEMANAL");
        const hoy = new Date();
        const diaDeLaSemana = hoy.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

        // Calculamos cuántos días han pasado desde el Lunes.
        // Si es Domingo (0), han pasado 6 días desde el lunes anterior.
        // Si es Lunes (1), han pasado 0 días.
        // Si es Martes (2), ha pasado 1 día.
        const diasDesdeLunes = (diaDeLaSemana === 0) ? 6 : diaDeLaSemana - 1;
        
        fechaInicio = new Date();
        fechaInicio.setDate(hoy.getDate() - diasDesdeLunes);
        identificadorSeleccion = "SEMANAL";
    } else if (opcionActiva.classList.contains('mensual')) {
        console.log("Lógica para: MENSUAL");
        // Lógica para mensual: fecha de inicio es el primer día del mes actual
        fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        identificadorSeleccion = "MENSUAL";
    } // ... puedes agregar más 'else if' para YTD, TURNO, etc.

    // Para visualizar los resultados
    console.log("Fecha de Inicio:", fechaInicio.toLocaleDateString());
    console.log("Fecha Actual:", fechaActual.toLocaleDateString());
    //Actualizamos graficos segun fecha seleccionada
    generarGraficosScrap(fechaInicio, fechaActual, identificadorSeleccion);
}

/**
 * Resta una cantidad de días hábiles (L-V) a una fecha.
 * @param {Date} fecha - La fecha inicial.
 * @param {number} dias - El número de días hábiles a restar.
 * @returns {Date} La nueva fecha.
 */
function restarDiasHabiles(fecha, dias) {
    const fechaCopia = new Date(fecha);
    let diasRestados = 0;

    while (diasRestados < dias) {
        fechaCopia.setDate(fechaCopia.getDate() - 1); // Retrocedemos un día
        const diaSemana = fechaCopia.getDay();
        // Si no es Domingo (0) ni Sábado (6), contamos como día hábil
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasRestados++;
        }
    }
    return fechaCopia;
}

//  -------------------- TABLA PRODUCTIVIDAD --------------------

const tablaMini = document.getElementById("tabla-mini");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");

// abrir modal al hacer click en tabla
tablaMini.addEventListener("click", () => {
  modal.style.display = "flex";
});

// cerrar modal al hacer click en (x)
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// cerrar modal con tecla ESC
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    modal.style.display = "none";
  }
});

// cerrar modal si se hace click fuera del contenido
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

//  -------------------- EVENTOS PARA EXPANSION DE DASHBOARD --------------------
const openBtn = document.getElementById("openDashboardBtn");
const closeBtnDashboard = document.getElementById("closeDashboardBtn");
const modalDashboard = document.getElementById("dashboardModal");
const dashboardContent = document.getElementById("dashboardContent");
const dashboardContainer = document.getElementById("dashboard-container"); // Original parent
const dashboardCloneContainer = document.getElementById("dashboardClone"); //Target in modal

const openDashboardModal = () => {
  // Move the actual dashboard content into the modal
  dashboardCloneContainer.appendChild(dashboardContent);
  modalDashboard.style.display = "flex";

  // IMPORTANT: Tell Chart.js to resize all charts to fit the new container size
  // We loop through all active chart instances and call the resize() method.
  Object.values(Chart.instances).forEach(chart => {
    chart.resize();
  });
};

const closeDashboardModal = () => {
  // Move the dashboard content back to its original container
  dashboardContainer.appendChild(dashboardContent);
  modalDashboard.style.display = "none";

  // IMPORTANT: Resize the charts again to fit the original layout
  Object.values(Chart.instances).forEach(chart => {
    chart.resize();
  });
};

// abrir modal al click
openBtn.addEventListener("click", openDashboardModal);
/*openBtn.addEventListener("click", () => {
  dashboardClone.innerHTML = ""; // limpiar
  const clone = dashboardContent.cloneNode(true); // clonar dashboard
  dashboardClone.appendChild(clone);
  modalDashboard.style.display = "flex";
});*/

// Cerrar modal con X
closeBtnDashboard.addEventListener("click", closeDashboardModal);
/*closeBtnDashboard.addEventListener("click", () => {
  modalDashboard.style.display = "none";
  dashboardClone.innerHTML = "";
});*/

// cerrar modal clic afuera
window.addEventListener("click", (e) => {
  if (e.target === modalDashboard) {
    closeDashboardModal();
  }
});


// cerrar modal con ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalDashboard.style.display === "flex") {
    modalDashboard.style.display = "none";
    closeDashboardModal();
  }
});


