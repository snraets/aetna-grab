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
        $.filter_helper.setSearchRadius('P', 1); //50

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

    for(let index = 0; index < 1; index++) {

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
   
    page.evaluate( () => {
        
        // let names = Array.from(document.querySelectorAll('a'))
        //     .filter( selector => selector.id && /^\d+$/.test(selector.id) )
        //     .map( nameAnchor => nameAnchor.innerHTML );

        // let phones 

        return Array.from(
            document.querySelectorAll('tr[data-search-result-id]')
        )
            .map( resultElement => {

                let id = resultElement.querySelector('a').id;
                let name = resultElement.querySelector('a').innerHTML;

                //let telephone = resultElement.querySelector('section > div:nth-child(2) > ul > li:nth-child(1)') 


                // let telephone = resultElement.querySelector('section > div:nth-child(2) > ul > li:nth-child(1)').innerHTML ? 
                //     resultElement.querySelector('section > div:nth-child(2) > ul > li:nth-child(1)').innerHTML : 
                    '' ;

                // let address = resultElement.querySelector('section > div:nth-child(2) > ul > li:nth-child(2)').innerHTML ? element.innerHTML : '' ;
                // let properties1 = [];
                // let properties2 = [];
                // let properties3 = [];

                // properties1 = Array.from(
                //     document.querySelectorAll(`#result-detail-doctor-${id} > div:nth-child(1) > div`)
                // )
                //     .filter( element => element.classList.length === 0 )
                //     .map( element => element.innerHTML ? element.innerHTML : '' );

                // properties2 = Array.from(
                //     document.querySelectorAll(`#result-detail-doctor-${id} > div:nth-child(2) > div`)
                // )
                //     .filter( element => element.classList.length === 0 )
                //     .map( element => element.innerHTML ? element.innerHTML : '' );  
                    
                // properties3 = Array.from(
                //     document.querySelectorAll(`#result-detail-doctor-${id} > div:nth-child(3) > div`)
                // )
                //     .filter( element => element.classList.length === 0 )
                //     .map( element => element.innerHTML ? element.innerHTML : '' );    
                    
                // console.log({id, name, properties1, properties2, properties3});
                    
               return {id, name, telephone: resultElement.querySelector('section > div:nth-child(2) > ul > li:nth-child(1)')}; //, properties1, properties2, properties3
            });
            
    }).then( results => { 
        debugger;
     } )   
    
    jsonfile.writeFileSync('./results.json', scrapedResults);

    await browser.close();

})()