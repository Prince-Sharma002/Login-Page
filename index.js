import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from 'mongodb';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';

// This line creates an instance of the Express.js application. It initializes the Express.js application and allows you to define routes, middleware, and other settings for your web application.
const app = express();

//  This line creates an HTTP server using Node.js's built-in http module. It takes the Express.js application (app) as an argument. By doing this, you are essentially "wrapping" your Express.js application with an HTTP server. 
const http = createServer(app);
const port = process.env.PORT || 5000;

const mongo_username = process.env['MONGO_USERNAME'];
const mongo_password = process.env['MONGO_PASSWORD'];
const mongo_uri = `mongodb+srv://${mongo_username}:${mongo_password}@cluster.ynomqgq.mongodb.net/crmdb?retryWrites=true&w=majority`;


// const client: This line declares a constant variable named client to store the MongoDB client object. This object will be used to interact with the MongoDB database.

// new MongoClient(mongo_uri, { useNewUrlParser: true }): Here, a new instance of the MongoClient class is created. It takes two arguments:

// mongo_uri: This should be the connection URI (Uniform Resource Identifier) for your MongoDB database. It typically includes information about the host, port, authentication credentials, and the name of the specific database you want to connect to. In your case, it appears to be stored in the variable mongo_uri, which should be the address of your Atlas MongoDB database.

// { useNewUrlParser: true }: This is an options object that is passed to the MongoClient constructor. The useNewUrlParser option is set to true, which tells the MongoDB driver to use the new URL parser. This option is used to parse the mongo_uri string in a more modern and flexible way.

// After creating the MongoClient instance, you would typically use it to establish a connection to the MongoDB database by calling client.connect(). Once connected, you can perform various database operations using this client, such as inserting, querying, and updating documents in the database.

const client = new MongoClient(mongo_uri, { useNewUrlParser: true });

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const isAuthenticate = async (req, res, next) => {
  const { token } = req.cookies;

  if (req.cookies.token) {
    const decoder = jwt.verify(token, "abcd");

    req.records = await client
      .db("crmdb")
      .collection("record")
      .findOne({ _id: decoder._id });

    next(); // Continue processing the request
  } else {
    req.records = null; // Set to null if token is not present
    next(); // Continue processing the request
  }
};


app.get("/", isAuthenticate, (req, res) => {
  console.log("hello2" , req.records );
  res.sendFile('/login.html', { root: '.' });
})

app.get("/login", (req, res) => {
  console.log("hello" , req.records );
  res.sendFile("/login.html", { root: '.' });
})


// when posting data( submit form) perform all action in post
// app.post("/login", (req, res) => {
//       console.log(res.body);
//       res.cookie("item", "prince");
//       res.redirect("/");
// })

app.get("/logout", (req, res) => {
  res.cookie("item", null, { expires: new Date(Date.now()), });
  res.sendFile('/login.html', { root: '.' });
})


client.connect().then(() => {
  console.log("server connected");
  const records = client.db('crmdb').collection('record');

app.post("/login", async (req, res) => {
    try {
      const coustomer = {
        name: req.body.name,
        address: req.body.address,
        telephone: req.body.telephone,
        note: req.body.note,
      };
      const result = await records.insertOne(coustomer);
      console.log("1 data inserted ");
   }
    catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).send('Error creating customer');
    }

      // console.log(res.body);

      const token = jwt.sign( {_id: records._id} , "abcd" );
      // console.log( token );
    
      res.cookie("token", token);
      res.redirect("/");

});

  http.listen(port, () => {
    console.log("Listening on Port", port);
  });

})
