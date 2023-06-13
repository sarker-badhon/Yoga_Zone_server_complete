require('dotenv').config();

const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const stripe = require('stripe')(process.env.Payment_Secret_key)
const app = express();
const port = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

const verifyAdmin = async (req, res, next) => {
  const email = req.decoded ? req.decoded.email : undefined;

  if (!email) {
    return res.status(403).send({ error: true, message: 'Forbidden' });
  }

  const query = { email: email };
  const user = await usersCollection.findOne(query);

  if (!user || user.role !== 'admin') {
    return res.status(403).send({ error: true, message: 'Forbidden' });
  }

  next();
};

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hjhfn1d.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000, // Adjust the timeout value as needed
});

async function run() {
  try {
    await client.connect();

    const usersCollection = client.db('YogaDB').collection('users');
    const addClassCollection = client.db('YogaDB').collection('addClass');
    const instructorsCollection = client.db('YogaDB').collection('instructors');
    const AllClassesCollection = client.db('YogaDB').collection('allClasses');
    const ClassesCartCollection = client.db('YogaDB').collection('ClassesCart');

    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.status(409).json({ message: 'User already exists' });
        }
        const result = await usersCollection.insertOne(user);
        res.status(201).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/users',  async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get('/instructors', async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });

    app.get('/allClasses', async (req, res) => {
      const result = await AllClassesCollection.find().toArray();
      res.send(result);
    });

    app.get('/ClassesCart', async (req, res) => {
      const result = await ClassesCartCollection.find().toArray();
      res.send(result);
    });

    app.post('/ClassesCart', async (req, res) => {
      const classItems = req.body;
      const result = await ClassesCartCollection.insertOne(classItems);
      res.send(result);
    });

    app.delete('/ClassesCart/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ClassesCartCollection.deleteOne(query);
      res.json(result);
    });

    
    app.post('/create-payment', async (req, res) => {
      try {
        const { price } = req.body;

        // Validate the price value
        if (typeof price !== 'number' || price < 1) {
          return res.status(400).send({ error: 'Invalid price value.' });
        }

        const amount = price * 100;

        console.log(price, amount);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card'],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'An error occurred while creating the payment.' });
      }
    });



    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const role = req.query.role
      
      if (!role && !email) {
        const result = await usersCollection.find().toArray()
        res.send(result)
      }
      if (role && !email) {
        const query = { role: role }
        const result = await usersCollection.findOne(query)
        res.send(result)

      }
      if (!role && email) {
        const query = { email: email }
        const result = await usersCollection.findOne(query)
        res.send(result)
      }
      if(role && email){
        const query = {role:role,email:email}
        const result = await usersCollection.findOne(query)
        res.send(result)
      }
    });


    app.put('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin',
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get('/users/instructor/:email', async (req, res) => {
      const email = req.params.email;

      // Check if req.decoded exists and has an email property
      const decodedEmail = req.decoded ? req.decoded.email : undefined;

      if (decodedEmail !== email) {
        return res.send({ instructor: false });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' };
      res.send(result);
    });


    app.put('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor',
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post('/addClass', async (req, res) => {
      const classItems = req.body;
      const result = await addClassCollection.insertOne(classItems);
      res.send(result);
    });

    app.get('/addClass', async (req, res) => {
      const result = await addClassCollection.find().toArray();
      res.send(result);
    });

    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  } finally {
    // await client.close();
  }
}

run().catch(console.error);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
