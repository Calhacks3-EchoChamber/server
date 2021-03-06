var express = require("express");
var app = express()
var path = require("path");
var massive = require("massive");
var bodyParser = require('body-parser')
var connectionString = "postgres://vffougnqvnzism:nkuWUDOJifOtnvKsRw--McEs7q@ec2-23-23-226-41.compute-1.amazonaws.com:5432/dbtua7m2hj3f1d?ssl=true";

// connect to Massive and get the db instance. You can safely use the
// convenience sync method here because its on app load
// you can also use loadSync - it's an alias
var massiveInstance = massive.connectSync({connectionString : connectionString});
// Set a reference to the massive instance on Express' app:
app.set('dbtua7m2hj3f1d', massiveInstance);
var db = app.get('dbtua7m2hj3f1d');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
/***
tables:

users:
uid | num_conversations | num_r_points | num_c_points


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
	db.users.find({uid}, function(err, data){
		if(err){
			console.log(err);
			res.status(400).end();
		}
		else if (data.length === 0) {
			db.users.insert([{"uid": uid, "num_conversations" :0, "num_r_points": 0, "num_c_points": 0}]);
			res.end();
		}
		else {
			res.end();
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
app.post("/conversation/new", function(req, res) {
	var uid = req.body.uid;
	var topic_id = req.body.topic_id;
	var opinion_id = req.body.opinion_id;
	if (opinion_id != 0 && opinion_id != 1) {
		return res.status(400).end("Invalid value for opinion_id");
	}

	var column_to_check = opinion_id == 0 ? "uid_1" : "uid_2";
	var column_to_write_zero = opinion_id == 1 ? "uid_1" : "uid_2";

	var search = { topic_id };
	search[column_to_check] = 0;
	db.conversations.find(search, function(err, data) {
		if (err) {
			return res.status(400).end();
		}

		if(!data || data.length === 0) {//couldn't find anyone who needs a conversation partner, puts a new row in the table
							 //and returns a random conversation_id
			var conversation_id = Math.random().toString(36).slice(2);
			var newConversation = {
				topic_id,
				conversation_id
			};
			newConversation[column_to_check] = uid;
			newConversation[column_to_write_zero] = 0;

			db.conversations.insert(newConversation, function(err, result){
				if (err){
					console.log(err.stack);
					res.status(400).end();
				} else {
					console.log("Result is " + result);
					res.status(201).json({ conversation_id });
				}
			});
		} else { //found someone who needs a conversation partner
			console.log("I found someone");
			var match = data[0];
			var search = {
				topic_id,
				conversation_id: match.conversation_id,
				datetime: Math.round(new Date().getTime() / 1000)
			};
			search[column_to_check] = uid;
			
			db.conversations.save(search, function(err, result){
				if (err){
					console.log("Error here " + err.stack);
					res.status(400).end();
				}
			});

			res.status(200).json({ conversation_id: match.conversation_id });

			console.log("Connected partners");
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
		db.conversations.find({"conversation_id": conversation_id}, function(err, data) {
			var p1 = data['uid_1'];
			topic_id = data['topic_id']
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

			var updated = {"conversation_id": conversation_id};
			updated[convince_colname] = convince;
			updated[resp_colname] = respect;

			db.conversations.save(updated,
				function(err, result) {
				if (err) {
					console.log(err.stack);
					console.log('error in updating conversation table')
					res.end();
				}
			});
		});
		// users:
		// uid | num_conversations | num_r_points | num_c_points
		db.users.find({"uid": other_id}, function(err, data) {
			var num_conversations = data['num_conversations'] + 1;
			var num_r_points = data['num_r_points'] + respect;
			var num_c_points = data['num_c_points'] + convince;
			db.users.save({"uid": other_id, "num_conversations": num_conversations, "num_c_points": num_c_points,
				"num_r_points": num_r_points}, function(err, response) {
				if (err) {
					console.log('error in updating user table');
					res.end();
				}
			});
		});
		// topics:
		// topic_ID | topic_heading | topic_body | total # conversations
		db.topics.find({"topic_id": topic_id}, function(err, data) {
			if (err) {
				console.log('error in finding topic');
				res.end();
			}
			num_conversations = data['num_conversations'] + 1;
			db.topics.save({"topic_id": topic_id, "num_conversations" : num_conversations}, function(err, put_response) {
				if (err) {
					console.log('error in updating topics');
					res.end();
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
	var uid = req.params.uid;

	db.conversations.where("uid_1=$1 OR uid_2=$2", [uid, uid], function(err, data){
		if(err){
			var body = "No archive found";
			console.log(body);
			res.status(404).send(body);
		}
		else{
			res.json(data);
		}
	});
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
			res.status(404).send(body);
		}
		else{
			var body = {
				"respectful_rating": (user["num_r_points"] / user["num_conversations"]),
				"convincing_rating": (user["num_c_points"] / user["num_conversations"])
			};
			res.json(body);
		}
	});
});
/*
/topics/trending
	Get
	Returns
		List the current trending topics
*/

app.get("/topics/trending", function(req, res){
		db.run("SELECT topic_name, COUNT(*) FROM topics GROUP BY topic_name ORDER BY COUNT(*) DESC",
		function (err, trends) {
			if(err || trends.length === 0) {
		  		res.status(400).end();
		  	}
		  	else {
		  		var body = trends.slice(0,5);//trends["topic_name"];//this is fucking wrong
		  		res.json(body);
		  	}
	});
})

/*
/topics/new
	Post
		topic_heading: short description of topic
		topic_body: longer description of topic
	Returns
		400 if already exists or failure, 200 if created sucessfully


	topics:
	topic_ID | topic_heading | topic_body | total # conversations
*/
app.post("/topics/new", function(req, res){
	var topic_id = Math.random().toString(36).slice(2);
	var topic_body = req.body.topic_body;
	var topic_heading = req.body.topic_heading;

	db.topics.find({"topic_body":topic_body, "topic_heading":topic_heading}, function(err, topic){
		if(err){
			res.status(400).end();
		}
		else if(topic.length > 0){
			console.log("Duplicate topic not added");
			res.status(400).send("Duplicate topic not added");
		}
		else{
			db.topics.insert({"topic_id":topic_id, "topic_body":topic_body,
				"topic_heading":topic_heading, "num_conversations":0}, function(err, created_topic){
					if(err || created_topic){
						res.status(400).end();
					}
					else{
						res.end();
					}
			});
		}
	});
})

app.get("/topics/list", function(req, res){
	var start_index = req.params.start;
	var end_index = req.params.end;
	if(end_index < start_index){
		res.status(400).end();
	}
	else{
		res.end();
	}
	db.products.find( {
			columns: ["topic_id", "topic_heading", "topic_body", "num_conversations"],
			order: "topic_heading incr",
			offset: start_index,
			limit: (end_index - start_index)
		}, function (err, topics) {
	  	if(err){
	  		res.status(400).end();
	  	}
	  	else{
	  		res.json(topics);
	  	}
	});
})



var server = app.listen(process.env.PORT, function(){
	var host = server.address().address
	var port = server.address().port
	console.log("Example app listening at http://%s:%s", host, port)
})