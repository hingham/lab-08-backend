'use strict'

//PROXY SERVER - API server

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

require('dotenv').config();

const PORT = process.env.PORT;

const app = express();

app.use(cors());

function handleError(err, res){
  console.log(`ERROR`, err);
  if(res){res.status(500).send(`sorry no peanuts`);}
}

app.get('/location', (request, response)=>{
  searchToLatLong(request.query.data)
    .then(locationData=> {
      response.send(locationData);
    })
    .catch(err => handleError(err,response));
})

function searchToLatLong(query){
  const URL = (`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`);
  return superagent.get(URL)
    .then(data =>{
      if(!data.body.results.length){ throw `NO DATA`;}
      else{
        let location = new Location(data.body.results[0]);
        location.search_query = query; 
        return location;
      }
          

    })
    .catch(err => handleError(err));
}

function Location(data){
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
}

app.get('/weather',getWeatherData);

function getWeatherData(request, response){
  const URL = `https://api.darksky.net/forecast/${process.env.DARKSKY_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  return superagent.get(URL)
    .then(results => {
      const weatherArray = [];
      results.body.daily.data.forEach((day)=>{
        weatherArray.push(new Weather(day));
      })
      response.send(weatherArray);
    })
    .catch(err => handleError(err,response));
}

function Weather(data){
  this.time = new Date(data.time*1000).toString().slice(0,15);
  this.forecast = data.summary;
}

// yelp
app.get('/yelp', getYelp);

function getYelp(request, response){

  const URL = (`https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`);
  return superagent.get(URL)
    .set({'Authorization' : `Bearer ${process.env.YELP_API_KEY}`})
    .then( results =>{
      const yelpArray = [];
      results.body.businesses.forEach((e)=>{
        yelpArray.push(new Yelp(e));

      })
      response.send(yelpArray);
    })
    .catch(err => handleError(err,response));

}

function Yelp(data){
  this.name = data.name;
}


// movies
app.get('/movies', getMovie);

function getMovie(request, response){
  console.log(request.query.data.formatted_query);
  let city = request.query.data.formatted_query.split(', ').slice(0,1);

  const URL = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${city}&page=1&include_adult=false`;
  return superagent.get(URL)
    .then(results =>{
      const movieArray = [];
      results.body.results.forEach((e)=>{
        movieArray.push(new Movie(e))
      })
      response.send(movieArray);
    })
    .catch(err => handleError(err,response));

}

function Movie(data){
  this.title = data.title;
    

}

