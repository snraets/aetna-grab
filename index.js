const puppeteer = require('puppeteer');
const Rx = require('rxjs/Rx');
const wait = require('wait-then');
const jsonfile = require('jsonfile');
const rp = require('request-promise');
const zipcodes = require('zipcodes');

const zipList = require('./data/zipCodes').zipCodes1;
const scrape = require('./lib/scrape').scrape;

(async function(){

    const browser = await puppeteer.launch({headless: false}).catch(err => console.log('browser'));
    const page = await browser.newPage().catch(err => console.log('newPage'));
    
    await page.setViewport({ width: 1800, height: 2000}).catch(err => console.log('viewPort'));

    Rx.Observable.from(zipList)
        //.map( zip => zipcodes.lookup(zip) )
        .concatMap( zip => Rx.Observable.fromPromise(rp(`https://sarhcpdir.cigna.com/hcp-directory-presentation/v2/typeahead/geolocation?query=${zip}&consumerCode=HDC013&limit=15`)) )
        .map( zipResults => {
            const parsedResults = (({ latitude, longitude, formattedAddress, zipCode }) => ({ latitude, longitude, formattedAddress, zipCode }))(JSON.parse(zipResults).geolocations[0]);
            return parsedResults;
        })
        .concatMap( zipResults => Rx.Observable.fromPromise(scrape(page, zipResults)) )
        .subscribe({
            // next: (zip) => console.log(zip),
            complete: async () => { await browser.close(); },
            error: async () => { await browser.close(); }
        });

})()