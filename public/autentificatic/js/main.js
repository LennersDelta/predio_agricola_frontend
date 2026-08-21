function checkRut(rut, id_button) {
    // Despejar Puntos
    var valor = rut.value.replace('.','');
    // Despejar Guión
    valor = valor.replace('-','');
    
    // Aislar Cuerpo y Dígito Verificador
    cuerpo = valor.slice(0,-1);
    dv = valor.slice(-1).toUpperCase();
    
    // Formatear RUN
    rut.value = cuerpo + ''+ dv
    
    // Si no cumple con el mínimo ej. (n.nnn.nnn)
    if(cuerpo.length < 7) {
        rut.setCustomValidity("RUT Incompleto");
        var id_element = document.getElementById(id_button);
        id_element.classList.add("input-style-invalid");        
        var rut_error = document.getElementById("rut_error");
        rut_error.innerHTML = "RUT Incompleto";        
        return false;
    }
    
    // Calcular Dígito Verificador
    suma = 0;
    multiplo = 2;
    
    // Para cada dígito del Cuerpo
    for(i=1;i<=cuerpo.length;i++) {
    
        // Obtener su Producto con el Múltiplo Correspondiente
        index = multiplo * valor.charAt(cuerpo.length - i);
        
        // Sumar al Contador General
        suma = suma + index;
        
        // Consolidar Múltiplo dentro del rango [2,7]
        if(multiplo < 7) { multiplo = multiplo + 1; } else { multiplo = 2; }

    }
    
    // Calcular Dígito Verificador en base al Módulo 11
    dvEsperado = 11 - (suma % 11);
    
    // Casos Especiales (0 y K)
    dv = (dv == 'K')?10:dv;
    dv = (dv == 0)?11:dv;
    
    // Validar que el Cuerpo coincide con su Dígito Verificador
    if(dvEsperado != dv) { 
        rut.setCustomValidity("RUT no válido");
        var id_element = document.getElementById(id_button);
        id_element.classList.add("input-style-invalid");        
        var rut_error = document.getElementById("rut_error");
        rut_error.innerHTML = "RUT no válido";
        return false;
    }
 
    // Si todo sale bien, eliminar errores (decretar que es válido)
    var id_element = document.getElementById(id_button);
    id_element.classList.remove('input-style-invalid');
    rut.setCustomValidity('');
}


/* Get IE or Edge browser version */
var version = detectIE();


if (version <=  10 && version != false) {
	location.href ="unsupported.html"; 
}

function detectIE() {
  var ua = window.navigator.userAgent;

  var msie = ua.indexOf('MSIE ');
  if (msie > 0) {
    /* IE 10 or older => return version number */
    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }
  var trident = ua.indexOf('Trident/');
  if (trident > 0) {
    /* IE 11 => return version number */
    var rv = ua.indexOf('rv:');
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }
  var edge = ua.indexOf('Edge/');
  if (edge > 0) {
    /* Edge (IE 12+) => return version number */
    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }
  /* other browser */
  return false;
}

