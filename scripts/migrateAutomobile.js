const pool = require("../database");
const csv = require("csv");
const fs = require("fs");

const init = async () => {

    try {
        var readStream = fs.createReadStream("automobile.csv"); // readStream is a read-only stream wit raw text content of the CSV file
        //var writeStream = fs.createWriteStream("output.csv"); // writeStream is a write-only stream to write on the disk
        var csvStream = csv.parse({ delimiter: "\t", /*columns: true,relax_quotes: true,*/ from_line: 2, skipRecordsWithError: true/*, to_line: 15*/}); // csv Stream is a read and write stream : it reads raw text in CSV and output untransformed records
        

        await deleteAllPreviuosRecords();

        csvStream.on("data", function(row) {
            let obj = {
                typeCertification: row[0],
                brand: row[10],
                model: row[11],
                vin: row[13],
            };

            if(row[13] && row[13].length > 0){
                //let query = `INSERT INTO automobile(vin,typecert, brand, model) VALUES ($1, $2, $3 , $4)`;
                //pool.query(query,[obj.vin, obj.typeCertification, obj.brand, obj.model]);
                insertRecord(obj);
            }
        
            //data.name = 'somename';
            //writeStream.write(JSON.stringify(data)+'/n');
        })
        .on("end", function(){
            //console.log("done");
        })
        .on("error", function(error){
            //console.log(error)
        });
        
        readStream.pipe(csvStream);
    } catch (error) {
        console.log({error});
    }
}

const insertRecord = async (obj) => {
    try {
        let query = `INSERT INTO automobile(vin,typecert, brand, model) VALUES ($1, $2, $3 , $4)`;
        pool.query(query,[obj.vin, obj.typeCertification, obj.brand, obj.model]);
    } catch (error) {
        console.log({error});
    }
}


const deleteAllPreviuosRecords = async (obj) => {
    try {
        let query = `DELETE FROM automobile WHERE id > 0`;
        await pool.query(query,[]);

        return true;
    } catch (error) {
        console.log({error});
        return false;
    }
}

init();
