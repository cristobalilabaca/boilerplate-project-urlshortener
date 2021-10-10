require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const dns = require('dns');
const bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const shortUrlSchema = new mongoose.Schema({
  url: { type: String, required: true},
  short_url: Number,
})

const shortUrl = mongoose.model('shortUrl', shortUrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


let id= 0;
app.post('/api/shorturl', function(req, res) {
  dns.lookup(req.body.url, (err, address) => {
    if (!req.body.url.startsWith('https://www.')){
      res.json({ error: "invalid url"});
    }
    if (address) {
      shortUrl.find({ url: req.body.url }, (err, data) => {
        if (err) {
          res.json({ error: err });
        }
        if (!data.length) {
          const short = new shortUrl({ url: req.body.url, short_url: id });
          id++;
          short.save((err, data) => {
            if (err) {
              res.json({error: err });
            } else {
              console.log('new')
              console.log(data);
              res.json({original_url: req.body.url, short_url: data.short_url});
            };
          });
        } else {
          console.log('not new')
          console.log(data);
          res.json({original_url: req.body.url, short_url: data[0].short_url});
        };
      })
    };
  });
})

app.get('/api/shorturl/:url', function(req, res) {
  shortUrl.findById(req.params.url, (err, data) => {
    if (err) {
      res.json({ error: err});
    } else {
      res.redirect(data.url);
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
