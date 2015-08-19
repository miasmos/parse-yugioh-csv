var fs = require('fs');
var csv = require('csv');
var path = require('path');
var async = require('async');
var mongoose = require('mongoose');
var db = require('./db');
var basepath;

init();

db.connect();

function init() {
	//grab the path
	process.argv.forEach(function (val, index, array) {
	  if (index == 2) {
	  	basepath = val.lastIndexOf("\\") == val.length ? val : val + "\\";
	  }
	});

	//iterate over the path's files
	if (typeof basepath !== 'undefined') {
		console.log("Parsing "+basepath);
		fs.readdir(basepath, function(err, files) {
			if (err) throw err;

			files.forEach(function(file){
		        if (path.extname(file) == '.csv') {
		        	parseCSVFile(basepath+file,file.slice(0, -4));
		        }
		    });
    	});
	} else {
		throw 'No path specified.';
	}
}

function parseCSVFile(filepath, filename) {
	var parser = csv.parse({relax:true,skip_empty_lines:true,delimiter:"|",ltrim:true});
	var transformer = csv.transform(function(data){
	  return data.map(function(value){
	  	value = value.trim();
	  	value = value.lastIndexOf(',') == value.length-1 ? value.slice(0, -1) : value;
	  	return value.indexOf(',') == 0 ? value.substring(1) : value;
	  });
	});

	parser.on('readable', function (err, data) {
	  while(data = parser.read()){
	    transformer.write(data);
	  }
	});

	transformer.on('readable', function(){
	  while(data = transformer.read()){
	  	if (data[0].length > 0) readLineCallback(data, filename);
	  }
	});

	fs.createReadStream(filepath).pipe(parser);

	function readLineCallback(data, filename) {
		if (validate(data)) {
			console.log(filename+": "+data);
			db.saveCard(filename,data,function(err,data) {
				console.log(err || data);
			});
		}

		function validate(data) {
			if (data[0].indexOf('Booster Pack') > -1 && data[0].indexOf(filename) > -1) return false;
			else return true;
		}
	}
}
