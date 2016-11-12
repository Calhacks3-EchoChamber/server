var express = require("express");
var app = express()
var Massive = require("massive");
var bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

var db = Massive.connectSync({db : "my_db"});
/***
tables:

users:
uid | # conversations | # Respect points | # Convince Points


Conversation:
conversation_id | topic_id | datetime | uid_1 (no)| uid_2 (yes) | P1_Convince | P1_Resp | P2_Convince | P2_Resp


Topic:
topic_ID | topic_heading | topic_body | total # conversations


Friends:
uid | friend_id
No primary key

***/

app.post("/user/login", function(req, res){
	var uid = req.body.uid;
	var name = req.body.name;
	var location = req.body.location;

	db.users.save([{"uid": uid}], function(err, res){
		if(err || !res){
			res.writeHead(400);
		}
		else{
			res.writeHead(200);
		}
		res.end();
	});
})

app.post("/conversation/new", function(req,res){
	var uid = req.body.uid;
	var topic = req.body.topic;
	var opinion = req.body.opinion;

	db.topics.find({"topic_name": topic, "opinion_id !=" : opinion}, function(err, result){
		if (err) return;
		if(!result){
			var conversation_id = Math.random().toString(36).slice(2);
			db.topics.save({"uid": uid, "topic_name":topic, "opinion_id":opinion, "conversation_id":convo_id}, function(err, res){
				if(err){
					console.log(err.stack);
					res.writeHead(500);
					res.end();
				}
				else{
					var body = "No Users Available";
					res.writeHead(404, {
						"Content-Length": Buffer.byteLength(body),
						"Content-Type":"text/plain"
					});
					res.end(body);
				}
			});
		}
		else{
			var match = result[0];
			db.topics.destroy({"conversation_id": match["conversation_id"]}, function(err, res){
				if(err){
					console.log("Error deleting data in conversation/new");
				}
			})
			var body = {
				"conversation_id":match["conversation_id"],
			};
			res.writeHead(200, {
				"Content-Length": Buffer.byteLength(body),
				"Content-Type":"text/plain"
			});
			res.end(JSON.stringify(body));
		}
	});
})


//Implement later??
app.post("/conversation/leave", function(req, res){
	var uid = req.body.uid;
	var conversation  = req.body.conversation;

})

app.get("/user/:uid/profile", function(req, res){
	var uid = req.params.uid;

	db.users.findOne({"uid":uid}, function(err, user){
		if(err || !user){
			var body = "User not found";
			res.writeHead(400, {
				"Content-Length":Buffer.byteLength(body),
				"Content-Type":"text/plain"
			});
			res.end(body);
		}
		else{
			var body = {
				//put info here
				"stars":100,
				"num_convos":30
			};
			res.writeHead(200, {
				"Content-Length":Buffer.byteLength(body),
				"Content-Type":"text/plain"
			});
			res.end(JSON.stringify(body));
		}
	});
})

app.get("/topics/trending", function(req, res){
		// db.topics.find(,{
		// 	columns: ["topic_name", //columns: ["topic_name", "number_conversations" ],
		// 	//order: "number_conversations desc",
		// 	order: db.count()
		// 	limit: 5
		// }
		db.run("SELECT topic_name, COUNT(*) FROM topics GROUP BY topic_name ORDER BY COUNT(*) DESC",
		function (err, trends) {
			if(err || !trends) {
		  		res.writeHead(400);
		  		res.end();
		  	}
		  	else {
		  		var body = trends.slice(0,5);//trends["topic_name"];//this is fucking wrong
		  		res.writeHead(200, {
		  		"Content-Length":Buffer.byteLength(body),
		  		"Content-Type":"text/plain"
		  		});
		  		res.end(JSON.stringify(body));
		  	}
	});
})

app.post("/topics/new", function(req, res){
	
})



var server = app.listen(8081, function(){
	var host = server.address().address
	var port = server.address().port
	console.log("Example app listening at http://%s:%s", host, port)
})