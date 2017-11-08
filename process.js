const {promisify} = require('util');
const fs = require('fs');
const ls = require('list-directory-contents');
const json = require('big-json');
const Rx = require('rxjs/Rx');

const lsAsync = promisify(ls);

(async () => {

    let results = 0

    const resultList =  await lsAsync('results');

    Rx.Observable.from(resultList)
        //.do( file => console.log(file) )
        .concatMap( file => Rx.Observable.fromPromise(getJSON(file)))
        .concatMap( results => Rx.Observable.from(results) )
        .map( doctor => {

            let parsedDoctor = {
                id: doctor.id,
                fullName: doctor.name,
                first: doctor.name.match(/,\s\w*/) ? doctor.name.match(/,\s\w*/).pop() : '',
                last: doctor.name.match(/^\w*(?=,)/) ? doctor.name.match(/^\w*(?=,)/).pop() : '',
                address: doctor.address,
                phone: doctor.telephone
            };

            parsedDoctor.specialty = doctor.properties1.filter( prop => !prop.includes('Years in Practice:') )
                .map( prop => prop.replace('- Board Certified', '').trim())
                .join(',');

            return parsedDoctor;
        })
        .filter( doctor => doctor.fullName.includes(', MD'))
        .subscribe({
            next: doctor => { console.log(doctor.fullName, ' ', ++results) }
        });
    
})()

function getJSON(file){
    
    let p = new Promise((resolve, reject) => {

        const readStream = fs.createReadStream(file);
        const parseStream = json.createParseStream();

        parseStream.on('data', results => {
            resolve(results);
        });
        
        readStream.pipe(parseStream);
    });

    return p;
}
