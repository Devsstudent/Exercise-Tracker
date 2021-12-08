const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()

mongoose.connect(process.env.MANGO_URI);
const Schema = mongoose.Schema;

const exercise = new Schema({
  description: String,
  duration: Number,
  date: String
})

const user = new Schema({
  username: String,
  _id: Schema.Types.ObjectId,
  log: [exercise]
})


let User = mongoose.model("User", user);
let Exercise = mongoose.model("Exercise", exercise)


app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users').post((req, res) => {
  var user_to_add = new User ({
    username: req.body.username,
    _id: new mongoose.Types.ObjectId()
  });
  user_to_add.save((err, data) => {
    if (err)
    {
      return console.error(err);
    }
    console.log(data.username)
    res.json(data);
  })
}).get((req, res) => {
  User.find({}, (err, data) => {
    if (err)
    {
      console.error(err);
    }
    res.send(data);
  })
});

app.post('/api/users/:id/exercises', (req, res) => {
  const exercise_to_add = new Exercise ({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  });
  if (exercise_to_add.date === undefined || exercise_to_add.date === '')
  {
    exercise_to_add.date = new Date().toDateString()
  }
  else 
  {
    exercise_to_add.date = new Date(exercise_to_add.date).toDateString();
  }
  User.findByIdAndUpdate({_id: req.params.id},{$push: {log: exercise_to_add}},{new: true}, (err, data) => {
    if (err)
    {
      return console.error(err);
    }

    let object_to_display = {};
    object_to_display['_id'] = req.params.id;
    object_to_display['username'] = data.username;
    object_to_display['description'] = exercise_to_add.description;
    object_to_display['duration'] = exercise_to_add.duration;
    object_to_display['date'] = exercise_to_add.date;
    res.json(object_to_display);
});

});

app.get('/api/users/:id/logs', (req, res)  => {
  User.findById({_id: req.params.id}, (err, data) => 
  {
    if(err)
    {
      return console.error(err);
    }
    var returnObj = {};
    returnObj['_id']= req.params.id;
    returnObj['username']=  data.username;

    if(req.query.from || req.query.to) 
    {
      let fromDate = new Date(0);
      let toDate = new Date();
      if(req.query.from)
      {
        fromDate = new Date(req.query.from);
      }
      if(req.query.to)
      {
        toDate = new Date(req.query.to);
      }
      toDate = toDate.getTime();
      fromDate = fromDate.getTime();

      data.log = data.log.filter((arr_limit) => {
        let limit_date = new Date(arr_limit.date).getTime();
        return limit_date >= fromDate && limit_date <= toDate;
      })
    }
    if(req.query.limit)
    {
      data.log = data.log.slice(0, req.query.limit);
    }
    returnObj['count'] = data.log.length;
    returnObj['log']= data.log;
    res.json(returnObj);
  })

});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
