const express = require("express");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.port || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "Unauthorize Access" });
  }

  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorize Access" });
    }
    req.decoded = decoded;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Global Speak School Server Is Running.");
});

// Start MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6khd2rb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("speakeDb").collection("users");
    const featuresCollection = client.db("speakeDb").collection("features");
    const classesCollection = client.db("speakeDb").collection("classes");
    const instructorCollection = client.db("speakeDb").collection("instructor");

    // JWT:-
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // warning: use verifyJWT before using verifyAdmin:
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden Access" });
      }
      next();
    };

    // User Related Apis:
    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await usersCollection.findOne(query);
        console.log("existing User", existingUser);
        if (existingUser) {
          return res.status(510).send({ Message: "User Already Exists" });
        }
        const result = await usersCollection.insertOne(user);
        console.log(result);
        res.send(result);
      } catch (err) {
        console.error("Error adding users", err);
        res.status(500).send({ error: "Error adding users" });
      }
    });

    app.patch("/users/admin/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };

        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (err) {
        console.error("Error update user info", err);
        res.status(500).send({ error: "Error update user info" });
      }
    });

    // FEATURE API COLLECTION:-
    // Get Feature
    app.get("/features", async (req, res) => {
      const result = await featuresCollection.find().toArray();
      res.send(result);
    });

    // Classes API COLLECTION
    // Get all classes
    app.get("/classes", async (req, res) => {
      try {
        const result = await classesCollection.find().toArray();
        res.send(result);
      } catch (err) {
        console.error("Error fetching classes", err);
        res.status(500).send({ error: "Error fetching classes" });
      }
    });

    // Add a new class
    app.post("/classes", async (req, res) => {
      try {
        const { name, students, imageUrl } = req.body;
        const result = await classesCollection.insertOne({
          name,
          students,
          imageUrl,
        });
        res.send(result.ops[0]);
      } catch (err) {
        console.error("Error adding class", err);
        res.status(500).send({ error: "Error adding class" });
      }
    });

    // Classes API COLLECTION
    // Get all instructor
    app.get("/instructor", async (req, res) => {
      try {
        const result = await instructorCollection.find().toArray();
        res.send(result);
      } catch (err) {
        console.error("Error fetching instructor", err);
        res.status(500).send({ error: "Error fetching instructor" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
