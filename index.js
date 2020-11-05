var express = require('express')
var nodemailer = require('nodemailer');
var firebase = require("firebase/app");
require("firebase/database");
require('dotenv').config()




//Initialize Firebase
var firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    databaseURL: process.env.databaseURL,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId,
  };

firebase.initializeApp(firebaseConfig);
var database = firebase.database();


//Email Transporter
var transporter = nodemailer.createTransport({
    service: process.env.service,
    auth: {
      user: process.env.user,
      pass: process.env.pass
    }
  });
  

var app = express()

app.get('/hello', function(req, res){
    res.json({hello: process.env.pass})
})

//getPledgeInfo API
app.get('/getPledgeInfo/:id', function(req, res){
    var ref = database.ref("pledges");
    ref.on("value", function(snapshot) {
        var idObject = snapshot.val()[req.params.id];
        if (!!idObject){
            res.json({blurb: idObject["blurb"], description: idObject["description"], id: req.params.id, img_url: idObject["img_url"], pledge_count: idObject["pledge_count"], pledge_goal: idObject["pledge_goal"], title: idObject["title"] })
        }
        else{
            res.json({error: "id is not defined"})
        }
      }, function (errorObject) {
        res.json({error: "the read failed " + errorObject.code});
      });
})

//submitTransaction //post with firstname, lastname, email, pledgeID; 
app.post('/submitTransaction/:firstName/:lastName/:email/:pledge_id', function(req, res){
    var firstName = req.params.firstName;
    var lastName = req.params.lastName;
    var email = req.params.email;
    var pledge_id = req.params.pledge_id;

    //1 use transaction to iterate pledge count
    var upvotesRef = database.ref("pledges/" + pledge_id + "/pledge_count");
    upvotesRef.transaction(function (current_value) {
        return (current_value || 0) + 1;
    });
    
    var postsRef = database.ref("pledges/" + pledge_id + "/transactions");  

    //3 Push transaction record to ref
    var newTransaction = postsRef.push({
        firstName: firstName,
        lastName: lastName,
        email: email
      });

    //2 check if pledge count met - if so, then email folks 
    //just assume that pledge met;
    if (true){
        postsRef.on("value", function(snapshot) {
            var idObject = snapshot.val()
            for (var transaction of Object.keys(idObject)){
                var email = idObject[transaction]["email"];
                console.log(email)
                var message = "hi " + idObject[transaction][firstName] + " we hit our goal."
                sendMessage(email, message);
            }
            res.json({transaction_id: newTransaction.key});
        })
    }
    else{
        //return something
        res.json({transaction_id: newTransaction.key});
    }
})

//GET TRANSACTION INFO
app.get('/getTransactionInfo/:pledge_id/:transaction_id', function(req, res){
    var pledge_id = req.params.pledge_id;
    var transaction_id = req.params.transaction_id;
    var ref = database.ref("pledges/" +  pledge_id);

    ref.on("value", function(snapshot) {

        var idObject = snapshot.val()["transactions"][transaction_id];
        if (!!idObject){
            res.json({first_name: idObject["firstName"], last_name: idObject["lastName"], email: idObject["email"], pledge_id: pledge_id })
        }
        else{
            res.json({error: "transaction id is not defined"})
        }
      }, function (errorObject) {
        res.json({error: "the read failed " + errorObject.code});
      });
})



function sendMessage(toEmail, message){
    var mailOptions = {
        from: 'chrisbarnes01@live.com',
        to: toEmail,
        subject: 'Your Thunderpledge Update',
        text: message
      };


    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

app.listen(3000)



