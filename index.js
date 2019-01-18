'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const API_KEY = require('./apiKey');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next){
	// do logging
	console.log('Something is happening.');
	next();		// make sure we go to the next routes and don't stop here
});


router.post('/', (req, res) => {
	var intent = req.body.queryResult && req.body.queryResult.intent && req.body.queryResult.intent.displayName ? req.body.queryResult.intent.displayName : 'movie-intent';
	console.log('intent:',intent);
	
	if(intent == 'Response Helpful Intent - yes'){
		res.send('Thank you for your help and hope you enjoy using it.');
	}
	else if(intent == 'Response Helpful Intent - no'){
		res.send('We\'ll working hard to improve it!');
	}
	else {
		getMovie(req, res);
	}
	
    
});


function getResponseScore(req, res){
	var score = req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.score ? req.body.queryResult.parameters.score : 4;
	
	res.json({message:"Thank you for giving us score ", score})
}

function getMovie(req, res){
	var movieToSearch = req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.movie ? req.body.queryResult.parameters.movie : 'The Godfather';
	
	const reqUrl = encodeURI(`http://www.omdbapi.com/?t=${movieToSearch}&apikey=${API_KEY}`);
    http.get(reqUrl, (responseFromAPI) => {
        let completeResponse = '';
        responseFromAPI.on('data', (chunk) => {
            completeResponse += chunk;
        });
        responseFromAPI.on('end', () => {
            const movie = JSON.parse(completeResponse);
            let dataToSend = movieToSearch === 'The Godfather' ? `I don't have the required info on that. Here's some info on 'The Godfather' instead.\n` : '';
            dataToSend += `${movie.Title} is a ${movie.Actors} starer ${movie.Genre} movie, released in ${movie.Year}. It was directed by ${movie.Director}`;

            // return res.json({
            //     speech: dataToSend,
            //     displayText: dataToSend,
            //     source: 'get-movie-details'
            // });
            return res.json({
                fulfillmentText: 'This is a text response',
                fulfillmentMessages: [
                  { text: {text: [dataToSend]}}
                ],
                source: 'get-movie-details',
                payload: {
                  google: {
                    expectUserResponse: true,
                    richResponse: {
                      items: [
                        {
                          simpleResponse: {
                            textToSpeech: "this is a simple response! " + dataToSend
                          }
                        }
                      ]
                    }
                  }
                }
              });
        });
    }, (error) => {
        // return res.json({
        //     speech: 'Something went wrong!',
        //     displayText: 'Something went wrong!',
        //     source: 'get-movie-details'
        // });
        return res.json({
            fulfillmentText: 'Something went wrong!',
            fulfillmentMessages: [
              { text: ['Something went wrong!'],}
            ],
            source: 'get-movie-details'
        });
    });
}

// more routes for our API will happen here

// on routes that end in /bears
// ----------------------------------------------------
router.route('/res-helpful')
	// create a bear (accessed at POST http://localhost:8080/get-movie-details/res-helpful)
    .post(function(req, res){
		console.log(req.body);
		var name = req.body.name || 'Admin';
		var score = req.body.score || 5;
		res.send('Hello '+name+'. Thank you for giving us score:'+score);
	});
	
// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/get-movie-details', router);

// START THE SERVER
// =============================================================================
app.listen((process.env.PORT || 8000), () => {
    console.log("server is up and running...");
});