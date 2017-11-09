const {promisify} = require('util');
const fs = require('fs');
const ls = require('list-directory-contents');
const _ = require('lodash');

const lsAsync = promisify(ls);

(async function(){

    const zipList = require('./data/zipCodes').zipCodes;
    const resultList =  await lsAsync('results');
    
    const zipProcesed = resultList.map( raw => 
        parseInt(raw.match(/\d{5}/).pop()) 
    );

    const remainingZips = _.difference(zipList, zipProcesed);

    fs.writeFileSync('./remaining.txt', remainingZips);
    
    debugger;

})()

