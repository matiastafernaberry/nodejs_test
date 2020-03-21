var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
const readline = require('readline');
var path = require('path');

const fs = require('fs'),
	jwt = require('jsonwebtoken'),
    config = require('./configs/config'),
    app = express();

app.set('key', config.key);
// session
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());


// middleware
const rutasProtegidas = express.Router(); 
rutasProtegidas.use((req, res, next) => {
    const token = req.headers['authorization'];
 
    if (token) {
    	jwt.verify(token, app.get('key'), (err, decoded) => {      
        if (err) {
        	return res.json({ mensaje: 'Token inválida' });    
        } else {
          	req.decoded = decoded;    
          	next();
        }
    });
    } else {
      	res.send({ 
         	 mensaje: 'Accesso Restringido.' 
      	});
    }
});

// url
app.post('/login', (req, res) => {
	//console.log(req.body);
    if(req.query.user === "matias" && req.query.password === "1234") {
		const payload = {
	   		check:  true
	  	};
	  	const token = jwt.sign(payload, app.get('key'), {
	   		expiresIn: 3600
	  	});
  	
	  	var d = new Date(),
        	month = '' + (d.getMonth() + 1),
        	day = '' + d.getDate(),
        	year = d.getFullYear();
        d.setSeconds( d.getSeconds() + 3600 );

	  	if (month.length < 2) 
        	month = '0' + month;
    	if (day.length < 2) 
        	day = '0' + day;

	  	res.json({
	   		expires: year+'-'+month+'-'+day+'T'+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds(),
	   		token: token
	  	});
	} else {
	    res.json({ mensaje: "Usuario o contraseña incorrectos"})
	}
});


app.get('/files/list', rutasProtegidas, function(req, res) {

	const directoryPath = path.join(__dirname, 'files');
	var files = [],
		fileSizes = [];
	const convertBytes = function(bytes) {
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
		if (bytes == 0) {
		return "n/a"
		}
		const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
		if (i == 0) {
		return bytes + " " + sizes[i]
		}

		return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
	} 

	var responseFiles = [];
	fs.readdirSync(directoryPath).forEach(file => {
		var responseDict = {};
		files.push(file);
		if(req.query.humanreadable == 'true'){
			var size = convertBytes(fs.statSync(directoryPath+ '/' +file).size)
		} else {
			var size = fs.statSync(directoryPath+ '/' +file).size;
		}
		responseDict['name'] = file;
		responseDict['size'] = size
		
		fileSizes.push(size);
		responseFiles.push(responseDict);
		//console.log(req.query.humanreadable);
	});
	
	res.json({
   		response: [responseFiles]
  	});
  	//console.log(result);
});


app.get('/files/metrics', rutasProtegidas, function(req, res) {

	const readInterface = readline.createInterface({
	    input: fs.createReadStream(path.join(__dirname, 'files/file1.tsv')),
	    output: process,
	    console: true
	});
	
	cont = 0;
	var BreakException = {};
	const o = new Object();

	var d = new Date(),
    	month = '' + (d.getMonth() + 1),
    	day = '' + d.getDate(),
    	year = d.getFullYear();

    if (month.length < 2) 
    	month = '0' + month;
	if (day.length < 2) 
    	day = '0' + day;
    var inicio = year+'-'+month+'-'+day+'T'+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();
    //console.log(inicio);

	readInterface.on('line', function(line) {

		var line = line.split('\t');
		//console.log(line);
		var listSegment = line[1].split(',');
		for (var item in listSegment){

			var key = String(line[2]);


			if (!o[listSegment[item]]){
				var p = new Object();
				p[key] = 1;
				o[listSegment[item]] = p;

			} else {

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


	});	
	var metrics = [];
	readInterface.on('close', function() {
    //do something with lines

	   //  var oo = {
  		// 	'183': { BR: 27769, AR: 1166, MX: 3411, CO: 1241, CL: 98, PE: 107 },
  		// 	'184': { BR: 57242, AR: 2869, CL: 859, MX: 10102, CO: 3523, PE: 1180 },
  		// 	'185': { MX: 4265, BR: 17648, AR: 272, PE: 178, CO: 839, CL: 272 }
  		// }
		
	    for (var key in o){
			var uniques = [];
			for (var key2 in o[key]){
				//console.log(key2);
				var dict = {};
				dict['country'] = key2;
				dict['count'] = o[key][key2];
				uniques.push(dict);
			}
			//console.log(uniques);
			//console.log('---------');
			metrics.push({
				'segmentId': key,
				'Uniques': uniques
			});
			
		}
		//console.log(metrics);
		var d = new Date(),
    	month = '' + (d.getMonth() + 1),
    	day = '' + d.getDate(),
    	year = d.getFullYear();

	    if (month.length < 2) 
	    	month = '0' + month;
		if (day.length < 2) 
	    	day = '0' + day;
	    var fin = year+'-'+month+'-'+day+'T'+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();

		res.json({
	   		response: {
	   			'status': 'ready',
	   			'started' : inicio,
	   			'finished' : inicio,
	   			'Metrics': metrics
	   		}
	  	});

	})

	
});


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});



app.listen(3000, () => {
 console.log("El servidor está inicializado en el puerto 3000");
});