const fs = require('fs');
const json = require('big-json');

const readStream = fs.createReadStream('./results/results.20027.json');
const parseStream = json.createParseStream();

parseStream.on('data', (results) => {
    console.log(results.length);
});

readStream.pipe(parseStream);