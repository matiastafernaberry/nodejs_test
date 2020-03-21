const readline = require('readline');
var express = require('express');
var path = require('path');

const fs = require('fs'),
	jwt = require('jsonwebtoken'),
    app = express();

async function readFile(fileName) {

	let count = 0;   // logic for
	
	const o = new Object();

	const readInterface = readline.createInterface({
	    input: fs.createReadStream(path.join(__dirname, 'files/file1.tsv')),
	    output: process.stout,
	    console: true
	});

	readInterface.on('line', function(line) {

		var line = line.split('\t');
		//console.log(line);
		var listSegment = line[1].split(',');
		for (var item in listSegment){

			var key = String(line[2]);
			//console.log('key');
			//console.log(key);

			if (!o[listSegment[item]]){
				var p = new Object();
				p[key] = 1;
				o[listSegment[item]] = p;
				//console.log('--if--');
				//console.log(o[listSegment[item]]);
			} else {
				//console.log('--  else  --');
				//console.log(key);
				//console.log(o[listSegment[item]]);
				if (key in o[listSegment[item]]){
					//console.log('---  second if ----');
					o[listSegment[item]][key] = o[listSegment[item]][key] + 1; 
				} else {
					//console.log('---  second else ----');
					o[listSegment[item]][String(key)] = 1;
					//console.log(o[listSegment[item]]);
				}

			}
		}  

   })
  return await o;
}

var a = readFile('');
console.log(a);
a.then(function(result) {
   console.log(result) // "Some User token"
})


// receive message from master process