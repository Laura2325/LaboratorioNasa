// Función para cargar la foto del día según la fecha seleccionada 
function cargarFotoDelDia(fecha) {
  var apiUrl = "https://api.nasa.gov/planetary/apod?api_key=s55iQDbXmhVFF393OUf6XshR1vsWMuVi8uliJfKE&date=" + fecha;

  fetch(apiUrl)
    .then(function(respuesta) {
      return respuesta.json();
    })
    .then(function(data) {
      var container = document.getElementById('apod-content');
      var html = "<h2>" + data.title + "</h2>";

      if (data.media_type === "image") {
        html += '<img src="' + data.url + '" alt="' + data.title + '" class="img-fluid rounded mb-3"/>';
      } else if (data.media_type === "video") {
        html += '<div class="ratio ratio-16x9 mb-3"><iframe src="' + data.url + '" frameborder="0" allowfullscreen></iframe></div>';
      }

      html += "<p>" + data.explanation + "</p>";
      container.innerHTML = html;
    })
    .catch(function(error) {
      console.error("Error al cargar la foto del día:", error);
      document.getElementById('apod-content').innerHTML = "<p>No se pudo cargar la Foto del Día.</p>";
    });
}

// Evento para manejar el cambio de fecha
var datePicker = document.getElementById('apod-date');
datePicker.addEventListener('change', function() {
  var fechaSeleccionada = this.value;
  cargarFotoDelDia(fechaSeleccionada);
});

// Cargar la foto del día actual al iniciar
var hoy = new Date().toISOString().split('T')[0];
cargarFotoDelDia(hoy);
