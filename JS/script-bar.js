const body = document.querySelector("body"),
      sidebar = body.querySelector(".sidebar"),
      toggle = body.querySelector(".toggle"),
      // searchBtn = body.querySelector(".search-box"),
      modeSwitch = body.querySelector(".toggle-switch"),
      modeText = body.querySelector(".mode-text"),
      userIcon = body.querySelector('.user-icon'),
      menu = body.querySelector('.dropdown-menu');

      toggle.addEventListener('click', () =>{
        sidebar.classList.toggle("close");
      });

      modeSwitch.addEventListener('click', () =>{
        body.classList.toggle("dark");

        // Actualiza los colores de los charts al cambiar el modo
        actualizarColoresCharts(body.classList.contains('dark'));

        if(body.classList.contains("dark")){
          modeText.innerText = "Light Mode"
        }
        else{
          modeText.innerText = "Dark Mode"
        }
      });

      userIcon.addEventListener('click', (e) => {
        e.stopPropagation(); //Evita que el click se propague al documento
        menu.classList.toggle('open-menu');
      });

      //Deshace el despliegue del menu del perfil al hacer click en cualquier otro lugar
      document.addEventListener('click', (e) => {
        if(!menu.contains(e.target) && !userIcon.contains(e.target)){
          menu.classList.remove('open-menu');
        }
      });

/**
 * Actualiza los colores de TODOS los charts de Chart.js (existentes y futuros)
 * para que coincidan con el modo oscuro o claro.
 * @param {boolean} modoOscuro - true si está en modo oscuro, false si está en claro.
 */
function actualizarColoresCharts(modoOscuro) {
    // Definimos nuestros colores (basados en tu CSS)
    const colorTexto = modoOscuro ? '#CCC' : '#535353ff';
    const colorGrid = modoOscuro ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // 1. ESTABLECEMOS LOS NUEVOS DEFAULTS GLOBALES
    // Esto afectará a cualquier gráfico NUEVO que se cree
    Chart.defaults.color = colorTexto;
    Chart.defaults.borderColor = colorGrid;
    Chart.defaults.plugins.legend.labels.color = colorTexto;
    Chart.defaults.plugins.datalabels.color = colorTexto;

    
    // 2. ACTUALIZAMOS LOS GRÁFICOS QUE YA EXISTEN
    // Iteramos sobre todas las instancias de gráficos que están corriendo
    for (const id in Chart.instances) {
        const chart = Chart.instances[id];

        // Actualizamos las opciones de CADA gráfico
        chart.options.color = colorTexto;
        
        // Actualizamos ejes (scales) si existen
        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(scale => {
                scale.ticks.color = colorTexto; // Color de los números/labels del eje
                scale.grid.color = colorGrid;   // Color de las líneas de la cuadrícula
                scale.borderColor = colorGrid;  // Color de la línea del eje
            });
        }
        
        // Actualizamos sus plugins
        if (chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = colorTexto;
        }
        if (chart.options.plugins.datalabels) {
            // Esto solo funciona si no tienes 'color' hard-codeado (ver Paso 4)
            chart.options.plugins.datalabels.color = colorTexto;
        }

        // Le decimos al gráfico que se redibuje con las nuevas opciones
        chart.update('none'); // 'none' evita que haga una animación de cambio
    }
}
