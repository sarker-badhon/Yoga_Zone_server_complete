require('dotenv').config(); // Add this line to load environment variables from .env file

const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hjhfn1d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    const instructorsCollection = client.db("YogaDB").collection("instructors") 
    const AllClassesCollection = client.db("YogaDB").collection("allClasses")

    app.get("/instructors", async (req, res) => {
        const result = await instructorsCollection.find().toArray()
        res.send(result)
      })
    app.get("/allClasses", async (req, res) => {
        const result = await AllClassesCollection.find().toArray()
        res.send(result)
      })





    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  } finally {
    // Ensure that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.error);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
