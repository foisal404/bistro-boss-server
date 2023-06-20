const express = require('express');
const app=express()
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port=process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())

const verifyJWT=(req,res,next)=>{
  const authorization=req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorized aceess '})
  }
  const token =authorization.split(' ')[1];

  jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
    if(err){
      return res.satatus(401).send({error:true,message:'unauthorized access'})
    }
    req.decoded=decoded;
    next()
  })

}

app.get('/',(req,res)=>{
    res.send("Bistro Boss working ...")
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pxrxjz6.mongodb.net/?retryWrites=true&w=majority`;

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
    const menuCollection= client.db("BistroDB").collection("menu");
    const reviewCollection= client.db("BistroDB").collection("review");
    const cartCollection= client.db("BistroDB").collection("carts");
    const userCollection= client.db("BistroDB").collection("users");

    //jwt 
    app.post('/jwt',(req,res)=>{
      const user=req.body;
      const token=jwt.sign(user,process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      res.send({token})
    })
    //user api

    app.get('/users/admin/:email',async(req,res)=>{
      const email=req.params.email;
      const query={email:email};
      const user=await userCollection.findOne(query)
      const result={admin:user?.role === "admin"}
      res.send(result);
    })
    app.patch("/users/admin/:id",async(req,res)=>{
      const id=req.params.id;
      const filter={_id: new ObjectId(id)}
       const updateDoc = {
      $set: {
        role:"admin"
      },
    };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    app.get('/users',async(req,res)=>{
      const cursor =await userCollection.find().toArray();
      res.send(cursor)
    })
    app.post('/users',async(req,res)=>{
      const data=req.body;
      const query = { email: data.email };
      const exist = await userCollection.findOne(query);
      if(exist){
        res.send(["alrady Exist"])
      }
      else{
        const result = await userCollection.insertOne(data);
        res.send(result)
      }
    })
    //menucollection api
    app.get('/menu',async(req,res)=>{
        const cursor =await menuCollection.find().toArray();
        res.send(cursor)
    })
    //review collection api
    app.get('/review',async(req,res)=>{
        const cursor =await reviewCollection.find().toArray();
        res.send(cursor)
    })
    //cart Collection api
    app.delete('/carts/:id',async(req,res)=>{
      const id=req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    })
    app.get("/carts",verifyJWT,async(req,res)=>{
      const email=req.query.email;
      if(!email){
        res.send([])
      }
      const decodedEmail=req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error:true,message:'forbidden aceess'})
      }
        else{
          const query = { email: email };
        const cursor = await cartCollection.find(query).toArray()
        res.send(cursor)
        }
    })
    app.post('/carts',async(req,res)=>{
      const item=req.body;
      // console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.listen(port,()=>{
    console.log(`Bistro Boss listening on port ${port}`);
})