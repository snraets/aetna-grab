const puppeteer = require('puppeteer');
const wait = require('wait-then');
const jsonfile = require('jsonfile');

exports.scrape = async (page, location) => {

    let doctorNumber,
        doctorLoop;

    await page.goto('http://sarhcpdir.cigna.com/nalc', {waitUntil: 'load'}).catch( err => console.log('Initial load regected: ', err));
    
    await wait(5000);    

    await page.evaluate( (currentLocation) => {    

        document.querySelector('#zipCode').value = currentLocation.zipCode;
        document.querySelector('#city').value = 'Washington';
        document.querySelector('#stateCode').value = 'DC';
        document.querySelector('#latitude').value = currentLocation.latitude;
        document.querySelector('#longitude').value = currentLocation.longitude;

        document.querySelector('#searchLocation').value = currentLocation.formattedAddress;
        document.querySelector('#search').click();
    }, location).catch( err => console.log('Setting Initial Page', err));

    await wait(5000);

    await page.evaluate( () => {
        $.filter_helper.setSearchRadius('P', 1); //50        
    }).catch( err => console.log('Setting Radius: ', err));

    await wait(1000);    

    await page.evaluate(() => {
        
        Array.from(
            document.querySelectorAll('.cigna-button.cigna-button-purple-light')
        )
            .filter( element => element.innerHTML === 'Apply' )
            .pop()
            .click();
    });  
    
    await wait(3000); 

    doctorNumber = await page.evaluate( () => {
        return document.querySelector('.prominent-text.align-center').innerHTML.replace(/\s+/g, '').match(/>\d+</)[0].replace('<','').replace('>','');
    });   
    
    doctorLoop = parseInt(parseInt(doctorNumber)/10);
    doctorLoop = parseInt(doctorNumber)%10 > 0 ? doctorLoop + 1 : doctorLoop;
    
    console.log('ZipCode: ', location.zipCode,  ' Number of doctors: ', doctorNumber, ' Iterations: ', doctorLoop);

    for(let index = 0; index < doctorLoop; index++) {
        
        await page.evaluate( ( ) => {

            if(document.querySelectorAll('.cigna-button.cigna-button-purple-light')) {
                Array.from(
                    document.querySelectorAll('.cigna-button.cigna-button-purple-light')
                )
                .filter( element => element.innerHTML === 'More Results' )
                .pop()
                .click();
            }            
        }).catch( err => console.log('More results failed: ', err) )
    
        await wait(4000); 

        await page.evaluate(() => {
            return document.querySelectorAll('tr[data-search-result-id]').length;
        })
            .then((rows) => console.log('Doctors: ', rows, 'Index: ', index));
    }
    
    await wait(3000);

    await page.evaluate( () => {
        
        return Array.from(
            document.querySelectorAll('tr[data-search-result-id]')
        )
            .map( resultElement => {

                let id = '';
                let name = '';
                let telephone = '';
                let address = '';
                let properties1 = [];
                let properties2 = [];
                let properties3 = [];                

                id = resultElement.querySelector('a').id;
                name = resultElement.querySelector('a').innerHTML;

                telephone =	resultElement.querySelector('ul.pipe-links.pipe-links-stackable > li:nth-child(1)') ? 
                    resultElement.querySelector('ul.pipe-links.pipe-links-stackable > li:nth-child(1)').innerHTML : 
                    '';

              	address =	resultElement.querySelector('ul.pipe-links.pipe-links-stackable > li:nth-child(2)') ? 
                    resultElement.querySelector('ul.pipe-links.pipe-links-stackable > li:nth-child(2)').innerHTML : 
                    '';

                properties1 = Array.from(
                    document.querySelectorAll(`#result-detail-doctor-${id} > div:nth-child(1) > div`)
                )
                    .filter( element => element.classList.length === 0 )
                    .map( element => element.innerHTML ? element.innerHTML : '' );

                properties2 = Array.from(
                    document.querySelectorAll(`#result-detail-doctor-${id} > div:nth-child(2) > div`)
                )
                    .filter( element => element.classList.length === 0 )
                    .map( element => element.innerHTML ? element.innerHTML : '' );  
                    
                properties3 = Array.from(
                    document.querySelectorAll(`#result-detail-doctor-${id} > div:nth-child(3) > div`)
                )
                    .filter( element => element.classList.length === 0 )
                    .map( element => element.innerHTML ? element.innerHTML : '' );    
                    
                    
               return {id, name, telephone, address, properties1, properties2, properties3}; //, properties1, properties2, properties3
            });
            
    })
        .then( scrapedResults => { 
            jsonfile.writeFileSync(`./results/results.${location.zipCode}.json`, scrapedResults);
        });  
        
    await wait(1500);
}
