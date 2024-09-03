require('dotenv').config()



const express = require('express')
const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const cors = require('cors')
require("./database/connector")()


const users = require("./database/schemas/users")
const uuid = require("uuid")

app.use(cors())
app.use(express.static(__dirname +'/public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/users", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.sendStatus(400)
  }

  const userExist = await users.findOne({ username: username })
  if (userExist) {
    return res.json({ username: userExist.username, _id: userExist._id })
  }

  const newUserId = uuid.v4()



  await users.create({
    _id: newUserId,
    username: username,
    exercises: []

  })

  return res.json({ username: username, _id: newUserId })


})


app.get('/api/users', async (req, res) => {
  const fetchAllusers = await users.find().select('-exercises');

  return res.json(fetchAllusers)

})


app.post('/api/users/:_id/exercises', async (req, res) => {
  const userID = req.params._id;

  let { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.json({ error: 'description, duration is required' })
  }

  const userExist = await users.findOne({ _id: userID });
  if (!userExist) {
    return res.json({ error: 'user not found' })
  }

  if (isNaN(duration)) {
    return res.json({ error: 'duration must be a number' })
  }

  let timeStamp = null;
  if (!date) {
    timeStamp = Date.now()
  } else {
    timeStamp = new Date(date).getTime();
  }

  const exercise_object = {
    description: description,
    duration: duration * 1,
    date: timeStamp

  }

  userExist.exercises.push(exercise_object)
  await userExist.save()

  const convertTimeStampToDateAgain = new Date(timeStamp).toDateString()

  let userobject = {
    _id: userExist._id, 
    username: userExist.username,
    date: convertTimeStampToDateAgain, duration: duration*1, description: description
  }

  return res.json( userobject )

})

app.get('/api/users/:_id/logs', async (req, res) => {
  let { from, to, limit } = req.query;
  const userId = req.params._id

  const userExist = await users.findOne({ _id: userId });
  if (!userExist) {
    return res.sendStatus(404)
  }
  if (!limit) {
    limit = false;
  }
  if (limit && isNaN(limit)) {
    return res.json({ error: 'limit must be a number' })
  }


  let exercises = userExist.exercises;
  if (limit && !from && !to) {
    exercises = exercises.slice(0, limit * 1)
  }

  if (!from && !to) {
    const convertedExerciseArray = []
    for (const e of exercises) {
      const exerciseObject = {
        description: e.description,
        duration: e.duration * 1,
        date: new Date(e.date).toDateString()
      }
      convertedExerciseArray.push(exerciseObject)
    }
    return res.json({ _id: userId, username: userExist.username, count: exercises.length,log: convertedExerciseArray })
  }

  if(from && to) {
    const startDate = new Date(from).getTime()

    const endDate = new Date(to).getTime()

  
  
if(isNaN(startDate) || isNaN(endDate)) {
  return res.json({error: 'either from or to has an invalid date'})
}
    const filteredExercises = exercises.filter(item => item.date >= startDate && item.date <= endDate).slice((0, limit * 1))
    let convertedExerciseArray = []
    for (const e of filteredExercises) {
      const exerciseObject = {
        description: e.description,
        duration: e.duration * 1,
        date: new Date(e.date).toDateString()
      }
      convertedExerciseArray.push(exerciseObject)
    }
    return res.json({ _id: userId, username: userExist.username, log: convertedExerciseArray, count: filteredExercises.length })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
