const express = require('express');
const router = express.Router();
const pool = require("../database");
const config = require('../config/config');
const expressJwt = require('express-jwt');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const vehicle_colors = require('../data/colors');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, moment().unix() + '_' + file.originalname);
    }
});
var upload = multer({ storage: storage });

// Endpoints for uploading images
router.route('/uploadImage').post(expressJwt({ secret: config.serverSecretKey }),upload.array("files"), async function (req, res) {
    let retVal = { msg: '', logoUrl: '', imageUrl: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        let files = req.files;
        if(files && files.length > 0 ){
            retVal.imageUrl = 'http://93.115.253.93:5000/uploads/' + files[0].filename;
            retVal.msg = 'OK';
        }else {
            retVal.msg = 'Error';
        }

        res.status(200).json(retVal);
        return;

    }catch(err){
        console.log({err});
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});

router.route('/uploadImages').post(expressJwt({ secret: config.serverSecretKey }),upload.array("files"), async function (req, res) {
    let retVal = { msg: '', imagesUrl: []};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        let files = req.files;

        let imagesArray = [];
        if(files && files.length > 0 ){
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                imagesArray.push('http://93.115.253.83:5000/uploads/' + file.filename);
            }
            retVal.imagesUrl = imagesArray;
            retVal.msg = 'OK';
        }else {
            retVal.msg = 'Error';
        }

        res.status(200).json(retVal);
        return;
    }catch(err){
        retVal.msg = err.message;
        res.status(200).json(retVal);
        return;
    }
});

// Endpoint for creating a new vehicle by account

router.route('/createVehicle').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response JSON parameters
    let retVal = {msg : '', hasRegistered : false, vehicleId: undefined};
    // Try-Catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        
        const {
            brandId, modelId, vin, fuelTypeId, colorId,
            typeCertification, internalNumber,
            batteryStatus, service, mfk, mfkPrice, breaksFront, breaksRear, engineOilLeak, 
            engineOilLeakPrice, transOilLeak, controlLight, transType, drivable,
            axelLoader1, axelLoader2, note,
            millage, smallPrice, bigPrice, priceBreaksFront, priceBreaksRear, 
            priceTransOilLeak, priceControlLight, interior, vehiclePhotos, damages,
            summer_tire, winter_tire, allseason_tire, tags, costs, service_price, isNew
        } = req.body;

        let small = req.body.small ? "true" : null;
        let big = req.body.big ? "true" : null;
        let type = isNew ? "new" : "used";
        let marketDate = moment().unix();


        if (vin && vin.length === 17) {

            const summer_tire_id = await createTire(summer_tire,req.user.accountid);
            const winter_tire_id = await createTire(winter_tire,req.user.accountid);
            const allseason_tire_id = await createTire(allseason_tire,req.user.accountid);
            const tags_value = tags?.length > 0 ? tags.join() : "";

            const vehicleQuery = `INSERT INTO coll_vehicle (
                accountid, brandid, modelid, vin, fueltypeid, 
                colorid, type_certification, internal_number, 
                market_date, battery, service, mfk, mfk_price, breaks_front, breaks_rear, engine_oil_leak, 
                engine_oil_leak_price, trans_oil_leak, control_light, trans_type, drivable,
                axel_loader1, axel_loader2, note, 
                millage, small, small_price, big, big_price, price_breaks_front, price_breaks_rear, 
                price_trans_oil_leak, price_control_light, interior, summer_tire_id, winter_tire_id, allseason_tire_id, tags, service_price,type) 
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, 
                $8, $9, $10, $11, $12, $13, 
                $14, $15, $16, $17, $18, $19, 
                $20, $21, $22, $23, $24, $25, 
                $26, $27, $28, $29, $30, $31, 
                $32, $33, $34, $35, $36, $37, $38, $39, $40
                )  
            RETURNING id`;

            const params = [
                req.user.accountid, brandId, modelId, vin, fuelTypeId, colorId, typeCertification, 
                internalNumber, marketDate, batteryStatus, service, mfk, mfkPrice, breaksFront, breaksRear, 
                engineOilLeak, engineOilLeakPrice, transOilLeak, controlLight, transType, drivable,
                axelLoader1, axelLoader2, note, millage, small, smallPrice, big, 
                bigPrice, priceBreaksFront, priceBreaksRear, priceTransOilLeak, priceControlLight, interior,
                summer_tire_id, winter_tire_id, allseason_tire_id, tags_value, service_price, type
            ];
            const vehicleResponse = await pool.query(vehicleQuery, params);

            let vehicleRows = vehicleResponse.rows;
            if (vehicleRows.length > 0) {
                const vehicleId = vehicleRows[0].id;

                if(vehiclePhotos){
                    //insert photos
                    for (let i = 0; i < vehiclePhotos.length; i++) {
                        const pictureQuery = 'INSERT INTO coll_vehicle_photos (accountid, vehicleid, url) VALUES ($1, $2, $3)';
                        await pool.query(pictureQuery, [req.user.accountid, vehicleId, vehiclePhotos[i]]);
                    }
                }

                if(costs){
                    //insert damages
                    for (let i = 0; i < costs.length; i++) {
                        let { name, price } = costs[i];
                        const costQuery = `INSERT INTO coll_vehicle_cost (accountid, vehicleid, name, price) VALUES ($1, $2, $3, $4)`;
                        
                        await pool.query(costQuery, [req.user.accountid, vehicleId, name, price]);
                    }
                }
                
                if(damages){
                    //insert damages
                    for (let i = 0; i < damages.length; i++) {
                        let { damageName, damageDescription, damagePrice, damagePhotoUrl } = damages[i];
                        const damageQuery = `INSERT INTO coll_vehicle_damage (accountid, vehicleid, name, description, price, imageurl) VALUES ($1, $2, $3, $4, $5, $6)`;
                        
                        await pool.query(damageQuery, [req.user.accountid, vehicleId, damageName, damageDescription, damagePrice, damagePhotoUrl]);
                    }
                }
                
                retVal.hasRegistered = true;
                retVal.vehicleId = vehicleId;
                retVal.msg = 'OK';
            }
            else {
                retVal.hasRegistered = false;
                retVal.msg = "Cannot insert vehicle.";
            }
        }
        else {
            retVal.msg = 'Vin number must be 17 characters long.'
            retVal.hasRegistered = false;
        }
        res.status(200).json(retVal);
        return;
    }
    // On an exception
    catch (err ){
        retVal.hasRegistered = false;
        retVal.msg = err.message;
        console.log({createVehicleError : err});
        res.status(400).json(retVal);
        return;
    }
});

const createTire = async (data, accountid) => {
    try {
        if(!data) 
            return null;

        const { same_front_rear, front_tirebrandid, rear_tirebrandid, front_dimention, rear_dimention, rimid, profil_front, profil_rear } = data;
        let [front_dimentionid, rear_dimentionid] = [undefined,undefined];

        if(same_front_rear){
            const dimentionId = await createDimention(front_dimention,accountid);
            front_dimentionid = dimentionId;
            rear_dimentionid = dimentionId;
        }else {
            front_dimentionid = await createDimention(front_dimention,accountid);
            rear_dimentionid = await createDimention(rear_dimention,accountid);
        }

        
        const query = 'INSERT INTO coll_tire (accountid, front_tirebrandid, rear_tirebrandid, front_dimentionid, rear_dimentionid, rimid, profil_front, profil_rear) VALUES ($1, $2, $3,$4, $5, $6, $7,$8) RETURNING id';
        const { rows } = await pool.query(query, [accountid, front_tirebrandid, rear_tirebrandid, front_dimentionid, rear_dimentionid, rimid, profil_front, profil_rear]);

        return rows.length > 0 ? rows[0].id : null;
    } catch (error) {
        console.log({ createTire: error });
        throw error;
    }
}

const createDimention = async (data, accountid) => {
    try {
        const { width, height, design, size, load_index, speed_index } = data;

        const query = 'INSERT INTO coll_tire_dimention (width, height, design, tire_size, load_index, speed_index,accountid) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
        const { rows } = await pool.query(query, [width, height, design, size, load_index, speed_index, accountid]);
        return rows.length > 0 ? rows[0].id : null;
    } catch (error) {
        console.log({error});
        throw error;
    }
}

const updateTire = async (data, accountid) => {
    try {
        if(!data || !data.id) return true;

        const { id, same_front_rear, front_tirebrandid, rear_tirebrandid, front_dimention, rear_dimention, rimid, profil_front, profil_rear } = data;
        
        let [front_dimentionid, rear_dimentionid] = [undefined,undefined];
        if(same_front_rear){
            const dimentionId = await createDimention(front_dimention,accountid);
            front_dimentionid = dimentionId;
            rear_dimentionid = dimentionId;
        }else {
            front_dimentionid = await createDimention(front_dimention,accountid);
            rear_dimentionid = await createDimention(rear_dimention,accountid);
        }
        const query = 'UPDATE coll_tire SET front_tirebrandid=$1, rear_tirebrandid=$2, front_dimentionid=$3, rear_dimentionid=$4, rimid=$5, profil_front=$6, profil_rear=$7, id=$8';
        await pool.query(query, [front_tirebrandid, rear_tirebrandid, front_dimentionid, rear_dimentionid, rimid, profil_front, profil_rear, id]);

        const dimensionFrontDeleted = await deleteDimension(front_dimention.id, accountid);
        const dimensionRearDeleted = await deleteDimension(rear_dimention.id, accountid);
        if(!dimensionFrontDeleted || !dimensionRearDeleted){
            console.log("NOT DELETED");
        }
        return true;
    } catch (error) {
        console.log({error});
        throw error;
    }
}

const deleteAllTires = async (vehiclId, accountid, summer_tire, winter_tire, allseason_tire) => {
    try {
        const query = 'UPDATE coll_vehicle SET summer_tire_id=NULL, winter_tire_id=NULL, allseason_tire_id=NULL WHERE id=$1 AND accountid=$2';
        await pool.query(query, [vehiclId,accountid]);

        const del1 = await deleteTire(summer_tire,accountid);
        const del2 = await deleteTire(winter_tire,accountid);
        const del3 = await deleteTire(allseason_tire,accountid);

        console.log({
            del1, del2, del3
        });
        return true;
    } catch (error) {
        console.log({deleteAllTires: error});
        throw error;
    }
}

const deleteTire = async (data, accountid) => {
    try {
        if(!data || !data.id) return true;

        const { front_dimentionid, rear_dimentionid, id } = data;

        const query = 'DELETE FROM coll_tire WHERE id=$1';
        await pool.query(query, [id]);

        const dimensionFrontDeleted = await deleteDimension(front_dimentionid,accountid);
        const dimensionRearDeleted = await deleteDimension(rear_dimentionid,accountid);

        console.log({
            dimensionFrontDeleted,
            dimensionRearDeleted,
        });
        return true;
    } catch (error) {
        console.log({deleteTire: error});
        throw error;
    }
}


const deleteDimension = async (id, accountid) => {
    try {
        if(!id) return true;

        const query = 'DELETE FROM coll_tire_dimention WHERE id=$1 AND accountid=$2';
        await pool.query(query, [id,accountid]);
        return true;
    } catch (error) {
        console.log({deleteDimension: error});
        return false;
        throw error;
    }
}



/*router.route('/createVehicle').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response JSON parameters
    let retVal = {msg : '', hasRegistered : false, vehicleId: undefined};
    // Try-Catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        
        const {
            brandId, modelId, vin, fuelTypeId, summerTireBrandId, winterTireBrandId, colorId,
            summerDimentionId, winterDimentionId, typeCertification, internalNumber, marketDate, 
            batteryStatus, service, mfk, mfkPrice, breaksFront, breaksRear, engineOilLeak, 
            engineOilLeakPrice, transOilLeak, controlLight, transType, drivable, tireType, 
            sameFrontRear, summerRims, winterRims, summerProfilFront, summerProfilRear, 
            winterProfilFront, winterProfilRear, axelLoader1, axelLoader2, note, damagePart, 
            millage, small, smallPrice, big, bigPrice, priceBreaksFront, priceBreaksRear, 
            priceTransOilLeak, priceControlLight, interior, rimDiametarSummerFront, 
            rimDiametarSummerRear, loadIndexSummerFront, loadIndexSummerRear, 
            speedInbdexSummerFront, speedIndexSummerRear, rimDiametarWinterFront, 
            rimDiametarWinterRear, loadIndexWinterFront, loadIndexWinterRear, speedIndexWinterFront,
            speedIndexWinterRear, allSeasonDimentionId, allSeasonRims, allSeasonProfilFront, 
            allSeasonProfileRear, rimDiametarAllSeasonFront, rimDiametarAllSeasonRear, 
            loadIndexAllSeasonFront, loadIndexAllSeasonRear, speedIndexAllSeasonFront, 
            speedIndexAllSeasonRear, vehiclePhotos, damages
        } = req.body;       
        
        


        if (vin && vin.length === 17) {
            const vehicleQuery = `INSERT INTO coll_vehicle (
                accountid, brandid, modelid, vin, fueltypeid, summer_tirebrandid, winter_tirebrandid, 
                colorid, summer_dimentionid, winter_dimentionid, type_certification, internal_number, 
                market_date, battery, service, mfk, mfk_price, breaks_front, breaks_rear, engine_oil_leak, 
                engine_oil_leak_price, trans_oil_leak, control_light, trans_type, drivable, tire_type, 
                same_front_rear, summer_rims, winter_rims, summer_profil_front, summer_profil_rear, 
                winter_profil_front, winter_profil_rear, axel_loader1, axel_loader2, note, damage_part, 
                millage, small, small_price, big, big_price, price_breaks_front, price_breaks_rear, 
                price_trans_oil_leak, price_control_light, interior, rim_diametar_summer_front, 
                rim_diametar_summer_rear, load_index_summer_front, load_index_summer_rear, 
                speed_index_summer_front, speed_index_summer_rear, rim_diametar_winter_front, 
                rim_diametar_winter_rear, load_index_winter_front, load_index_winter_rear, 
                speed_index_winter_front, speed_index_winter_rear, allseason_dimentionid, 
                allseason_rims, allseason_profil_front, allseason_profil_rear, rim_diametar_allseason_front, 
                rim_diametar_allseason_rear, load_index_allseason_front, load_index_allseason_rear, 
                speed_index_allseason_front, speed_index_allseason_rear) 
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, 
                $8, $9, $10, $11, $12, $13, 
                $14, $15, $16, $17, $18, $19, 
                $20, $21, $22, $23, $24, $25, 
                $26, $27, $28, $29, $30, $31, 
                $32, $33, $34, $35, $36, $37, 
                $38, $39, $40, $41, $42, $43, 
                $44, $45, $46, $47, $48, $49, 
                $50, $51, $52, $53, $54, $55, 
                $56, $57, $58, $59, $60, $61, 
                $62, $63, $64, $65, $66, $67, 
                $68, $69)  
            RETURNING id`;

            const vehicleResponse = await pool.query(vehicleQuery, [
                req.user.accountid, brandId, modelId, vinNumber, fuelTypeId, summerTireBrandId, 
                winterTireBrandId, colorId, summerDimentionId, winterDimentionId, typeCertification, 
                internalNumber, marketDate, batteryStatus, service, mfk, mfkPrice, breaksFront, breaksRear, 
                engineOilLeak, engineOilLeakPrice, transOilLeak, controlLight, transType, drivable, tireType, 
                sameFrontRear, summerRims, winterRims, summerProfilFront, summerProfilRear, winterProfilFront, 
                winterProfilRear, axelLoader1, axelLoader2, note, damagePart, millage, small, smallPrice, big, 
                bigPrice, priceBreaksFront, priceBreaksRear, priceTransOilLeak, priceControlLight, interior, 
                rimDiametarSummerFront, rimDiametarSummerRear, loadIndexSummerFront, loadIndexSummerRear, 
                speedInbdexSummerFront, speedIndexSummerRear, rimDiametarWinterFront, rimDiametarWinterRear, 
                loadIndexWinterFront, loadIndexWinterRear, speedIndexWinterFront, speedIndexWinterRear, 
                allSeasonDimentionId, allSeasonRims, allSeasonProfilFront, allSeasonProfileRear, 
                rimDiametarAllSeasonFront, rimDiametarAllSeasonRear, loadIndexAllSeasonFront, loadIndexAllSeasonRear,
                speedIndexAllSeasonFront, speedIndexAllSeasonRear
            ]);

            let vehicleRows = vehicleResponse.rows;
            if (vehicleRows.length > 0) {
                const vehicleId = vehicleRows[0].id;

                if(vehiclePhotos){
                    //insert photos
                    for (let i = 0; i < vehiclePhotos.length; i++) {
                        const pictureQuery = 'INSERT INTO coll_vehicle_photos (accountid, vehicleid, url) VALUES ($1, $2, $3)';
                        await pool.query(pictureQuery, [req.user.accountid, vehicleId, vehiclePhotos[i]]);
                    }
                }
                
                if(damages){
                    //insert damages
                    for (let i = 0; i < damages.length; i++) {
                        let { damageName, damageDescription, damagePrice, damagePhotoUrl } = damages[i];
                        const damageQuery = `INSERT INTO coll_vehicle_damage (accountid, vehicleid, name, description, price, imageurl) VALUES ($1, $2, $3, $4, $5, $6)`;
                        await pool.query(damageQuery, [req.user.accountid, vehicleId, damageName, damageDescription, damagePrice, damagePhotoUrl]);
                    }
                }
                
                retVal.hasRegistered = true;
                retVal.vehicleId = vehicleId;
                retVal.msg = 'OK';
            }
            else {
                retVal.hasRegistered = false;
                retVal.msg = "Cannot insert vehicle.";
            }
        }
        else {
            retVal.msg = 'Vin number must be 17 characters long.'
            retVal.hasRegistered = false;
        }
        res.status(200).json(retVal);
        return;
    }
    // On an exception
    catch (err ){
        retVal.hasRegistered = false;
        retVal.msg = err.message;
        console.log({createVehicleError : err});
        res.status(400).json(retVal);
        return;
    }
});*/


// Endpoint to get all vehicles per account

router.route('/getVehicleListByAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', vehicles: null };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }


        const { vin, brandId, modelId, colorId } = req.body;

        //fetch data 
        let queryVehicle = `SELECT v.*,
            st.front_tirebrandid as st_front_tirebrandid, st.rear_tirebrandid as st_rear_tirebrandid, st.front_tirebrandid as st_front_tirebrandid, st.rimid, st.profil_front as st_profil_front, st.profil_rear as st_profil_rear, st.front_dimentionid as st_front_dimentionid, st.rear_dimentionid as st_rear_dimentionid,
            stfd.width as stfd_width, stfd.height as stfd_height, stfd.design as stfd_design, stfd.load_index as stfd_load_index, stfd.tire_size as stfd_tire_size, stfd.speed_index as stfd_speed_index,
            strd.width as strd_width, strd.height as strd_height, strd.design as strd_design, strd.load_index as strd_load_index,strd.tire_size as strd_tire_size, strd.speed_index as strd_speed_index,
            strim.id as st_rim_id, strim.name as st_rim_name, 
            stfb.name as stf_brand_name, 
            strb.name as str_brand_name,

            wt.front_tirebrandid as wt_front_tirebrandid, wt.rear_tirebrandid as wt_rear_tirebrandid, wt.front_tirebrandid as wt_front_tirebrandid, wt.rimid, wt.profil_front as wt_profil_front, wt.profil_rear as wt_profil_rear, wt.front_dimentionid as wt_front_dimentionid, wt.rear_dimentionid as wt_rear_dimentionid,
            wtfd.width as wtfd_width, wtfd.height as wtfd_height, wtfd.design as wtfd_design, wtfd.load_index as wtfd_load_index,wtfd.tire_size as wtfd_tire_size, wtfd.speed_index as wtfd_speed_index,
            wtrd.width as wtrd_width, wtrd.height as wtrd_height, wtrd.design as wtrd_design, wtrd.load_index as wtrd_load_index,  wtrd.tire_size as wtrd_tire_size, wtrd.speed_index as wtrd_speed_index,
            wtrim.id as wt_rim_id, wtrim.name as wt_rim_name, 
            wtfb.name as wtf_brand_name, 
            wtrb.name as wtr_brand_name,

            at.front_tirebrandid as at_front_tirebrandid, at.rear_tirebrandid as at_rear_tirebrandid, at.front_tirebrandid as at_front_tirebrandid, at.rimid, at.profil_front as at_profil_front, at.profil_rear as at_profil_rear, at.front_dimentionid as at_front_dimentionid, at.rear_dimentionid as at_rear_dimentionid,
            atfd.width as atfd_width, atfd.height as atfd_height, atfd.design as atfd_design, atfd.load_index as atfd_load_index, atfd.tire_size as atfd_tire_size,  atfd.speed_index as atfd_speed_index,
            atrd.width as atrd_width, atrd.height as atrd_height, atrd.design as atrd_design, atrd.load_index as atrd_load_index,atrd.tire_size as atrd_tire_size, atrd.speed_index as atrd_speed_index,
            atrim.id as at_rim_id, atrim.name as at_rim_name,
            atfb.name as atf_brand_name, 
            atrb.name as atr_brand_name
        FROM coll_vehicle v
            LEFT OUTER JOIN coll_tire st ON st.id = v.summer_tire_id
            LEFT OUTER JOIN coll_tire_dimention stfd ON stfd.id = st.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention strd ON strd.id = st.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim strim ON strim.id = st.rimid
            LEFT OUTER JOIN coll_brands stfb ON stfb.id = st.front_tirebrandid
            LEFT OUTER JOIN coll_brands strb ON strb.id = st.rear_tirebrandid

            LEFT OUTER JOIN coll_tire wt ON wt.id = v.winter_tire_id
            LEFT OUTER JOIN coll_tire_dimention wtfd ON wtfd.id = wt.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention wtrd ON wtrd.id = wt.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim wtrim ON wtrim.id = wt.rimid
            LEFT OUTER JOIN coll_brands wtfb ON wtfb.id = wt.front_tirebrandid
            LEFT OUTER JOIN coll_brands wtrb ON wtrb.id = wt.rear_tirebrandid

            LEFT OUTER JOIN coll_tire at ON at.id = v.allseason_tire_id
            LEFT OUTER JOIN coll_tire_dimention atfd ON atfd.id = at.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention atrd ON atrd.id = at.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim atrim ON atrim.id = at.rimid
            LEFT OUTER JOIN coll_brands atfb ON atfb.id = at.front_tirebrandid
            LEFT OUTER JOIN coll_brands atrb ON atrb.id = at.rear_tirebrandid
        WHERE v.accountid=$1 AND (type='new' OR type ='used' OR type ='bid' OR type ='replacement')`; 

        let params = [req.user.accountid];
        if(vin?.length === 17){
            queryVehicle += ` AND v.vin = $${params.length + 1}`;
            params.push(vin);
        }

        if(brandId > 0){
            queryVehicle += ` AND v.brandid = $${params.length + 1}`;
            params.push(brandId);
        }

        if(modelId > 0){
            queryVehicle += ` AND v.modelid = $${params.length + 1}`;
            params.push(modelId);
        }

        if(colorId > 0){
            queryVehicle += ` AND v.colorid = $${params.length + 1}`;
            params.push(colorId);
        }

        queryVehicle += ` ORDER BY v.id DESC`;

        // status=1 means active
        const { rows:vehicles } = await pool.query(queryVehicle,params);
        let vehicles_arr = [];

        for (let i = 0; i < vehicles.length; i++) {
            const vehicle_data = vehicles[i];
            //Photos
            const vehiclePhotosQuery = `SELECT id, url FROM coll_vehicle_photos WHERE vehicleid = $1`;
            const photosPromise = pool.query(vehiclePhotosQuery,[vehicle_data.id]);

            //Damages
            const vehicleDamagesQuery = `SELECT id, name, price, imageurl, description FROM coll_vehicle_damage WHERE vehicleid = $1`;
            const damagesPromise = pool.query(vehicleDamagesQuery,[vehicle_data.id]);

            const vehicleCostsQuery = `SELECT id, name, price FROM coll_vehicle_cost WHERE vehicleid = $1`;
            const costsPromise = pool.query(vehicleCostsQuery,[vehicle_data.id]);

            const {rows:photos} = await photosPromise;
            const {rows:damages} = await damagesPromise;
            const {rows:costs} = await costsPromise;

            let obj = createVehicleObject({ 
                vehicle_data: {
                    ...vehicle_data,
                    market_date: parseInt(vehicle_data.market_date) 
                },
                photos,
                damages: damages.map((damage) => ({
                    id: damage.id,
                    damageName: damage.name,
                    damageDescription: damage.description,
                    damagePrice: damage.price,
                    damagePhotoUrl: damage.imageurl
                })),
                costs
            });

            vehicles_arr.push(obj);
        }

        if (vehicles_arr.length > 0) {
            retVal.msg = 'OK';
            retVal.vehicles = vehicles_arr;
        }
        else {
            retVal.msg = 'No data to fetch.';
        }
        return res.status(200).json(retVal);
    }catch(err){
        console.log({getVehicleListByAccountError: err});
        retVal.msg = err.message;
		return res.status(400).json(retVal);
    }
});

router.route('/getVehicleData').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', vehicle_data: null };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const { vehicleId } = req.body;

        //fetch data 
        let queryVehicle = `SELECT v.*, 
            st.front_tirebrandid as st_front_tirebrandid, st.rear_tirebrandid as st_rear_tirebrandid, st.front_tirebrandid as st_front_tirebrandid, st.rimid, st.profil_front as st_profil_front, st.profil_rear as st_profil_rear,
            stfd.width as stfd_width, stfd.height as stfd_height, stfd.design as stfd_design, stfd.load_index as stfd_load_index, stfd.tire_size as stfd_tire_size, stfd.speed_index as stfd_speed_index,
            strd.width as strd_width, strd.height as strd_height, strd.design as strd_design, strd.load_index as strd_load_index,strd.tire_size as strd_tire_size, strd.speed_index as strd_speed_index,
            strim.id as st_rim_id, strim.name as st_rim_name, 
            stfb.name as stf_brand_name, 
            strb.name as str_brand_name,

            wt.front_tirebrandid as wt_front_tirebrandid, wt.rear_tirebrandid as wt_rear_tirebrandid, wt.front_tirebrandid as wt_front_tirebrandid, wt.rimid, wt.profil_front as wt_profil_front, wt.profil_rear as wt_profil_rear,
            wtfd.width as wtfd_width, wtfd.height as wtfd_height, wtfd.design as wtfd_design, wtfd.load_index as wtfd_load_index,wtfd.tire_size as wtfd_tire_size, wtfd.speed_index as wtfd_speed_index,
            wtrd.width as wtrd_width, wtrd.height as wtrd_height, wtrd.design as wtrd_design, wtrd.load_index as wtrd_load_index,  wtrd.tire_size as wtrd_tire_size, wtrd.speed_index as wtrd_speed_index,
            wtrim.id as wt_rim_id, wtrim.name as wt_rim_name, 
            wtfb.name as wtf_brand_name, 
            wtrb.name as wtr_brand_name,

            at.front_tirebrandid as at_front_tirebrandid, at.rear_tirebrandid as at_rear_tirebrandid, at.front_tirebrandid as at_front_tirebrandid, at.rimid, at.profil_front as at_profil_front, at.profil_rear as at_profil_rear,
            atfd.width as atfd_width, atfd.height as atfd_height, atfd.design as atfd_design, atfd.load_index as atfd_load_index, atfd.tire_size as atfd_tire_size,  atfd.speed_index as atfd_speed_index,
            atrd.width as atrd_width, atrd.height as atrd_height, atrd.design as atrd_design, atrd.load_index as atrd_load_index,atrd.tire_size as atrd_tire_size, atrd.speed_index as atrd_speed_index,
            atrim.id as at_rim_id, atrim.name as at_rim_name,
            atfb.name as atf_brand_name, 
            atrb.name as atr_brand_name
            
        FROM coll_vehicle v
            LEFT OUTER JOIN coll_tire st ON st.id = v.summer_tire_id
            LEFT OUTER JOIN coll_tire_dimention stfd ON stfd.id = st.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention strd ON strd.id = st.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim strim ON strim.id = st.rimid
            LEFT OUTER JOIN coll_tire_brands stfb ON stfb.id = st.front_tirebrandid
            LEFT OUTER JOIN coll_tire_brands strb ON strb.id = st.rear_tirebrandid

            LEFT OUTER JOIN coll_tire wt ON wt.id = v.winter_tire_id
            LEFT OUTER JOIN coll_tire_dimention wtfd ON wtfd.id = wt.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention wtrd ON wtrd.id = wt.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim wtrim ON wtrim.id = wt.rimid
            LEFT OUTER JOIN coll_tire_brands wtfb ON wtfb.id = wt.front_tirebrandid
            LEFT OUTER JOIN coll_tire_brands wtrb ON wtrb.id = wt.rear_tirebrandid

            LEFT OUTER JOIN coll_tire at ON at.id = v.allseason_tire_id
            LEFT OUTER JOIN coll_tire_dimention atfd ON atfd.id = at.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention atrd ON atrd.id = at.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim atrim ON atrim.id = at.rimid
            LEFT OUTER JOIN coll_tire_brands atfb ON atfb.id = at.front_tirebrandid
            LEFT OUTER JOIN coll_tire_brands atrb ON atrb.id = at.rear_tirebrandid
        WHERE v.id=$1`; 

        // status=1 means active
        const { rows:vehicles } = await pool.query(queryVehicle,[vehicleId]);
        if(!(vehicles?.length > 0 )){
            return res.status(200).json(retVal);
        }

        const vehiclePhotosQuery = `SELECT id, url FROM coll_vehicle_photos WHERE vehicleid = $1`;
        const photosPromise = pool.query(vehiclePhotosQuery,[vehicles[0].id]);

        //Damages
        const vehicleDamagesQuery = `SELECT id, name, price, imageurl, description FROM coll_vehicle_damage WHERE vehicleid = $1`;
        const damagesPromise = pool.query(vehicleDamagesQuery,[vehicles[0].id]);

        const vehicleCostsQuery = `SELECT id, name, price FROM coll_vehicle_cost WHERE vehicleid = $1`;
        const costsPromise = pool.query(vehicleCostsQuery,[vehicles[0].id]);

        const { rows:photos } = await photosPromise;
        const { rows:damages } = await damagesPromise;
        const { rows:costs } = await costsPromise;

        const vehicle_data = createVehicleObject({ 
            vehicle_data: {
                ...vehicles[0],
                market_date: parseInt(vehicles[0].market_date)
            },
            photos,
            damages: damages.map((damage) => ({
                id: damage.id,
                damageName: damage.name,
                damageDescription: damage.description,
                damagePrice: damage.price,
                damagePhotoUrl: damage.imageurl
            })),
            costs
        });

        retVal.msg = 'OK';
        retVal.vehicle_data = vehicle_data;
        
        return res.status(200).json(retVal);
    }catch(err){
        console.log({getVehicleDataError: err});
        retVal.msg = err.message;
		return res.status(400).json(retVal);
    }
});

const createVehicleObject = ({ vehicle_data, photos, damages, costs}) => {

    const tags = vehicle_data?.tags?.split(',');

    /*const resultObj = {
        id: vehicle_data.id,
        vin: vehicle_data.vin,
        brandid: vehicle_data.brandid,
        modelid: vehicle_data.modelid,
        fueltypeid: vehicle_data.fueltypeid,
        colorid: vehicle_data.colorid,
        type_certification: vehicle_data.type_certification,
        internal_number: vehicle_data.internal_number,
        market_date: vehicle_data.market_date,
        battery: vehicle_data.battery,
        service: vehicle_data.service,
        service_price: vehicle_data.service_price,
        mfk: vehicle_data.mfk,
        mfk_price: vehicle_data.mfk_price,
        breaks_front: vehicle_data.breaks_front,
        breaks_rear: vehicle_data.breaks_rear,
        engine_oil_leak: vehicle_data.engine_oil_leak,
        engine_oil_leak_price: vehicle_data.engine_oil_leak_price,
        trans_oil_leak: vehicle_data.trans_oil_leak,
        control_light: vehicle_data.control_light,
        trans_type: vehicle_data.trans_type,
        drivable: vehicle_data.drivable,
        axel_loader1: vehicle_data.axel_loader1,
        axel_loader2: vehicle_data.axel_loader2,
        note: vehicle_data.note,
        millage: vehicle_data.millage,
        small: vehicle_data.small === 'true' || false,
        small_price: vehicle_data.small_price,
        big: vehicle_data.big === 'true' || false,
        big_price: vehicle_data.big_price,
        price_breaks_front: vehicle_data.price_breaks_front,
        price_breaks_rear: vehicle_data.price_breaks_rear,
        price_trans_oil_leak: vehicle_data.price_trans_oil_leak,
        price_control_light: vehicle_data.price_control_light,
        interior: vehicle_data.interior,
        type: vehicle_data.type,
        tags: tags,
        summerTires : vehicle_data.summer_tire_id ? {
            front_tirebrandid: vehicle_data.st_front_tirebrandid,
            rear_tirebrandid: vehicle_data.st_rear_tirebrandid,
            front_tirebrand_name: vehicle_data.stf_brand_name,
            rear_tirebrand_name: vehicle_data.str_brand_name,
            profil_front: vehicle_data.st_profil_front,
            profil_rear: vehicle_data.st_profil_rear,
            rim_name: vehicle_data.st_rim_name,
            rim_id: vehicle_data.st_rim_id,
            frontDimension: {
                width: vehicle_data.stfd_width,
                height: vehicle_data.stfd_height,
                design: vehicle_data.stfd_design,
                load_index: vehicle_data.stfd_load_index,
                size: vehicle_data.stfd_tire_size,
                speed_index: vehicle_data.stfd_speed_index,
            },
            rearDimension: {
                width: vehicle_data.strd_width,
                height: vehicle_data.strd_height,
                design: vehicle_data.strd_design,
                load_index: vehicle_data.strd_load_index,
                size: vehicle_data.strd_tire_size,
                speed_index: vehicle_data.strd_speed_index,
            },
        } : null,
        winterTires : vehicle_data.winter_tire_id ? {
            front_tirebrandid: vehicle_data.wt_front_tirebrandid,
            rear_tirebrandid: vehicle_data.wt_rear_tirebrandid,
            front_tirebrand_name: vehicle_data.wtf_brand_name,
            rear_tirebrand_name: vehicle_data.wtr_brand_name,
            profil_front: vehicle_data.wt_profil_front,
            profil_rear: vehicle_data.wt_profil_rear,
            rim_name: vehicle_data.wt_rim_name,
            rim_id: vehicle_data.wt_rim_id,
            frontDimension: {
                width: vehicle_data.wtfd_width,
                height: vehicle_data.wtfd_height,
                design: vehicle_data.wtfd_design,
                load_index: vehicle_data.wtfd_load_index,
                size: vehicle_data.wtfd_tire_size,
                speed_index: vehicle_data.wtfd_speed_index,
            },
            rearDimension: {
                width: vehicle_data.wtrd_width,
                height: vehicle_data.wtrd_height,
                design: vehicle_data.wtrd_design,
                load_index: vehicle_data.wtrd_load_index,
                size: vehicle_data.wtrd_tire_size,
                speed_index: vehicle_data.wtrd_speed_index,
            },
        } : null,
        allseasonTires : vehicle_data.allseason_tire_id ? {
            front_tirebrandid: vehicle_data.at_front_tirebrandid,
            rear_tirebrandid: vehicle_data.at_rear_tirebrandid,
            front_tirebrand_name: vehicle_data.atf_brand_name,
            rear_tirebrand_name: vehicle_data.atr_brand_name,
            profil_front: vehicle_data.at_profil_front,
            profil_rear: vehicle_data.at_profil_rear,
            rim_name: vehicle_data.at_rim_name,
            rim_id: vehicle_data.at_rim_id,
            frontDimension: {
                width: vehicle_data.atfd_width,
                height: vehicle_data.atfd_height,
                design: vehicle_data.atfd_design,
                load_index: vehicle_data.atfd_load_index,
                size: vehicle_data.atfd_tire_size,
                speed_index: vehicle_data.atfd_speed_index,
            },
            rearDimension: {
                width: vehicle_data.atrd_width,
                height: vehicle_data.atrd_height,
                design: vehicle_data.atrd_design,
                load_index: vehicle_data.atrd_load_index,
                size: vehicle_data.atrd_tire_size,
                speed_index: vehicle_data.atrd_speed_index,
            },
        } : null,
        photos,
        damages,
        costs
    };*/

    const resultObj = {
        id: vehicle_data.id,
        vin: vehicle_data.vin,
        isNew: vehicle_data.type === 'new',
        brandId: vehicle_data.brandid,
        modelId: vehicle_data.modelid,
        fuelTypeId: vehicle_data.fueltypeid,
        colorId: vehicle_data.colorid,
        typeCertification: vehicle_data.type_certification,
        internalNumber: vehicle_data.internal_number,
        marketDate: vehicle_data.market_date,
        batteryStatus: vehicle_data.battery,
        service: vehicle_data.service,
        service_price: vehicle_data.service_price,
        mfk: vehicle_data.mfk,
        mfkPrice: vehicle_data.mfk_price,
        breaksFront: vehicle_data.breaks_front,
        breaksRear: vehicle_data.breaks_rear,
        engineOilLeak: vehicle_data.engine_oil_leak,
        engineOilLeakPrice: vehicle_data.engine_oil_leak_price,
        transOilLeak: vehicle_data.trans_oil_leak,
        controlLight: vehicle_data.control_light,
        transType: vehicle_data.trans_type,
        drivable: vehicle_data.drivable,
        axelLoader1: vehicle_data.axel_loader1,
        axelLoader2: vehicle_data.axel_loader2,
        note: vehicle_data.note,
        millage: vehicle_data.millage,
        small: vehicle_data.small === 'true' || false,
        smallPrice: vehicle_data.small_price,
        big: vehicle_data.big === 'true' || false,
        bigPrice: vehicle_data.big_price,
        priceBreaksFront: vehicle_data.price_breaks_front,
        priceBreaksRear: vehicle_data.price_breaks_rear,
        priceTransOilLeak: vehicle_data.price_trans_oil_leak,
        priceControlLight: vehicle_data.price_control_light,
        interior: vehicle_data.interior,
        type: vehicle_data.type,
        tags: tags,
        summer_tire : vehicle_data.summer_tire_id ? {
            id: vehicle_data.summer_tire_id,
            front_tirebrandid: vehicle_data.st_front_tirebrandid,
            rear_tirebrandid: vehicle_data.st_rear_tirebrandid,
            profil_front: vehicle_data.st_profil_front ? parseFloat(vehicle_data.st_profil_front) : 0,
            profil_rear: vehicle_data.st_profil_rear ? parseFloat(vehicle_data.st_profil_rear) : 0,
            rim_name: vehicle_data.st_rim_name,
            rimid: vehicle_data.st_rim_id,
            front_dimention: {
                id: vehicle_data.st_front_dimentionid,
                width: vehicle_data.stfd_width,
                height: vehicle_data.stfd_height,
                design: vehicle_data.stfd_design,
                load_index: vehicle_data.stfd_load_index,
                size: vehicle_data.stfd_tire_size,
                speed_index: vehicle_data.stfd_speed_index,
            },
            rear_dimention: {
                id: vehicle_data.st_rear_dimentionid,
                width: vehicle_data.strd_width,
                height: vehicle_data.strd_height,
                design: vehicle_data.strd_design,
                load_index: vehicle_data.strd_load_index,
                size: vehicle_data.strd_tire_size,
                speed_index: vehicle_data.strd_speed_index,
            },
        } : null,
        winter_tire : vehicle_data.winter_tire_id ? {
            id: vehicle_data.winter_tire_id,
            front_tirebrandid: vehicle_data.wt_front_tirebrandid,
            rear_tirebrandid: vehicle_data.wt_rear_tirebrandid,
            profil_front: vehicle_data.wt_profil_front ? parseFloat(vehicle_data.wt_profil_front) : 0,// vehicle_data.wt_profil_front,
            profil_rear: vehicle_data.wt_profil_rear ? parseFloat(vehicle_data.wt_profil_rear) : 0,//vehicle_data.wt_profil_rear,
            rim_name: vehicle_data.wt_rim_name,
            rimid: vehicle_data.wt_rim_id,
            front_dimention: {
                id: vehicle_data.wt_front_dimentionid,
                width: vehicle_data.wtfd_width,
                height: vehicle_data.wtfd_height,
                design: vehicle_data.wtfd_design,
                load_index: vehicle_data.wtfd_load_index,
                size: vehicle_data.wtfd_tire_size,
                speed_index: vehicle_data.wtfd_speed_index,
            },
            rear_dimention: {
                id: vehicle_data.wt_rear_dimentionid,
                width: vehicle_data.wtrd_width,
                height: vehicle_data.wtrd_height,
                design: vehicle_data.wtrd_design,
                load_index: vehicle_data.wtrd_load_index,
                size: vehicle_data.wtrd_tire_size,
                speed_index: vehicle_data.wtrd_speed_index,
            },
        } : null,
        allseason_tire : vehicle_data.allseason_tire_id ? {
            id: vehicle_data.allseason_tire_id,
            front_tirebrandid: vehicle_data.at_front_tirebrandid,
            rear_tirebrandid: vehicle_data.at_rear_tirebrandid,
            profil_front: vehicle_data.at_profil_front ? parseFloat(vehicle_data.at_profil_front) : 0,//vehicle_data.at_profil_front,
            profil_rear: vehicle_data.at_profil_rear ? parseFloat(vehicle_data.at_profil_rear) : 0,//vehicle_data.at_profil_rear,
            rim_name: vehicle_data.at_rim_name,
            rimid: vehicle_data.at_rim_id,
            front_dimention: {
                id: vehicle_data.at_front_dimentionid,
                width: vehicle_data.atfd_width,
                height: vehicle_data.atfd_height,
                design: vehicle_data.atfd_design,
                load_index: vehicle_data.atfd_load_index,
                size: vehicle_data.atfd_tire_size,
                speed_index: vehicle_data.atfd_speed_index,
            },
            rear_dimention: {
                id: vehicle_data.at_rear_dimentionid,
                width: vehicle_data.atrd_width,
                height: vehicle_data.atrd_height,
                design: vehicle_data.atrd_design,
                load_index: vehicle_data.atrd_load_index,
                size: vehicle_data.atrd_tire_size,
                speed_index: vehicle_data.atrd_speed_index,
            },
        } : null,
        vehiclePhotos: photos,
        damages,
        costs
    };

    return resultObj;
}
// Get vehicle photos end point

router.route('/updateVehicle').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response parameters
    let retVal = {msg: ''};
    // Try-Catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Body parameters
        const { vehicleId } = req.body;
        const {
            brandId, modelId, vin, fuelTypeId, colorId,
            typeCertification, internalNumber, marketDate, 
            batteryStatus, service, mfk, mfkPrice, breaksFront, breaksRear, engineOilLeak, 
            engineOilLeakPrice, transOilLeak, controlLight, transType, drivable,
            axelLoader1, axelLoader2, note,
            millage, smallPrice, bigPrice, priceBreaksFront, priceBreaksRear, 
            priceTransOilLeak, priceControlLight, interior, vehiclePhotos, damages,
            summer_tire, winter_tire, allseason_tire, tags, costs, service_price, delPhotos, addPhotos
        } = req.body;

        let { summer_tire_id, winter_tire_id,allseason_tire_id } = req.body;

        const small = req.body.small ? "true" : null;
        const big = req.body.big ? "true" : null;
        const tires_deleted = await deleteAllTires(vehicleId, req.user.accountid, summer_tire, winter_tire, allseason_tire);
        console.log({tires_deleted});
        if(tires_deleted){
            summer_tire_id = await createTire(summer_tire, req.user.accountid);
            winter_tire_id = await createTire(winter_tire, req.user.accountid);
            allseason_tire_id = await createTire(allseason_tire, req.user.accountid);
        }
        
        const tags_value = tags?.length > 0 ? tags.join() : "";

        const vehicleQuery = `UPDATE coll_vehicle SET
            brandid=$2, modelid=$3,fueltypeid=$4, 
            colorid=$5, type_certification=$6, internal_number=$7, 
            market_date=$8, battery=$9, service=$10, mfk=$11, mfk_price=$12, breaks_front=$13, breaks_rear=$14, engine_oil_leak=$15, 
            engine_oil_leak_price=$16, trans_oil_leak=$17, control_light=$18, trans_type=$19, drivable=$20,
            axel_loader1=$21, axel_loader2=$22, note=$23, 
            millage=$24, small=$25, small_price=$26, big=$27, big_price=$28, price_breaks_front=$29, price_breaks_rear=$30, 
            price_trans_oil_leak=$31, price_control_light=$32, interior=$33, summer_tire_id=$34, winter_tire_id=$35, allseason_tire_id=$36, tags=$37, service_price=$38
        WHERE id=$1 AND accountid=$39`;

        const params = [
            vehicleId, brandId, modelId, fuelTypeId, colorId, typeCertification, 
            internalNumber, marketDate, batteryStatus, service, mfk, mfkPrice, breaksFront, breaksRear, 
            engineOilLeak, engineOilLeakPrice, transOilLeak, controlLight, transType, drivable,
            axelLoader1, axelLoader2, note, millage, small, smallPrice, big, 
            bigPrice, priceBreaksFront, priceBreaksRear, priceTransOilLeak, priceControlLight, interior,
            summer_tire_id, winter_tire_id, allseason_tire_id, tags_value, service_price, req.user.accountid
        ];
        const vehicleResponse = await pool.query(vehicleQuery, params);

        if(delPhotos && delPhotos.length > 0){
            
            //add photos
            for (let i = 0; i < delPhotos.length; i++) {
                //delete photos
                const pictureQueryDel = 'DELETE FROM coll_vehicle_photos WHERE id=$1';
                await pool.query(pictureQueryDel, [delPhotos[i]]);
            }
        }

        if(addPhotos && addPhotos.length > 0){
            
            //add photos
            for (let i = 0; i < addPhotos.length; i++) {
                const pictureQuery = 'INSERT INTO coll_vehicle_photos (accountid, vehicleid, url) VALUES ($1, $2, $3)';
                await pool.query(pictureQuery, [req.user.accountid, vehicleId, addPhotos[i]]);
            }
        }

        /*if(vehiclePhotos && vehiclePhotos.length > 0){
            //delete photos
            const pictureQueryDel = 'DELETE FROM coll_vehicle_photos WHERE vehicleid=$1';
            await pool.query(pictureQueryDel, [vehicleId]);

            //add photos
            for (let i = 0; i < vehiclePhotos.length; i++) {
                const pictureQuery = 'INSERT INTO coll_vehicle_photos (accountid, vehicleid, url) VALUES ($1, $2, $3)';
                await pool.query(pictureQuery, [req.user.accountid, vehicleId, vehiclePhotos[i]]);
            }
        }*/

        if(costs && costs.length > 0){
            //delete costs
            const costsQueryDel = 'DELETE FROM coll_vehicle_cost WHERE vehicleid=$1';
            await pool.query(costsQueryDel, [vehicleId]);

            //add costs
            for (let i = 0; i < costs.length; i++) {
                let { name, price } = costs[i];
                const costQuery = `INSERT INTO coll_vehicle_cost (accountid, vehicleid, name, price) VALUES ($1, $2, $3, $4)`;
                
                await pool.query(costQuery, [req.user.accountid, vehicleId, name, price]);
            }
        }
        
        if(damages && damages.length > 0){
            //delete damages

            const damagesQueryDel = 'DELETE FROM coll_vehicle_damage WHERE vehicleid=$1';
            await pool.query(damagesQueryDel, [vehicleId]);

            //add damages
            for (let i = 0; i < damages.length; i++) {
                let { damageName, damageDescription, damagePrice, damagePhotoUrl } = damages[i];
                const damageQuery = `INSERT INTO coll_vehicle_damage (accountid, vehicleid, name, description, price, imageurl) VALUES ($1, $2, $3, $4, $5, $6)`;
                
                await pool.query(damageQuery, [req.user.accountid, vehicleId, damageName, damageDescription, damagePrice, damagePhotoUrl]);
            }
        }
        // Sens response status to 200 - good request, and returns response in the JSON format.
        retVal.msg = "OK";
        res.status(200).json(retVal);
        return;
    }
    // On an exception
    catch (err) {
        // Logs error in the console
        console.log({ updateVehicle: err});
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});

router.route('/updateVehicleTest').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response parameters
    let retVal = {msg: '', photos: null};
    // Try-Catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Body parameters
        const { vehicleId, vehiclePhotos } = req.body;
        // Fetching data from the database
        if(vehiclePhotos){
            //insert photos
            const pictureQueryDel = 'DELETE FROM coll_vehicle_photos WHERE vehicleid=$1';
            await pool.query(pictureQueryDel, [vehicleId]);

            for (let i = 0; i < vehiclePhotos.length; i++) {
                const pictureQuery = 'INSERT INTO coll_vehicle_photos (accountid, vehicleid, url) VALUES ($1, $2, $3)';
                await pool.query(pictureQuery, [req.user.accountid, vehicleId, vehiclePhotos[i]]);
            }
        }
        
        // Sens response status to 200 - good request, and returns response in the JSON format.
        res.status(200).json(retVal);
        return;
    }
    // On an exception
    catch (err) {
        // Logs error in the console
        console.log({ updateVehicleTest: err});
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});

router.route('/addReplacementVehicle').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response parameters
    let retVal = {msg: '' };
    // Try-Catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Body parameters
        const { vehicleId } = req.body;

        const query = `SELECT v.id, v.millage,  m.name as model_name, b.name as brand_name, c.name as color FROM coll_vehicle v
            LEFT JOIN coll_models m ON m.id = v.modelid
            LEFT JOIN coll_brands b ON b.id = v.brandid
            LEFT JOIN coll_colors c ON c.id = v.colorid
        WHERE v.id=$1`;

        const { rows } = await pool.query(query,[ vehicleId ]);
        if(rows.length > 0 ){
            const vehicle = rows[0];

            const okay = await createReplacementVehicle({
                accountid: req.user.accountid,
                name:  vehicle.brand_name + ' ' + vehicle.model_name,
                miles: vehicle.millage,
                color: vehicle.color,
                code: '-'
            });

            if(okay){
                await changeVehicleTypeToReplacement({ vehicleId });

                retVal.msg = "OK";
                res.status(200).json(retVal);
                return;
            }
        }
        
        retVal.msg = "Something went wrong!";
        // Sens response status to 200 - good request, and returns response in the JSON format.
        res.status(200).json(retVal);
        return;
    }
    // On an exception
    catch (err) {
        // Logs error in the console
        console.log({ addReplacementVehicle: err});
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});

const createReplacementVehicle = async ({ accountid, name, miles, color, code  }) => {
    const query = `INSERT INTO vehicle(
        accountid, name, miles, color, code )
        VALUES ($1, $2, $3, $4, $5)  RETURNING id;
    `;

    const { rows } = await pool.query(query,[ 
        accountid,
        name, 
        miles,
        color, 
        code 
    ]);

    return rows?.length > 0;
}

router.route('/addArchiveVehicle').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response parameters
    let retVal = {msg: '' };
    // Try-Catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Body parameters
        const { vehicleId } = req.body;
        const query = `UPDATE coll_vehicle SET type='archive'
            WHERE vehicleid = $1
        `;
        const { rows } = await pool.query(query, [vehicleId]);

        retVal.msg = "OK";
        // Sens response status to 200 - good request, and returns response in the JSON format.
        res.status(200).json(retVal);
        return;
    }
    // On an exception
    catch (err) {
        // Logs error in the console
        console.log({ addArchiveVehicle: err});
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});


const changeVehicleTypeToReplacement = async ({ vehicleId }) => {
    const query = `UPDATE coll_vehicle SET type='replacement'
        WHERE id = $1
    `;
    await pool.query(query, [vehicleId]);
    return true;
}

const addArchiveVehicle = async ({ vehicleId }) => {
    const query = `UPDATE coll_vehicle SET type='archive'
        WHERE id = $1
    `;
    await pool.query(query, [vehicleId]);
    return true;
}


router.route('/moveVehicleBackToCollection').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response parameters
    let retVal = {msg: '' };
    // Try-Catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Body parameters
        const { vehicleId } = req.body;
        const query = `UPDATE coll_vehicle SET type='used'
            WHERE id = $1
        `;
        await pool.query(query, [vehicleId]);
        retVal.msg = "OK";
        // Sens response status to 200 - good request, and returns response in the JSON format.
        res.status(200).json(retVal);
        return;
    }
    // On an exception
    catch (err) {
        // Logs error in the console
        console.log({ addArchiveVehicle: err});
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});

router.route('/getVehiclePhotos').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response parameters
    let retVal = {msg: '', photos: null};
    // Try-Catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Body parameters
        const {vehicleId} = req.body;
        // Fetching data from the database
        const query = `SELECT * FROM coll_vehicle_photos
            WHERE vehicleid = $1
        `;
        const queryResponse = await pool.query(query, [vehicleId]);
        let rows = queryResponse.rows;
        // If length of rows has greater than 0
        if (rows.length > 0) {
            retVal.msg = 'OK';
            retVal.photos = rows;
        }
        // Else if rows has equal to 0
        else {
            retVal.msg = "Cannot fetch data. No data in the table coll_vehicle_photos.";
        }
        // Sens response status to 200 - good request, and returns response in the JSON format.
        res.status(200).json(retVal);
        return;
    }
    // On an exception
    catch (err) {
        // Logs error in the console
        console.log(getVehiclePhotosError, err);
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});


// Lists damages by vehicle end point
router.route('/getVehicleDamages').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response parameters
    let retVal = {msg: '', damages: null};
    // Try-Catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Body parameters
        const {vehicleId} = req.body;
        // Fetching data from the database
        const query = `SELECT * FROM coll_vehicle_damage
            WHERE vehicleid = $1
        `;
        const queryResponse = await pool.query(query, [vehicleId]);
        let rows = queryResponse.rows;
        // If length of rows has greater than 0
        if (rows.length > 0) {
            retVal.msg = 'OK';
            retVal.damages = rows;
        }
        // Else if rows has equal to 0
        else {
            retVal.msg = "Cannot fetch data. No data in the table coll_vehicle_photos.";
        }
        // Sens response status to 200 - good request, and returns response in the JSON format.
        res.status(200).json(retVal);
        return;
    }
    // On an exception
    catch (err) {
        // Logs error in the console
        console.log(getVehicleDamagesError, err);
                // Sens response status to 400 - bad request, and returns response in the JSON format.
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});

// Delete vehicles end point
router.route('/deleteVehicle').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '' };
    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const {vehicleId} = req.body;
        const costSelectQuery = `SELECT * FROM coll_vehicle_cost WHERE accountid=$1 AND vehicleid=$2`;
        const costSelectResponse = await pool.query(costSelectQuery, [req.user.accountid, vehicleId]);
        let costSelectRows = costSelectResponse.rows;
        if (costSelectRows.length > 0) {
            const costDeleteQuery = `DELETE FROM coll_vehicle_cost WHERE accountid=$1 AND vehicleid=$2`;
            const costDeleteResponse = await pool.query(costDeleteQuery, [req.user.accountid, vehicleId]);
        }
        const damageSelectQuery = `SELECT * FROM coll_vehicle_damage WHERE accountid=$1 AND vehicleid=$2`;
        const damageSelectResponse = await pool.query(damageSelectQuery, [req.user.accountid, vehicleId]);
        let damageSelectRows = damageSelectResponse.rows;
        if (damageSelectRows.length > 0) {
            const damageDeleteQuery = `DELETE FROM coll_vehicle_damage WHERE accountid=$1 AND vehicleid=$2`;
            const damageDeleteResponse = await pool.query(damageDeleteQuery, [req.user.accountid, vehicleId]);
        }
        const photosSelectQuery = `SELECT * FROM coll_vehicle_photos WHERE accountid=$1 AND vehicleid=$2`;
        const photosSelectResponse = await pool.query(photosSelectQuery, [req.user.accountid, vehicleId]);
        let photosSelectRows = photosSelectResponse.rows;
        if (photosSelectRows.length > 0) {
            const photosDeleteQuery = `DELETE FROM coll_vehicle_photos WHERE accountid=$1 AND vehicleid=$2`;
            const photosDeleteResponse = await pool.query(photosDeleteQuery, [req.user.accountid, vehicleId]);
        }
        const vehicleSelectQuery = `SELECT * FROM coll_vehicle WHERE accountid=$1 AND id=$2`;
        const vehicleSelectResponse = await pool.query(vehicleSelectQuery, [req.user.accountid, vehicleId]);
        
        let vehicleSelectRows = vehicleSelectResponse.rows;
        if (vehicleSelectRows.length > 0) {
            const vehicleDeleteQuery = `DELETE FROM coll_vehicle WHERE accountid=$1 AND id=$2`;
            const vehicleDeleteResponse = await pool.query(vehicleDeleteQuery, [req.user.accountid, vehicleId]);
            retVal.msg = 'OK';
        }
        else {
            retVal.msg = 'Cannot delete vehicle. Maybe the vehicle does not exists, or belongs to another account.';
        }

        res.status(200).json(retVal);
        return;
    }catch(err){
        console.log({deleteVehicleError: err});
        retVal.msg = err.message;
        return res.status(400).json(retVal);
    }
});

const deleteVehicle = async ({ accountid, vehicleId }) => {
    try {
        const costSelectQuery = `SELECT * FROM coll_vehicle_cost WHERE accountid=$1 AND vehicleid=$2`;
        const costSelectResponse = await pool.query(costSelectQuery, [accountid, vehicleId]);
        let costSelectRows = costSelectResponse.rows;
        if (costSelectRows.length > 0) {
            const costDeleteQuery = `DELETE FROM coll_vehicle_cost WHERE accountid=$1 AND vehicleid=$2`;
            const costDeleteResponse = await pool.query(costDeleteQuery, [accountid, vehicleId]);
        }
        const damageSelectQuery = `SELECT * FROM coll_vehicle_damage WHERE accountid=$1 AND vehicleid=$2`;
        const damageSelectResponse = await pool.query(damageSelectQuery, [accountid, vehicleId]);
        let damageSelectRows = damageSelectResponse.rows;
        if (damageSelectRows.length > 0) {
            const damageDeleteQuery = `DELETE FROM coll_vehicle_damage WHERE accountid=$1 AND vehicleid=$2`;
            const damageDeleteResponse = await pool.query(damageDeleteQuery, [accountid, vehicleId]);
        }
        const photosSelectQuery = `SELECT * FROM coll_vehicle_photos WHERE accountid=$1 AND vehicleid=$2`;
        const photosSelectResponse = await pool.query(photosSelectQuery, [accountid, vehicleId]);
        let photosSelectRows = photosSelectResponse.rows;
        if (photosSelectRows.length > 0) {
            const photosDeleteQuery = `DELETE FROM coll_vehicle_photos WHERE accountid=$1 AND vehicleid=$2`;
            const photosDeleteResponse = await pool.query(photosDeleteQuery, [accountid, vehicleId]);
        }
        const vehicleSelectQuery = `SELECT * FROM coll_vehicle WHERE accountid=$1 AND id=$2`;
        const vehicleSelectResponse = await pool.query(vehicleSelectQuery, [accountid, vehicleId]);
        let vehicleSelectRows = vehicleSelectResponse.rows;
        if (vehicleSelectRows.length > 0) {
            const vehicleDeleteQuery = `DELETE FROM coll_vehicle WHERE accountid=$1 AND id=$2`;
            const vehicleDeleteResponse = await pool.query(vehicleDeleteQuery, [accountid, vehicleId]);
            
            return true;
        }
        else {
            return false;
        }
    } catch (error) {
        return false;
    }
    
}
// Endpoint to list all brands
router.route('/getBrands').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', brands: [] };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Fetch data
        const query = 'SELECT * FROM coll_brands';
        const queryResponse = await pool.query(query, []);
        let rows = queryResponse.rows;
        if (rows.length > 0) {
            retVal.brands = rows;
            retVal.msg = 'OK';
        }
        else {
            retVal.msg = "No data to fetch.";
        }
        res.status(200).json(retVal);
        return;
    }catch(err){
        console.log({getBrandsError: err});
        retVal.msg = err.message;
		res.status(400).json(retVal);
        return;
    }
});

router.route('/getColors').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', colors: [] };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Fetch data
        const query = `SELECT * FROM coll_colors WHERE name!='Black' AND name!='Red'`;
        const queryResponse = await pool.query(query, []);
        
        let rows = queryResponse.rows;
        if (rows.length > 0) {
            retVal.colors = rows.map((color) => ({
                ...color,
                code: getColorCode(color.name)
            }));
            retVal.msg = 'OK';
        }
        else {
            retVal.msg = "No data to fetch.";
        }
        res.status(200).json(retVal);
        return;
    }catch(err){
        console.log({getColorsError: err});
        retVal.msg = err.message;
		return res.status(400).json(retVal);
    }
});

const getColorCode = (colorName) => {
    let color = vehicle_colors.find((c) => c.name == colorName);

    return color?.code || '#fff';
}

router.route('/getModels').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', models: [] };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const { brandid } = req.body;
        // Fetch data
        const query = 'SELECT * FROM coll_models WHERE brandid = $1';
        const queryResponse = await pool.query(query, [brandid]);
        let rows = queryResponse.rows;
        if (rows.length > 0) {
            retVal.models = rows;
            retVal.msg = 'OK';
        }
        else {
            retVal.msg = "No data to fetch.";
        }
        res.status(200).json(retVal);
        return;
    }catch(err){
        console.log({getModelsError: err});
        retVal.msg = err.msg;
		return res.status(400).json(retVal);
    }
});

router.route('/getTireBrands').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', tireBrands: [] };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Fetch data
        const query = 'SELECT * FROM coll_tire_brands';
        const queryResponse = await pool.query(query, []);
        let rows = queryResponse.rows;
        if (rows.length > 0) {
            retVal.tireBrands = rows;
            retVal.msg = 'OK';
        }
        else {
            retVal.msg = "No data to fetch.";
        }
        res.status(200).json(retVal);
        return;
    }catch(err){
        console.log({getTireBrandsError: err});
        retVal.msg = err.msg;
		return res.status(400).json(retVal);
    }
});

router.route('/getFuelTypes').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', fuelTypes: [] };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Fetch data
        const query = 'SELECT * FROM coll_fuel_types';
        const queryResponse = await pool.query(query);
        let rows = queryResponse.rows;
        if (rows.length > 0) {
            retVal.fuelTypes = rows;
            retVal.msg = 'OK';
        }
        else {
            retVal.msg = "No data to fetch.";
        }
        res.status(200).json(retVal);
        return;
    }catch(err){
        console.log({getFuelTypesError: err});
        retVal.msg = err.msg;
		return res.status(400).json(retVal);
    }
});

router.route('/getAutomobileDataByVin').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', vehicle: null };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { vin } = req.query;
        
        if(vin && (vin.length === 17)){
            //fetch data 
            const query = 'SELECT vin, brand, model FROM automobile WHERE vin = $1';
            const { rows } = await pool.query(query,[vin]);

            if(rows.length > 0){
                const queryBrandModel = `SELECT b.name as brandName, m.brandid, m.name as modelName, m.id as modelid FROM coll_brands b
                    LEFT JOIN coll_models m ON m.brandid = b.id
                    WHERE b.name = $1 AND m.name = $2`;
                    
                const {rows:brandModelRows} = await pool.query(queryBrandModel,[rows[0].brand,rows[0].model]);

                if(brandModelRows.length > 0){
                    retVal.vehicle = brandModelRows[0];
                }
            }
        }

        return res.status(200).json(retVal);
    }catch(err){
        console.log({getAutomobileDataByVinError: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getAutomobileDataByTypeCertificate').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', data: null };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { typeCertification } = req.body;

        //hardcode test start
        if(typeCertification === '1AB820'){
            const [ brand, model ] = ['AUDI', 'A4'];

            const queryBrandModel = `SELECT b.name as brand_name, b.id as brand_id, m.name as model_name, m.id as model_id 
                FROM coll_brands b
                    LEFT JOIN coll_models m ON m.brandid = b.id
                WHERE LOWER(b.name) = $1 AND LOWER(m.name)=$2`;
            
            const {rows:brandModelRows} = await pool.query(queryBrandModel,[brand.toLowerCase(), model.toLowerCase()]);

            if(brandModelRows.length > 0){
                retVal.data = brandModelRows[0];
            }else {
                retVal.msg =  `Can't find data for this type certificate.`
            }
        }else {
            retVal.msg =  `Can't find data for this type certificate.`
        }

        return res.status(200).json(retVal);
        //hardcode test edn

        const query = 'SELECT brand, model FROM automobile WHERE typecert = $1';
        const { rows } = await pool.query(query,[typeCertification]);
        
        if(rows.length > 0){
            const { brand, model } = rows[0];
            const queryBrandModel = `SELECT b.name as brand_name, b.id as brand_id, m.name as model_name, m.id as model_id FROM coll_brands b
                LEFT JOIN coll_models m ON m.brandid = b.id
                WHERE LOWER(b.name) = $1 AND LOWER(m.name)=$2`;
                
            const {rows:brandModelRows} = await pool.query(queryBrandModel,[brand.toLowerCase(), model.toLowerCase()]);

            if(brandModelRows.length > 0){
                retVal.data = brandModelRows[0];
            }
        }
        return res.status(200).json(retVal);

    }catch(err){
        console.log({getAutomobileDataByTypeCertificateError: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getTireRims').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    let retVal = {msg: '', rims: []};
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const rimQuery = 'SELECT * from coll_tire_rim';
        const rimResponse = await pool.query(rimQuery);

        let rimRows = rimResponse.rows;
        if (rimRows.length > 0) {
            retVal.msg = 'OK';
            retVal.rims = rimRows;
        }
        
        res.status(200).json(retVal);
        return;
    }
    catch (err) {
        console.log({ getTireRimsErr: err});
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});

router.route('/getCosts').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // JSON response
    var retVal = {msg: '', costs};
    // Handling errors using try-catch block
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        // Raw body parameters
        const {vehicleId} = req.body;
        // Fetching data
        const query = `SELECT * FROM coll_vehicle_cost WHERE accountid=$1 AND vehicleid=$2`;
        const response = pool.query(query, [req.user.accountid, vehicleId]);
        // Now creating rows array for all costs
        let rows = (await response).rows;
        // Controlling condition if rows.length property has greater than 0
        if (rows.length > 0) {
            retVal.msg = 'OK';
            retVal.costs = rows;
        }
        else {
            // In all another situations
            retVal.msg = 'Cannot fetch costs';
        }
        // Returning response 200 - Good response
        res.status(200).json(retVal);
        return;
    }
    // Catching an exception
    catch(err) {
        console.log(GetCostsError, err);
        res.status(400).json(retVal); // Returns 400 - Bad request
        return;
    }
});

router.route('/getArchiveVehiclesByAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', vehicles: null };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }


        const { vin, brandId, modelId, colorId } = req.body;

        //fetch data 
        let queryVehicle = `SELECT v.*,
            st.front_tirebrandid as st_front_tirebrandid, st.rear_tirebrandid as st_rear_tirebrandid, st.front_tirebrandid as st_front_tirebrandid, st.rimid, st.profil_front as st_profil_front, st.profil_rear as st_profil_rear, st.front_dimentionid as st_front_dimentionid, st.rear_dimentionid as st_rear_dimentionid,
            stfd.width as stfd_width, stfd.height as stfd_height, stfd.design as stfd_design, stfd.load_index as stfd_load_index, stfd.tire_size as stfd_tire_size, stfd.speed_index as stfd_speed_index,
            strd.width as strd_width, strd.height as strd_height, strd.design as strd_design, strd.load_index as strd_load_index,strd.tire_size as strd_tire_size, strd.speed_index as strd_speed_index,
            strim.id as st_rim_id, strim.name as st_rim_name, 
            stfb.name as stf_brand_name, 
            strb.name as str_brand_name,

            wt.front_tirebrandid as wt_front_tirebrandid, wt.rear_tirebrandid as wt_rear_tirebrandid, wt.front_tirebrandid as wt_front_tirebrandid, wt.rimid, wt.profil_front as wt_profil_front, wt.profil_rear as wt_profil_rear, wt.front_dimentionid as wt_front_dimentionid, wt.rear_dimentionid as wt_rear_dimentionid,
            wtfd.width as wtfd_width, wtfd.height as wtfd_height, wtfd.design as wtfd_design, wtfd.load_index as wtfd_load_index,wtfd.tire_size as wtfd_tire_size, wtfd.speed_index as wtfd_speed_index,
            wtrd.width as wtrd_width, wtrd.height as wtrd_height, wtrd.design as wtrd_design, wtrd.load_index as wtrd_load_index,  wtrd.tire_size as wtrd_tire_size, wtrd.speed_index as wtrd_speed_index,
            wtrim.id as wt_rim_id, wtrim.name as wt_rim_name, 
            wtfb.name as wtf_brand_name, 
            wtrb.name as wtr_brand_name,

            at.front_tirebrandid as at_front_tirebrandid, at.rear_tirebrandid as at_rear_tirebrandid, at.front_tirebrandid as at_front_tirebrandid, at.rimid, at.profil_front as at_profil_front, at.profil_rear as at_profil_rear, at.front_dimentionid as at_front_dimentionid, at.rear_dimentionid as at_rear_dimentionid,
            atfd.width as atfd_width, atfd.height as atfd_height, atfd.design as atfd_design, atfd.load_index as atfd_load_index, atfd.tire_size as atfd_tire_size,  atfd.speed_index as atfd_speed_index,
            atrd.width as atrd_width, atrd.height as atrd_height, atrd.design as atrd_design, atrd.load_index as atrd_load_index,atrd.tire_size as atrd_tire_size, atrd.speed_index as atrd_speed_index,
            atrim.id as at_rim_id, atrim.name as at_rim_name,
            atfb.name as atf_brand_name, 
            atrb.name as atr_brand_name
            
        FROM coll_vehicle v
            LEFT OUTER JOIN coll_tire st ON st.id = v.summer_tire_id
            LEFT OUTER JOIN coll_tire_dimention stfd ON stfd.id = st.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention strd ON strd.id = st.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim strim ON strim.id = st.rimid
            LEFT OUTER JOIN coll_brands stfb ON stfb.id = st.front_tirebrandid
            LEFT OUTER JOIN coll_brands strb ON strb.id = st.rear_tirebrandid

            LEFT OUTER JOIN coll_tire wt ON wt.id = v.winter_tire_id
            LEFT OUTER JOIN coll_tire_dimention wtfd ON wtfd.id = wt.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention wtrd ON wtrd.id = wt.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim wtrim ON wtrim.id = wt.rimid
            LEFT OUTER JOIN coll_brands wtfb ON wtfb.id = wt.front_tirebrandid
            LEFT OUTER JOIN coll_brands wtrb ON wtrb.id = wt.rear_tirebrandid

            LEFT OUTER JOIN coll_tire at ON at.id = v.allseason_tire_id
            LEFT OUTER JOIN coll_tire_dimention atfd ON atfd.id = at.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention atrd ON atrd.id = at.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim atrim ON atrim.id = at.rimid
            LEFT OUTER JOIN coll_brands atfb ON atfb.id = at.front_tirebrandid
            LEFT OUTER JOIN coll_brands atrb ON atrb.id = at.rear_tirebrandid
        WHERE v.accountid=$1 AND type='archive'`; 

        let params = [req.user.accountid];
        if(vin?.length === 17){
            queryVehicle += ` AND v.vin = $${params.length + 1}`;
            params.push(vin);
        }

        if(brandId > 0){
            queryVehicle += ` AND v.brandid = $${params.length + 1}`;
            params.push(brandId);
        }

        if(modelId > 0){
            queryVehicle += ` AND v.modelid = $${params.length + 1}`;
            params.push(modelId);
        }

        if(colorId > 0){
            queryVehicle += ` AND v.colorid = $${params.length + 1}`;
            params.push(colorId);
        }

        queryVehicle += ` ORDER BY v.id DESC`;

        // status=1 means active
        const { rows:vehicles } = await pool.query(queryVehicle,params);
        let vehicles_arr = [];

        for (let i = 0; i < vehicles.length; i++) {
            const vehicle_data = vehicles[i];
            //Photos
            const vehiclePhotosQuery = `SELECT id, url FROM coll_vehicle_photos WHERE vehicleid = $1`;
            const photosPromise = pool.query(vehiclePhotosQuery,[vehicle_data.id]);

            //Damages
            const vehicleDamagesQuery = `SELECT id, name, price, imageurl, description FROM coll_vehicle_damage WHERE vehicleid = $1`;
            const damagesPromise = pool.query(vehicleDamagesQuery,[vehicle_data.id]);

            const vehicleCostsQuery = `SELECT id, name, price FROM coll_vehicle_cost WHERE vehicleid = $1`;
            const costsPromise = pool.query(vehicleCostsQuery,[vehicle_data.id]);

            const {rows:photos} = await photosPromise;
            const {rows:damages} = await damagesPromise;
            const {rows:costs} = await costsPromise;

            let obj = createVehicleObject({ 
                vehicle_data: {
                    ...vehicle_data,
                    market_date: parseInt(vehicle_data.market_date) 
                },
                photos,
                damages: damages.map((damage) => ({
                    id: damage.id,
                    damageName: damage.name,
                    damageDescription: damage.description,
                    damagePrice: damage.price,
                    damagePhotoUrl: damage.imageurl
                })),
                costs
            });

            vehicles_arr.push(obj);
        }

        if (vehicles_arr.length > 0) {
            retVal.msg = 'OK';
            retVal.vehicles = vehicles_arr;
        }
        else {
            retVal.msg = 'No data to fetch.';
        }
        return res.status(200).json(retVal);
    }catch(err){
        console.log({getVehicleListByAccountError: err});
        retVal.msg = err.message;
		return res.status(400).json(retVal);
    }
});

module.exports = router;