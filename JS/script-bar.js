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
