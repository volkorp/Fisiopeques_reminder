const db = require('../db');

// function updateTable(payload){
//   return new Promise((resolve, reject) => {
//     try {
//       let queryParams = [];
//       let sql = ``;
//       let firstLoop = true;
      
//       for(var key in payload.params){
//         queryParams.push(payload.params[key]);
        
//         if (firstLoop) {
//           sql = `UPDATE ${payload.table} SET ${key} = ?`
//           firstLoop = false;
//         }else{
//           sql += `, ${key} = ?`
//         }        
//       }
      
//       let response = { message: 'Error al actualizar el registro.', statusCode: '400' };
//       if (!payload.filter){
//         resolve(response);
//       }
      
//       sql += ` WHERE idCenso = ${payload.filter}`
      
//       const result = db.run(sql, queryParams);
      
//       if (result.changes) {
//         response.message = 'Registro actualizado correctamente.';
//         response.statusCode = 200;
//       } else {
//         let error = new Error();
//         error.statusCode = 404;
//         error.message='Recurso no encontrado.';
//         reject(error);
//       } 
      
//       resolve(response);
      
//     } catch (err) {
//       console.error(err);
//       let error = new Error();
//       error.statusCode = 500;
//       error.message='Se ha producido un error durante la actualización del registro.';
//       reject(error);
//     }
//   });
// }

function getTable(payload){
  return new Promise((resolve, reject) => {
    let table = payload.table
    let fields = "*"
    let join = ""
    let where = ""

    if (payload.fields && payload.fields != undefined){
      fields = payload.fields
    }

    if (payload.join && payload.join != undefined){
      join = payload.join
    }

    if (payload.where && payload.where != undefined){
      where = payload.where
    }

    if (!table || table == undefined || table == "Login"){
      let response = { message: 'No se pudo encontrar la tabla especificada.', statusCode: 404 };
      resolve(response);
    } 

    try {            
      console.log(table);         
      const data = db.query_noParams(`SELECT ${fields} FROM ${table} ${join} ${where}`);
      data.statusCode = 200;
      resolve(data);
        
    } catch (err) {
      console.error(err);
      let response = { message: 'Error interno del servidor.', statusCode: 500 };
      reject(response);
    }
  });
}

module.exports = {
  getTable
}