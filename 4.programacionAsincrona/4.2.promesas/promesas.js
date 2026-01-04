const lanzarMoneda = new Promise((resolve, reject) => {
    const exito = Math.random() > 0.5; 

    if (exito) {
        resolve("¡Ganaste! Salió cara."); 
    } else {
        reject("¡Perdiste! Salió cruz.");
    }
});

lanzarMoneda
    .then((mensaje) => console.log("ÉXITO:", mensaje))
    .catch((error) => console.log("ERROR:", error));