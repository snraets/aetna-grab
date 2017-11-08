const fs = require('fs');
const json = require('big-json');

const readStream = fs.createReadStream(`./results/results.${process.argv[2]}.json`);
const parseStream = json.createParseStream();

parseStream.on('data', results => {
    console.log(results.length);
});

readStream.pipe(parseStream);