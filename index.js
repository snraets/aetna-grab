const puppeteer = require('puppeteer');
const wait = require('wait-then');
const jsonfile = require('jsonfile');

(async () => {

    const browser = await puppeteer.launch({headless: false}).catch(err => console.log('browser'));
    const page = await browser.newPage().catch(err => console.log('newPage'));
    await page.setViewport({ width: 1800, height: 2000}).catch(err => console.log('viewPort'));

    await page.goto('http://sarhcpdir.cigna.com/nalc', {waitUntil: 'load'}).catch( err => void 0);

    await wait(5000);

    await page.evaluate( () => {

        document.querySelector('#zipCode').value = 20005;
        document.querySelector('#city').value = 'Washington';
        document.querySelector('#stateCode').value = 'DC';
        document.querySelector('#latitude').value = '38.908229';
        document.querySelector('#longitude').value = '-77.03053899999999';

        document.querySelector('#searchLocation').value = 'Washington, DC 20005, USA';
        document.querySelector('#search').click();
    });

    await wait(5000);

    await page.evaluate( () => {
        $.filter_helper.setSearchRadius('P', 50); //50

        // document.getElementById('PfacetGenderCodeM').click();
        // document.getElementById('PfacetGenderCodeF').click();
        // document.getElementById('PfacetSpecialtyCodesPAT').click(); // Acupuncture
        // document.getElementById('PfacetSpecialtyCodesP07').click(); // Primary Care Physician
        
        Array.from(
            document.querySelectorAll('.cigna-button.cigna-button-purple-light')
        )
        .filter( element => element.innerHTML === 'Apply' )
        .pop()
        .click();

    });

    await wait(3000);

    let searchResults = await page.evaluate( () => {
        return document.querySelector('.prominent-text.align-center').innerHTML.replace(/\s+/g, '').match(/>\d+</)[0].replace('<','').replace('>','');
    });

    let endLoop = parseInt(parseInt(searchResults)/10);

    endLoop = parseInt(searchResults)%10 > 0 ? endLoop + 1 : endLoop;

    for(let index = 0; index < endLoop; index++) {

        await page.evaluate( ( ) => {
            
            Array.from(
                document.querySelectorAll('.cigna-button.cigna-button-purple-light')
            )
            .filter( element => element.innerHTML === 'More Results' )
            .pop()
            .click();
        });

        console.log('Next Set', index);
    
        await wait(1000); 
    }

    await wait(5000);
   
    await page.evaluate( () => {
        
        // let names = Array.from(document.querySelectorAll('a'))
        //     .filter( selector => selector.id && /^\d+$/.test(selector.id) )
        //     .map( nameAnchor => nameAnchor.innerHTML );

        // let phones 

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
            
    }).then( scrapedResults => { 
        jsonfile.writeFileSync('./results.json', scrapedResults);
     });
        
    await browser.close();

})()