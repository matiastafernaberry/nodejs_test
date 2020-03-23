var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
const readline = require('readline');
var path = require('path');

const fs = require('fs'),
	jwt = require('jsonwebtoken'),
    config = require('./configs/config'),
    app = express();

var childProcessEnd = true; 
var childProcessStart = false;
var sendBool = false; 
var status = '';

let dateNow = require('./date');

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
const authentication = express.Router(); 
authentication.use((req, res, next) => {
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
    if(req.query.user === "matias" && req.query.password === "1234") {
		const payload = {
	   		check:  true
	  	};
	  	const token = jwt.sign(payload, app.get('key'), {
	   		expiresIn: 3600
	  	});
  	
	  	var dateNowExpires = dateNow.getDate(login=true);

	  	res.json({
	   		expires: dateNowExpires,
	   		token: token
	  	});
	} else {
	    res.json({ mensaje: "Usuario o contraseña incorrectos"})
	}
});


app.get('/files/list', authentication, (req, res) => {
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
		responseDict['size'] = size;
		
		fileSizes.push(size);
		responseFiles.push(responseDict);
	});
	
	res.json({
   		response: [responseFiles]
  	});
});


app.get('/files/metrics', authentication, (req, res) => {
	const readInterface = readline.createInterface({
	    input: fs.createReadStream(path.join(__dirname, 'files/file1.tsv')),
	    output: process,
	    console: true
	});

	try {
	  	if (fs.existsSync('file1.txt')) {
	    	fs.readFile('file1.txt', function(err, data) {
	    		var dataSend = JSON.parse(data.toString());
			    //console.log(data);
			    //process.on('exit', function(code) {
		    	console.log('return 1');
		    	
				//return console.log(`About to exit with code ${code}`);
				sendBool = true;
				//return process.kill(process.pid);
				res.json(dataSend);
				//});
			});
			
	  	}
	} catch(err) {
	  	console.error(err)
	}
	if (!fs.existsSync('file1.txt')){
		const o = new Object();

		var dateNowStart = dateNow.getDate();

		if (!childProcessStart){
			childProcessStart = true;
			childProcessEnd = false;
			readInterface.on('line', function(line) {
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
				childProcessStart = false;
				childProcessEnd = true;
				status = 'ready';

				console.log('end child');
				console.log(status);

				var jsonData = {
	            	'response': {
	                    'status': 'ready',
	                    'started' : dateNowStart,
	                    'finished' : dateNowEnd,
	                	'Metrics': metrics
	                }
	            };
	            var jsonData = JSON.stringify(jsonData);
	            console.log(jsonData);
	 			var fs = require('fs'); 
				fs.writeFile("file1.txt", jsonData, function(err) {
				    if (err) {
				        console.log(err);
				    } else {
				    	status == 'ready';
				    }
				});
				console.log('before res');
				// res.json({
			 //   		response: {
			 //   			'status': 'ready',
			 //   			'started' : dateNowStart,
			 //   			'finished' : dateNowEnd,
			 //   			'Metrics': metrics
			 //   		}
			 //  	});
			 // 	res.redirect('/login');
			});
		} else {
			if (status == 'processing'){
				// res.json({
			 //   		response: {
			 //   			'status': 'processing',
			 //   		}
			 //  	});
			};
			status = 'processing';
		}
		
	}

	
});


app.listen(3000, () => {
	console.log("El servidor está inicializado en el puerto 3000");
});