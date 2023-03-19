const fs = require('fs');
const https = require('https');

const init = () => {
    const file = fs.createWriteStream("automobile.csv");
    const request = https.get("https://files.admin.ch/astra_ffr/mofis/Datenlieferungs-Kunden/opendata/2000-Typengenehmigungen_TG_TARGA/2200-Basisdaten_TG_ab_1995/TG-Automobil.txt", function(response) {
        response.pipe(file);
    
        // after download completed close filestream
        file.on("finish", () => {
            file.close();
            console.log("Download Completed");
        });
    });
}

init();