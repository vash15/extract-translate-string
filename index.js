
// Libs

var fs 	 	 = require('fs');
var fsExtend = require('fs-extended');
var path 	 = require('path');
var promptly = require('promptly');
var program  = require('commander');
var ProgressBar = require('progress');
var colors   = require('colors');
var async    = require('async');
var _		 = require('underscore');
var _s		 = require('underscore.string');
var PO 		 = require('pofile');


var ets = module.exports = {};
var ignoreItems 	   = [];
var defaultIgnoreItems = [".jpg", ".jpeg", ".png", ".gif", ".eot", ".ttf", ".woff", ".svg", ".DS_Store", ".gitignore", ".git", ".svn", ".md", ".manifest", ".bowerrc" ];
var stringsList 	   = {};
var translateFunctions = ["translate","t","fkt","__","__n"];
var typesOutput 	   = ['text', 'json', 'po'];
var poFile 			   = null;

// Utils

function getWorkingDir(dir) {
	var workingDir = dir
		? path.resolve(process.cwd(), dir) 
		: process.cwd();
	return workingDir;
}


function filter(itemPath, stat){

	if ( !stat.isFile() ){
		return false;
	}

	var visible = true;
	_(ignoreItems).each(function(item, index){
		if ( visible && itemPath.indexOf( item ) > -1 ){
			visible = false;
		}
	});

	return visible;
}

function map(itemPath, stat) {
	return {
	    path: itemPath,
	    name: path.basename(itemPath),
	    ext: path.extname(itemPath),
	    size: stat.size,
	}
}


// Declaration

ets.initIgnore = function initIgnore(options){
	var workingDir  = getWorkingDir(options.dir),
		fileDefault = path.resolve(__dirname, ".etsignore"),
		fileIgnore  = path.resolve(workingDir, ".etsignore");

	fsExtend.copyFileSync( fileDefault, fileIgnore );
	
	console.log("File created, done!".cyan);

}

// PO file

ets.poToJSON = function poToJSON(options){
	var filePO = options.file;
	var fileOutput = options.out;
	var translates = {};
	if ( !fileOutput )
		return new Error('File json for output does not setted.');
	if ( !filePO || !fs.existsSync(filePO) )
		return new Error('Input PO file does not setted.');


	// Control if output exists
	if ( fs.existsSync(fileOutput) ){
		try{
			var txt = fs.readFileSync( fileOutput, {encoding: 'utf8'} );
			translates = JSON.parse( txt );
		}catch(e){
			translates = {};
		}
	}

	PO.load(filePO, function (err, po) {
	    if ( err )
	    	return new Error("Error on read file po.");
	    
	    if ( po && po.items && po.items.length > 0 ){
	    	_(po.items).each(function(item){
	    		if ( item.msgid && item.msgstr && item.msgstr.length > 0 )
	    			translates[ item.msgid ] = item.msgstr[0];
	    	});
	    }

	    var txt = JSON.stringify(translates);
		error = fs.writeFileSync(fileOutput, txt.replace(/(\\\\)/gm,"\\") );
	    
	});


};

// Extract 

ets.extract = function extract(options){

	console.log('');
	console.log('This utility will walk you extract string for tranlate.'.grey);
	console.log('You can customize etsignore file using the command: ets ingore <dir>'.grey);
	console.log('');

	// 1. Select output
	// 2. Select type output
	// 3. Check etsignore file
	// 4. Read directory and subdirecotory
	// 5. Write output file

	var directories = options.dir && _.isArray(options.dir) ? options.dir : [ process.cwd() ];
	var fileOutput  = options.out;
	var adFileOutputExtension = true;
	var tasks 	    = [];
	var typeOutput  = "text";

	// Check file output
	if (!fileOutput){

		tasks.push(function(next){

			promptly.prompt(
				'Output directory ['+process.cwd()+']: ',
				{
					default: process.cwd(),
					validator: function (value) {
					    if ( !fs.existsSync( value )  ) {
					     	throw new Error('Directory doesn\'t exists');   
					    }
					    return value;
					},
					retry: true
				},
				function (err, dir) {
			    	
			    	fileOutput = path.resolve(dir, "ets-strings-extracs");
			    	next();

				}
			);

		});

	}else{
		adFileOutputExtension = false;
	}


	// Select type output
	tasks.push(function (next) {

		var ext = path.extname( fileOutput ).replace(/\./,'');
		typeOutput = _(typesOutput).find(function(aValue){return aValue == ext });
		if ( typeOutput )
			return next();

		promptly.choose(
			'Please select type of output (text, json, po): [json]', 
			typesOutput, 
			{
				default: 'json'
			},
			function (err, value) {
		    	typeOutput = value;
		    	next();
			}
		);

	});

	// Load file
	tasks.push(function (next){

		switch(typeOutput){
			case "json":
				if ( !fs.existsSync( fileOutput ) )
					return next();

				try{
					var txt = fs.readFileSync( fileOutput, {encoding: 'utf8'} );
					stringsList = JSON.parse( txt );
				}catch(e){
					stringsList = {};
				}

				return next();
			break;
			case "po":

				if ( !fs.existsSync( fileOutput ) ){
					poFile = new PO();
					return next();
				}

				PO.load(fileOutput, function (err, po) {
				    // Handle err if needed
				    // Do things with po
				    if ( err )
				    	return next();

				    poFile = po;
				    return next();

				});

			break;
			default:
				return next();
			break;
		}

	});

	
	
	// Each directory list
	_(directories).each(function(_dir, index){

		var workingDir = getWorkingDir( _s.trim(_dir) );

		// Check black list
		tasks.push(function (next) {
			
			var etsignore = path.join( workingDir, ".etsignore" );

			if ( !fs.existsSync( etsignore ) ){
				
				etsignore = path.resolve( __dirname, ".etsignore" );

			}

			// Read file etsignore
			var fileEtsignore = fs.readFileSync( etsignore, {encoding: "utf8"});
			ignoreItems = fileEtsignore.split("\n");
			
			if ( _.isArray(ignoreItems) ){
				ignoreItems = defaultIgnoreItems.concat( ignoreItems );
			}

			next();

		});


		// Read directory and subdirecotory
		tasks.push(function(next){

			if (  fs.existsSync( workingDir ) ){
				var stat = fs.statSync( workingDir );
				if ( stat.isDirectory() ){

					fsExtend.listFiles(workingDir, { 
							recursive: 1,
							filter: filter,
							map: map
						}, 
						function (err, files) {
							
							if ( err ) return next(err);
								
							var contentFile = "";
							var matches  = new Array();
							var indexVal = 2;
							var _str  = "";
							var regex = /([\s|\.](translate|t|fkt|__)\((.*?)[\"|\'][\)|\,]|[\s|\.](__n)\((.*?\,)(.*?)[\"|\'][\)|\,])+/g;
							var keyString = "";
							var openedString = "";

							_(files).each(function(file, index){

								if ( fs.existsSync( file.path ) ){
									
									contentFile = fs.readFileSync( file.path ).toString();

									// contentFile = contentFile.replace(/(\n)/gm,"\\n");
									
									while (matches = regex.exec(contentFile)) {
										// console.log( matches );

										matches = _.compact( matches );

										// Find special function function `__n`
										indexVal = 3;
										if ( _(matches).find(function(aValue){ return aValue === "__n"; }) )
											indexVal = 4;

										if ( matches[ indexVal ] && matches[ indexVal ].length > 0 ){

											_str = _s.trim( matches[ indexVal ] );
											
											if ( _str.length > 0 ){
												
												openedString = _str[0];
												keyString 	 = _s.trim(_str, openedString);

												if ( !stringsList[ keyString ] )
													stringsList[ keyString ] = "";

											} // end if str length 

										} // End matches

									} // end while matches 

									
								} // end if exists

							}); // End Each files


							// Next
							return next();
						}
					); // End List Fiels

				}else{
					next( "Error! Please a valid path" );
				}

			}else{
				next( "Error! Please a valid path" );
			}

		});


	}); // END	EACH DIR


	// Write output file
	tasks.push(function(next){

		var error = null;

		switch( typeOutput.toLowerCase() ){

			case "text":
				if ( adFileOutputExtension )
					fileOutput += ".txt";
				var stringsListText = "";
				_(stringsList).each(function(transtale, stringForTranslate){
					stringsListText += stringForTranslate+"\n";
				});
				
				error = fs.writeFileSync(fileOutput, stringsListText );
				return next(error);

			break;

			case "po":
				if ( adFileOutputExtension )
					fileOutput += ".po";
				
				_(stringsList).each(function(transtale, stringForTranslate){

					// Cerco se negli items ho già un msgid incluso
					var item = _(poFile.items).findWhere({ msgid: stringForTranslate });
					if ( !item ){
						item = new PO.Item();
						item.msgid  = stringForTranslate;
						item.msgstr = [transtale];
						poFile.items.push( item );
					}
				});


				poFile.save(fileOutput, function (err) {
				    // Handle err if needed
				    return next(err);
				});

			break;

			case "json":
			default:
				if ( adFileOutputExtension )
					fileOutput += ".json";
				
				var txt = JSON.stringify(stringsList);
				error = fs.writeFileSync(fileOutput, txt.replace(/(\\\\)/gm,"\\") );
				return next(error);

			break;

		}


	});


	
	async.waterfall(tasks, function (err) {
		
		if ( err ) return console.log( err.error );
		
		console.log('Done!'.cyan);

	});


}


