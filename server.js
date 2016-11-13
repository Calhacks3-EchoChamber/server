
var express = require("express");
var app = express();
// var Massive = require("massive");
var bodyParser = require("body-parser");

// var db = Massive.connectSync({db : "my_db"});

var urlencodedParser = bodyParser.urlencoded({extended:false})


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// app.post("/conversation/new", function(req,res){
// 	var user = req.body.user;
// 	var topic = req.body.topic;
// 	var opinion = req.body.opinion;

// 	db.topics.find({"topic_name": topic, "opinion_id !=" : opinion}, function(err, result){
// 		if(!result){
// 			var convo_id = Math.random().toString(36).slice(2);
// 			db.topics.save({"user_id": user, "topic_name":topic, "opinion_id":opinion, "conversation_id":convo_id}, function(err, res){
// 				if(err){
// 					console.log(err.stack);
// 					res.writeHead(500);
// 					res.end();
// 				}
// 				else{
// 					var body = "No Users Available";
// 					res.writeHead(404, {
// 						"Content-Length": Buffer.byteLength(body),
// 						"Content-Type":"text/plain"
// 					});
// 					res.end(body);
// 				}
// 			});
// 		}
// 		else{
// 			var match = result[0];
// 			db.topics.destroy({"conversation_id": match["conversation_id"]}, function(err, res){
// 				if(err){
// 					console.log("Error deleting data in conversation/new");
// 				}
// 			})
// 			var body = {
// 				"conversation_id":match["conversation_id"],
// 			};
// 			res.writeHead(200, {
// 				"Content-Length": Buffer.byteLength(body),
// 				"Content-Type":"text/plain"
// 			});
// 			res.end(JSON.stringify(body));
// 		}
// 	});
// })


// //Implement later??
// app.post("/conversation/leave", function(req, res){
// 	var user = req.body.user;
// 	var conversation  = req.body.conversation;
// })

// app.get("/user/:user_id/profile", function(req, res){
// 	var user_id = req.params.user_id;

// 	db.users.findOne({"user_id":user_id}, function(err, user){
// 		if(err || !user){
// 			var body = "User not found";
// 			res.writeHead(400, {
// 				"Content-Length":Buffer.byteLength(body),
// 				"Content-Type":"text/plain"
// 			});
// 			res.end(body);
// 		}
// 		else{
// 			var body = {
// 				//put info here
// 				"stars":100,
// 				"num_convos":30
// 			};
// 			res.writeHead(200, {
// 				"Content-Length":Buffer.byteLength(body),
// 				"Content-Type":"text/plain"
// 			});
// 			res.end(JSON.stringify(body));
// 		}
// 	});
// })

// app.post("/user/login", function(req, res){
// 	var user_id = req.body.user;
// 	db.users.save([{"user_id": user_id}], function(err, res){
// 		if(err || !res){
// 			res.writeHead(400);
// 		}
// 		else{
// 			res.writeHead(200);
// 		}
// 		res.end();
// 	});
// })

// app.get("/topics/trending", function(req, res){
// 		db.topics.find(, {
// 			columns: ["topic_name", "number_conversations" ],
// 			order: "number_conversations desc",
// 			limit: 5
// 		}, function (err, trends) {
// 	  // ten name/price/description objects, ordered by price high to low, skipping
// 	  // the twenty most expensive products
// 	  if(err || !trends){
// 	  	res.writeHead(400);
// 	  	res.end();
// 	  }
// 	  else{
// 	  	var body = trends["topic_name"];//this is fucking wrong
// 	  	res.writeHead(200, {
// 	  		"Content-Length":Buffer.byteLength(body),
// 	  		"Content-Type":"text/plain"
// 	  	});
// 	  	res.end(JSON.stringify(body));
// 	  }
// 	});
// })

// app.post("/topics/new", function(req, res){
	
// })


var server = app.listen(app.get('port'), function(){
	var host = server.address().address
	var port = server.address().port
	console.log("Example app listening at http://%s:%s", host, port)
})


