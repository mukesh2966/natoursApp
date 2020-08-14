const express = require('express');
const fs = require('fs');

const app = express();

// using middleware --data from the body is added to the request
// using this middleware
app.use(express.json());

// app.get('/', (req, res) => {
//   //   res.status(200).send('this is data from server');
//   res
//     .status(200)
//     .json({ message: 'this is data from server', app: 'this app' });
// });

// app.post('/', (req, res) => {
//   res.send('this is posting.');
// });

const x = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: x.length,
    data: {
      tours: x,
    },
  });
});

// creating a variable called id, in a variable route
app.get('/api/v1/tours/:id', (req, res) => {
  // console.log(req.params); // gives {id :'5'}
  // does the same for all such parameters in the request made
  // all the parameters must be defined, unless made optional.
  // /api/v1/tours/:id?/:yankei
  // id is optional here, yankei is required.

  const id = req.params.id * 1;

  // find will create an array where this comparison is true.
  const tour = x.find((current) => {
    return current.id === id;
  });

  // tour will be undefined when no such id is present
  // if(!tour)
  if (id > x.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid id',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
});

app.post('/api/v1/tours', (req, res) => {
  // console.log(req.body);

  const newId = x[x.length - 1].id + 1;
  // create new object -- by merging two objects together
  const newTour = Object.assign({ id: newId }, req.body);

  // pushing newTour in the datastructure
  x.push(newTour);

  // adding new tour to the file/database
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(x),
    (error) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );

  // cannot send two responses
  // res.send('Done');
});

app.patch('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1;
  if (id > x.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid id',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: 'tour should be updated by now.',
    },
  });
});

app.delete('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1;
  if (id > x.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid id',
    });
  }

  // 204 means -- no content
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`app running on port ${port}`);
});
