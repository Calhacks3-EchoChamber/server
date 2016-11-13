var express = require("express");
var app = express()
var Massive = require("massive");
var bodyParser = require('body-parser')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

var db = Massive.connectSync({db : "echo_db"});
/***
tables:

users:
uid | num_conversations | num_r_points | num_convince_points


conversations:
conversation_id | topic_id | datetime | uid_1 (no)| uid_2 (yes) | p1_convince | p1_resp | p2_convince | p2_resp

topics:
topic_ID | topic_heading | topic_body | total # conversations


friends:
uid | friend_id
No primary key

***/

/*
endpoint - /user/login
	Post
		-uid
	Returns
		-nothing
*/
app.post("/user/login", function(req, res){
	var uid = req.body.uid;
	db.users.find([{"uid": uid}], function(err, res){
		if(err){
			res.writeHead(400);
		}
		else if (!res) {
			db.user.insert([{"uid": uid, "num_conversations" :0, "num_r_points": 0, "num_convince_points": 0}]);
			res.writeHead(200)
		}
		else {
			res.writeHead(200);
		}
		res.end();
	});
})

/*
/conversation/new
	Post
		uid: id of user requesting
		topic_id: topic id
		opinion_id: binary 0, 1
	Returns
		conversation_id
		Returns 200 if user is found
		Returns 404 if no user found to chat with
		Returns 500 if error occured
*/
app.post("/conversation/new", function(req,res){
	var uid = req.body.uid;
	var topic_id = req.body.topic_id;
	var opinion_id = req.body.opinion_id;
	var column_to_check = null;
	if (opinion_id === 0) {
		column_to_check = "uid_1";
	}
	else if (opinion_id === 1) {
		column_to_check = "uid_2";
	}
	else {
		var body = "Invalid value for opinion_id";
		res.writeHead(404);
		res.end(body);
	}
	db.conversations.find({"topic_id": topic_id, column_to_check: 0}, function(err, res){
		if (err) {
			res.writeHead(400);
			res.end(body);
		}
		if(!res){//couldn't find anyone who needs a conversation partner, puts a new row in the table and returns a random conversation_id
			var conversation_id = Math.random().toString(36).slice(2);
			db.conversations.save({"uid": uid, "topic_id":topic_id, "opinion_id":opinion_id, "conversation_id":conversation_id}, function(err, res){
				if(err){
					console.log(err.stack);
					res.writeHead(500);
					res.end();
				}
				else {
					var body = {
						"conversation_id":conversation_id
					};
					res.writeHead(404, {
						"Content-Length": Buffer.byteLength(body),
						"Content-Type":"text/plain"
					});
					res.end(JSON.stringify(body));
				}
			});
		}
		else { //found someone who needs a conversation partner
			var match = res[0];
			var body = {
				"conversation_id":match["conversation_id"]
			};
			res.writeHead(200, {
				"Content-Length": Buffer.byteLength(body),
				"Content-Type":"text/plain"
			});
			res.end(JSON.stringify(body));
		}
	});
})


/*
	/conversation/leave
		If receives -1, removes conversation_id from conversation table
		Post
			uid: id of user leaving
			conversation_id: id of conversation to leave 
			respect: x (out of 10, -1 if doesn’t count)
			convince: y (-1 if doesn’t count)
		Returns
			Nothing
*/
app.post("/conversation/leave", function(req, res){
	var uid = req.body.uid;
	var conversation_id  = req.body.conversation_id;
	var respect = req.body.respect;
	var convince = req.body.convince;
	var other_id = null;
	var topic_id = null;
	if (respect === -1 || convince === -1) {
		db.conversations.destroy({"conversation_id": conversation_id});
		res.end();
	}
	else {
		// conversations:
		// conversation_id | topic_id | datetime | uid_1 (no)| uid_2 (yes) | p1_convince | p1_resp | p2_convince | p2_resp
		db.conversations.find({"conversation_id": conversation_id}, function(err, res) {
			var p1 = res['uid_1'];
			if (uid === p1) { //update the other person's column for how convincing and respectful they were
				var convince_colname = "p2_convince";
				var resp_colname = "p2_resp";
				other_id = p2;
			} 
			else {
				var convince_colname = "p1_convince";
				var resp_colname = "p1_resp";
				other_id = p1;				
			}
			db.conversations.save({"conversation_id": conversation_id, convince_colname: convince, resp_colname: respect}, function(err, res) {
				if (err || !other_id) {
					console.log('error in updating conversation table')
					res.end();
				}
			});	
		});
		// users:
		// uid | num_conversations | num_r_points | num_convince_points
		db.users.find({"uid": other_id}, function(err, res) {
			var num_conversations = res['num_conversations'] + 1;
			var num_r_points = res['num_r_points'] + respect;
			var num_c_points = res['num_c_points'] + convince;
			db.users.save({"uid": other_id, "num_conversations": num_conversations, "num_c_points": num_c_points, "num_r_points": num_r_points}, function(err, res) {
				if (err || !topic_id) {
					console.log('error in updating user table');
					res.end();
				}
			});	
		});
		// topics:
		// topic_ID | topic_heading | topic_body | total # conversations
		db.topics.find({"topic_id": topic_id}, function(err, res) {
			if (err) {
				console.log('error in finding topic');
			}
			num_conversations = res['num_conversations'] + 1;
			db.topics.save({"topic_id": topic_id, "num_conversations" : num_conversations}, function(err, res) {
				if (err) {
					console.log('error in updating topics');
				}
			});

		});
	}

});
/*
/conversation/archive
	Get
		uid
	Returns
		List of conversation_id
*/
app.get("/conversation/archive", function(req, res) {
});


/*
/user/:uid/profile/
	Get
		uid
	Returns
		the user with user id = *user id* profile information
		Respectful rating
		Convincing rating
*/

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
/*
/topics/trending
	Get
	Returns
		List the current trending topics
*/

app.get("/topics/trending", function(req, res){
		// db.topics.find(,{
		// 	columns: ["topic_name", //columns: ["topic_name", "number_conversations" ],
		// 	//order: "number_conversations desc",
		// 	order: db.count()
		// 	limit: 5
		// }
		db.topics.run("SELECT topic_name, COUNT(*) FROM topics GROUP BY topic_name ORDER BY COUNT(*) DESC",
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

/*
/topics/new
	Post
		topic: description of topic (the question)
		proAnswer: agree/yes (what yes response will be)
		negAnswer: disagree/no (what no response will be)
	Returns
		Whether topic was created successfully or not
*/
app.post("/topics/new", function(req, res){
	
})



var server = app.listen(8081, function(){
	var host = server.address().address
	var port = server.address().port
	console.log("Example app listening at http://%s:%s", host, port)
})