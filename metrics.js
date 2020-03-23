var express = require('express');
var path = require('path');

const fs = require('fs'),
	jwt = require('jsonwebtoken'),
	readline = require('readline'),
    app = express();

let dateNow = require('./date');



var Child;

module.exports = Child = function() {
	this.pid = process.pid;
};

Child.prototype.start = function() {
//function metrics(file = 'file1.tsv'){
	const readInterface = readline.createInterface({
	    input: fs.createReadStream(path.join(__dirname, 'files/file1.tsv' )),
	    output: process,
	    console: true
	});

	const o = new Object();

	var dateNowStart = dateNow.getDate();
	console.log('start ' + dateNowStart);

	readInterface.on('line', function(line) {
		//console.log(process.pid);
		var line = line.split('\t');
		var listSegment = line[1].split(',');
		for (var item in listSegment){
			var key = String(line[2]);
			if (!o[listSegment[item]]){
				var p = new Object();
				p[key] = 1;
				o[listSegment[item]] = p;
			} else {
				if (key in o[listSegment[item]]){
					o[listSegment[item]][key] = o[listSegment[item]][key] + 1; 
				} else {
					o[listSegment[item]][String(key)] = 1;
				}
			}
		}
	});	
	var metrics = [];
	readInterface.on('close', function() {
	   	//  var oo = {
		// 		'183': { BR: 27769, AR: 1166, MX: 3411, CO: 1241, CL: 98, PE: 107 },
		// 		'184': { BR: 57242, AR: 2869, CL: 859, MX: 10102, CO: 3523, PE: 1180 },
		// 		'185': { MX: 4265, BR: 17648, AR: 272, PE: 178, CO: 839, CL: 272 }
		//  }
		
	    for (var key in o){
			var uniques = [];
			for (var key2 in o[key]){
				var dict = {};
				dict['country'] = key2;
				dict['count'] = o[key][key2];
				uniques.push(dict);
			}
			metrics.push({
				'segmentId': key,
				'Uniques': uniques
			});
			
		}
		var dateNowEnd = dateNow.getDate();
		

		var resp = {
	   			'status': 'ready',
	   			'started' : dateNowStart,
	   			'finished' : dateNowEnd,
	   			'Metrics': metrics
	  	};
	  	console.log('end ' + dateNowEnd);
	  	console.log(resp);

		return resp;

	});
}

//module.exports.metrics = metrics;

var c = new Child();
c.start();

process.on('disconnect',function() {
	process.kill();
});

//metrics();