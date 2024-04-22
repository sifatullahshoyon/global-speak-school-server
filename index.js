const express = require('express');
require('dotenv').config();
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.port || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


app.get('/', (req, res) => {
  res.send('Global Speak School Server Is Running.')
});



// Start MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6khd2rb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const featuresCollection = client.db('speakeDb').collection('features');
    const classesCollection = client.db('speakeDb').collection('classes');


    // FEATURE API COLLECTION:-
    // Get Feature
    app.get('/features' , async(req,res) => {
        const result = await featuresCollection.find().toArray();
        console.log(result);
        res.send(result);
    });

   // Get all classes
app.get('/classes', async (req, res) => {
  try {
    const result = await classesCollection.find().toArray();
    res.send(result);
  } catch (err) {
    console.error('Error fetching classes', err);
    res.status(500).json({ error: 'Error fetching classes' });
  }
});

// Add a new class
app.post('/classes', async (req, res) => {
  try {
    const { name, students, imageUrl } = req.body;
    const result = await classesCollection.insertOne({ name, students, imageUrl });
    res.json(result.ops[0]);
  } catch (err) {
    console.error('Error adding class', err);
    res.status(500).json({ error: 'Error adding class' });
  }
});




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});