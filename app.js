const Discord = require("discord.js");
const client = new Discord.Client();
const token = require("./settings.json").token;
const fs = require("fs");

//Following are all the help command txt's as variables.
const infoTXT = fs.readFileSync("commands/info.txt", "utf8");
const commandsTXT = fs.readFileSync("commands/commands.txt", "utf8");
const deleteRaidTXT = fs.readFileSync("commands/deleteRaid.txt", "utf8");
const listRaidsTXT = fs.readFileSync("commands/listRaids.txt", "utf8");
const newRaidTXT = fs.readFileSync("commands/newRaid.txt", "utf8");
const raidAddTXT = fs.readFileSync("commands/raidAdd.txt", "utf8");
const raidFillTXT = fs.readFileSync("commands/raidFill.txt", "utf8");
const raidReservesTXT = fs.readFileSync("commands/raidReserves.txt", "utf8");
const raidRemoveTXT = fs.readFileSync("commands/raidRemove.txt", "utf8");
const raidSetupTXT = fs.readFileSync("commands/raidSetup.txt", "utf8");

let raidData = JSON.parse(fs.readFileSync("./raidData.json", "utf8"));
/* Ideas for future versions:
- Make raidSetup function restrict who's allowed to signup based on an additional argument 
ex. permission = everyone/officers/guildmembers.

- Set channel option

*/

client.on("ready",() => {
	console.log(new Date + "\nI\'m Online\nI\'m Online")
});

var prefix = "~" //This is the prefix for executing bot commands

client.on("message", message => {
	let args = message.content.split(" ").slice(1); // returns an array with string arguments who were separated by space.
	argsResult = args.join(" "); //concatinates the args Array

	if(!message.content.startsWith(prefix)) return; //If message doesn't contain the bot prefix, the bot ignores the message

	if(message.author.bot) return; //Ignore other bots

	if(message.channel.type === "dm") return; //Ignore DM channels.


	//Secret test
	if(message.content.startsWith(prefix + "test")) {
		console.log("Testing...");
	} else

	if(message.content.startsWith(prefix + "cookie")) {
		message.channel.send(message.author + ", thank you for the :cookie:\n Much appreciated :smiley:");
	} else


	
	if(message.content.startsWith(prefix + "info")) {
		/*------------------------------ INFO ------------------------------

		Prints out info message.
		*/
		message.channel.send(infoTXT);
	}


	
	if (message.content.startsWith(prefix + "help")) { 	
		/* ------------------------------ HELP ------------------------------
		@param (args[0] = command) 		STRING

		Lists all commands, or in depth explanation of specific commands.
		*/	
		switch (args[0]) {

			case "deleteRaid":
				message.channel.send(deleteRaidTXT);
				break;

			case "listRaids":
				message.channel.send(listRaidsTXT);
				break;

			case "newRaid":
				message.channel.send(newRaidTXT);
				break;

			case "raidAdd":
				message.channel.send(raidAddTXT);
				break;

			case "raidFill":
				message.channel.send(raidFillTXT);
				break;

			case "raidReserves":
				message.channel.send(raidReservesTXT);
				break;

			case "raidRemove":
				message.channel.send(raidRemoveTXT);
				break;

			case "raidSetup":
				message.channel.send(raidSetupTXT);
				break;

			default:
				message.channel.send(commandsTXT);
		}
	} else


	
	if(message.content.startsWith(prefix + "raidAdd")) {
		/* ------------------------------ RAIDADD ------------------------------
		@param (args[0] = raidName) 		STRING
		@param (args[1] = roleIndex) 		INT
		@param (args[2] = roleDescription) 	STRING
		@param (args[3] = discordName) 		STRING (optional)

		Add author of message or user to the raidSignup:
		*/
		var raid = raidExists(args[0]);
		if(!(raid || (raid === 0))) {
			message.channel.send("There currently is no signup for this raid: " + args[0]);
			return;
		}
		raid = raidData[args[0]];

		if(!RaidSetupInMessageChannel(message.channel.id, raidData[args[0]])) {
			message.channel.send("\'" + args[0] + "\' is not setup in this channel.\n" + 
				"Go to \'" + client.channels.get(raidData[args[0]].channel) + "\' for the right channel.");
			return;
		}

		message.channel.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {
			if(!CanFindAndManageUser(message, args[3])) { //Is messageAuthor allowed to add 
				return; //other users and is it a valid username?
			}
			var userAlreadySigned = UserAlreadySignedReport(message, raid, args[3]);

			switch (true) { //Is user already signed up?

				case (userAlreadySigned[0] === 0): //If user is signed up to reserves
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
						args[0] + "\' as a reserve.");
					return;

				case (userAlreadySigned[0] === 1): //If user is signed up in list
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
						args[0] + "\' at a specified spot or as fill.");
					return;
			}

			if(raid.rolesAvailable.length === 0) {
				message.channel.send(message.author + ", I'm sorry I couldn't sign you up, as there are no more spots left.\n" +
					"Sign up as a reserve using \'~raidReserves " + raid.name + "\', or ask an officer to open up another raid.");
				return;
			}

			if(isNaN(parseInt(args[1])) || ((parseInt(args[1]) < 1) || (parseInt(args[1]) > 10))){
				message.channel.send(message.author + ", \'" + args[1] + "\' is not a valid spot.\n" +
					"Spot should be of type integer between 1 to 10. ~help raidAdd");
				return;
			}

			SetSourceVertex(raid.signUpGraph, [parseInt(args[1])], userAlreadySigned[1], args[2]);
			BFS(raid.signUpGraph, raid.signUpGraph[0]);

			var switchVertex = EmptySpotReachable(raid.signUpGraph, raid.rolesAvailable);
			if(switchVertex) {
				PlaceSourceInList(raid.signUpGraph, switchVertex);
				raid.rolesAvailable.splice(raid.rolesAvailable.indexOf(switchVertex.spot), 1);
				UpdateJSON();

				fetchedMsg.edit(RaidSetupMessage(raid));
				message.channel.send(userAlreadySigned[1] + ", I've signed you up for spot #" + args[1] 
					+ " in \'" + raid.name + "\'.");
			} else {
				SetSourceVertex(raid.signUpGraph, [0], "", "");
				UpdateJSON();
				message.channel.send(userAlreadySigned[1] + ", I'm sorry. I couldn't sign you up for spot #" + args[1] + " in \'" +
					raid.name + "\', as it's currently taken.");
			}
		}).catch(err =>{console.log("RaidAdd:\n" + err)});
	} else


	
	if(message.content.startsWith(prefix + "raidFill")) {
		/* ------------------------------ RAIDFILL ------------------------------
		@param (args[0] = raidName) 		STRING
		@param (args[>0] = discordName) 	STRING (atleast 1)

		Add author of message to the raidSignup as fill:
		*/
		var raid = raidExists(args[0]);
		if(!(raid || (raid === 0))) {
			message.channel.send("There currently is no signup for this raid: " + args[0]);
			return;
		}
		raid = raidData[args[0]];

		if(!RaidSetupInMessageChannel(message.channel.id, raidData[args[0]])) {
			message.channel.send("\'" + args[0] + "\' is not setup in this channel.\n" + 
				"Go to \'" + client.channels.get(raidData[args[0]].channel) + "\' for the right channel.");
			return;
		}

		message.channel.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {
			var userAlreadySigned = UserAlreadySignedReport(message, raid, false);

			switch (true) { //Is user already signed up?

				case (userAlreadySigned[0] === 0): //If user is signed up to reserves
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
						args[0] + "\' as a reserve.");
					return;

				case (userAlreadySigned[0] === 1): //If user is signed up in list
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
						args[0] + "\' at a specified spot or as fill.");
					return;
			}

			if(raid.rolesAvailable.length === 0) {
				message.channel.send(message.author + ", I'm sorry I couldn't sign you up, as there are no more spots left.\n" +
					"Sign up as a reserve using \'~raidReserves " + raid.name + "\', or ask an officer to open up another raid.");
				return;
			}

			//var stringIntervals = args.slice(1);
			var stringIntervals = args[1].split("+");
			console.log(args[1]);
			console.log(stringIntervals);

			if(!stringIntervals || stringIntervals.length === 0) {
				message.channel.send("Please add intervals/spots you'd like to fill.");
				return;
			}

			stringIntervals = (IntervalStringsToIntervals(stringIntervals));

			if(typeof(stringIntervals) === "string") {
				message.channel.send("\'" + stringIntervals + "\' is not a valid interval.\n" +
					"Examples of valid intervals: [1-3], [6], chrono, druid, ps, dps, all\n" +
					"~help raidFill");
				return;
			}

			stringIntervals = (IntervalsToFullNumbers(stringIntervals));

			var backToIntervalStrings = NumbersArrayToIntervalString(stringIntervals);

			SetSourceVertex(raid.signUpGraph, stringIntervals,
				userAlreadySigned[1].toString(), backToIntervalStrings);

			BFS(raid.signUpGraph, raid.signUpGraph[0]);

			var switchVertex = EmptySpotReachable(raid.signUpGraph, raid.rolesAvailable);
			if(switchVertex) {
				PlaceSourceInList(raid.signUpGraph, switchVertex);
				raid.rolesAvailable.splice(raid.rolesAvailable.indexOf(switchVertex.spot), 1);
				UpdateJSON();

				fetchedMsg.edit(RaidSetupMessage(raid));
				message.channel.send(userAlreadySigned[1] + ", I've signed you up in \'" + raid.name + 
					"\', as fill for spots: " + backToIntervalStrings);
			} else {
				SetSourceVertex(raid.signUpGraph, [0], "", "");
				UpdateJSON();
				message.channel.send(userAlreadySigned[1] + ", I'm sorry. I couldn't sign you up in \'" + raid.name + 
					"\', as fill for spots: (" + backToIntervalStrings + "), as they're currently taken.");
			}
		}).catch(err => {console.log(err)});
	}


	
	if(message.content.startsWith(prefix + "raidReserves")) {
		/* ------------------------------ RAIDRESERVE ------------------------------
		@param (args[0] = raidName) 		STRING
		@param (args[1] = discordName) 		STRING (optional)

		Add author of message to the raidSignup as reserve:
		*/
		var raid = raidExists(args[0]);
		if(!(raid || (raid === 0))) {
			message.channel.send("There currently is no signup for this raid: " + args[0]);
			return;
		}
		raid = raidData[args[0]];

		if(!RaidSetupInMessageChannel(message.channel.id, raidData[args[0]])) {
			message.channel.send("\'" + args[0] + "\' is not setup in this channel.\n" + 
				"Go to \'" + client.channels.get(raidData[args[0]].channel) + "\' for the right channel.");
			return;
		}

		message.channel.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {
			if(!CanFindAndManageUser(message, args[1])) { //Is messageAuthor allowed to add 
				return; //other users and is it a valid username?
			}
			var userAlreadySigned = UserAlreadySignedReport(message, raid, args[1]);

			switch (true) { //Is user already signed up?

				case (userAlreadySigned[0] === 0): //If user is signed up to reserves
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
						args[0] + "\' as a reserve.");
					return;

				case (userAlreadySigned[0] === 1): //If user is signed up in list
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
						args[0] + "\' at a specified spot or as a fill.");
					return;
			}

			raid.reserves.push(userAlreadySigned[1].toString());
			UpdateJSON();
			fetchedMsg.edit(RaidSetupMessage(raid));
			message.channel.send(userAlreadySigned[1] + ", I've added you to \'" + raid.name + "\' as a reserve.")

		}).catch(err =>{console.log("raidReserves:\n" + err)});
	} else


	
	if(message.content.startsWith(prefix + "raidRemove")) {
		/* ------------------------------ RAIDREMOVE ------------------------------
		@param (args[0] = raidName) 		STRING
		@param (args[1] = discordName) 		STRING (optional)

		Remove author of message from raidSignUp:
		*/
		var raid = raidExists(args[0]);
		if(!(raid || (raid === 0))) { //Does raid exist?
			message.channel.send("There currently is no signup for this raid: " + args[0]);
			return; //If no, stop.
		}
		raid = raidData[args[0]];


		if(!RaidSetupInMessageChannel(message.channel.id, raidData[args[0]])) {
			message.channel.send("\'" + args[0] + "\' is not setup in this channel.\n" + 
				"Go to \'" + client.channels.get(raidData[args[0]].channel) + "\' for the right channel.");
			return;
		}

		message.channel.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {

			if(!CanFindAndManageUser(message, args[1])) { //Is messageAuthor allowed to add 
				return; //other users and is it a valid username?
			}

			var userAlreadySigned = UserAlreadySignedReport(message, raid, args[1]);

			if(userAlreadySigned[0] === 2) {
				message.channel.send("User, " + userAlreadySigned[1] + " is not signed up for \'" + raid.name + "\'.");
				return;
			}

			switch (true) { //Is user already signed up?

				case (userAlreadySigned[0] === 0): //If user is signed up for reserves
					raid.reserves.splice(userAlreadySigned[2], 1);
					UpdateJSON();
					fetchedMsg.edit(RaidSetupMessage(raid));
					message.channel.send(userAlreadySigned[1] + ", I've removed you from reserves in \'" + raid.name + "\'.");
					return;

				case (userAlreadySigned[0] === 1): //If user is signed up as a reserves
					raid.signUpGraph[userAlreadySigned[2]] = new Vertex(userAlreadySigned[2], [userAlreadySigned[2]]);
					raid.rolesAvailable.push(userAlreadySigned[2]);
					raid.rolesAvailable.sort(numberSort);
					UpdateJSON();
					fetchedMsg.edit(RaidSetupMessage(raid));
					message.channel.send(userAlreadySigned[1] + ", I've removed you from spot #" + userAlreadySigned[2] + " in \'" + raid.name + "\'.");
					return;

			}

		}).catch(err =>{console.log("raidRemove:\n" + err)});
	} else



	if(message.content.startsWith(prefix + "raidSetup")) {
		/* ------------------------------ RAIDSETUP ------------------------------
		@param (args[0] = raidName) 		STRING
		@param (args[1] = day)		 		STRING
		@param (args[2] = date)		 		STRING
		@param (args[3] = time) 			STRING
		@param (args[4] = timezone) 		STRING


		Set up a raidSetup message inside the channel, deleting previous message.
		*/
		//First permission is checked:
		if(!HigherPermission(message.member)) {
			message.channel.send(message.author + ", you don't have permission to run this command.");
		}
		var raid = raidExists(args[0]);
		if(!(raid || (raid === 0))) { //Does raid exist?
			message.channel.send("The raid \'" + args[0] + "\' hasn't yet been initialized.");
			return; //If no, stop.
		}

		if(!RaidSetupInMessageChannel(message.channel.id, raidData[args[0]])) { //Right channel?
			message.channel.send("\'" + args[0] + "\' is not setup in this channel.\n" + 
				"Go to \'" + client.channels.get(raidData[args[0]].channel) + "\' for the right channel.");
			return;
		}

		if(args.length < 5) {
			message.channel.send("Please fill in 5 arguments (raid, day, date, time, timezone). \nArguments are separated by spaces\n" +
				"Example: trainingRaid Saturday 24/12 8pm CEST");
			return;

		} 

		if(raidData[args[0]].channel && raidData[args[0]].currentSignupMsg) { //Delete previous signup message.
			client.channels.get(raidData[args[0]].channel)
				.fetchMessage(raidData[args[0]].currentSignupMsg).then(fetchedMsg => {
					message.channel.send("Deleting previous raidSignUp message from channel \'" + 
						client.channels.get(raidData[args[0]].channel) + "\'.")
				fetchedMsg.delete();
				}).catch(err =>{console.log("raidSetup, deletePrevFetchedMsg:\n" + err)});
		}

		//Make a new raid with given inputs, and all slots empty
		raidData[args[0]].day = args[1];
		raidData[args[0]].date = args[2];
		raidData[args[0]].time = args[3];
		raidData[args[0]].timezone = args[4];
		raidData[args[0]].rolesAvailable = [1,2,3,4,5,6,7,8,9,10];
		raidData[args[0]].signUpGraph = new SignUpGraph();
		raidData[args[0]].reserves = [];
		UpdateJSON();

		message.channel.send(RaidSetupMessage(raidData[args[0]])).then((msg, msgs) => {
			raidData[args[0]].currentSignupMsg = msg.id;
			raidData[args[0]].channel = msg.channel.id;
			msg.pin();
			UpdateJSON();
		}).catch(err =>{console.log("raidSetup, sendMessage:\n" + err)});
	} else



	if(message.content.startsWith(prefix + "newRaid")) {
		/* ------------------------------ NEWRAID ------------------------------
		@param (args[0] = raidName) 		STRING

		Adds a new raid to available raids, @the channel the command was posted in.	
		*/
		if(!HigherPermission(message.member)) { //Does message author have permission?
			message.channel.send(message.author + ", you don't have permission for this command.");
			return;
		}

		if(!raidData["availableRaids"]) raidData["availableRaids"] = { //If availableRaids doesn't exist
			//Initialize with blank data
			raids: []
		};
		UpdateJSON();

		if(!args[0]) {
			message.channel.send(message.author + ", please add the argument \'name\'. \n" +
				"Example: " + prefix + "newRaid trainingRaid" );
			return;
		}
		if(raidExists(args[0]) === 0 || raidExists(args[0])) {
			message.channel.send("The raid: \'" + args[0] + "\', already exists.")
			return;
		}
		raidData["availableRaids"].raids.push(args[0]);

		raidData[args[0]] = {
			//Initialize the new raid with blank data
			name: args[0],
			day: "",
			date: "",
			time: "",
			timezone: "",
			rolesAvailable: [],
			signUpGraph: [],
			reserves: [],
			currentSignupMsg: "",
			channel: message.channel.id
		};

		UpdateJSON();
		message.channel.send(message.author + ", I've added \'" + args[0] + "\' to available raids.");
	} else


	
	if(message.content.startsWith(prefix + "deleteRaid")) {
		/* ------------------------------ DELETERAID ------------------------------
		@param (args[0] = raidName) 		STRING
		
		Deletes a raid, given it exists in availableRaids.
		*/
		if(!HigherPermission(message.member)) {
			message.channel.send(message.author + ", you don't have permission for this command.");
			return;
		}
		if(!args[0]) {
			message.channel.send(message.author + ", please add the argument \'name\'. \n" +
				"Example: " + prefix + "deleteRaid trainingRaid" );
			return;
		}

		var raidToDelete = raidExists(args[0]);		

		if(raidToDelete === 0 || raidToDelete) {
			raidData["availableRaids"].raids.splice(raidToDelete, 1);

			if(raidData[args[0]].currentSignupMsg) { //If there is a signUpMsg, then delete it
				client.channels.get(raidData[args[0]].channel)
					.fetchMessage(raidData[args[0]].currentSignupMsg).then(fetchedMsg => {
						fetchedMsg.delete();//Get channel=>message=>delete it
					}).catch(error => {
						console.error(error);
					});
					 
			}

			delete raidData[args[0]];
			UpdateJSON();
			message.channel.send("Deleting SignUp message for \'" + args[0] + "\'.");
			message.channel.send(message.author + ", I've deleted \'" + args[0] + "\' from available raids.")
			return;
		} else {
			message.channel.send("The raid \'" + args[0] + "\' doesn't exist.");
		}
	} else


	
	if(message.content.startsWith(prefix + "listRaids")) {
		/* ------------------------------ LISTRAIDS ------------------------------
	
		Lists all raids available to setup.
		*/
		if(raidData["availableRaids"].raids.length === 0) {
			message.channel.send("There are currently no available raids.");
			return;
		}
		message.channel.send("Available raids are: " + raidData["availableRaids"].raids.join(", ") + ".");
	}
		
});

client.login(token); 
/* 
Login with bot token.
Can generate a new token @ https://discordapp.com/developers/applications/me ,
or create a new bot, by choosing "New App".

Make sure to update the token inside /settings.json
*/





/**************************************************************************************
***************************************************************************************
*************************  Below are some helping functions  **************************
***************************************************************************************
***************************************************************************************/

//Roles with higher permissions in an array as Strings
const highRoles = ["Idiotic Leader", "Officers", "Master of Coin"]; 



function UserInSignUpReserves(userToString, raid) {
	/* ------------------------------ USERINSIGNUPRESERVE ------------------------------
	@Param userToString DISCORDJS.USER.TOSTRING: String representation of a discord user.
	@Param raid JSON.OBJECT: Pass the object raidData[raidName] from raidData.json.

	@Return result INT: (true) Index of found user in raid.reserves.
	@Return result BOOLEAN: false.

	Iterates the raid.reserves elements in the raid object, searching for the user. If the user
	is found, the index is returned. If not, false is returned.
	*/
	for(var i = 0; i < raid.reserves.length; i++) {
		if(raid.reserves[i].indexOf(userToString) !== -1) {
			return i; //If user is in raid.reserves list return index i 
		}
	}
	return false; //If user was not found in raid.reserves return false
}


function UserInSignUpList(userToString, raid) {
	for (var i = 1; i < raid.signUpGraph.length; i++) {
		if(raid.signUpGraph[i].discordID === userToString) {
			return i; //If user is in the signUpGraph list return index i 
		}
	}
	return false; //If user was not found in signUpGraph list return false
}


function UserAlreadySignedReport(message, raid, username) {
	/* ----------------------- USERALREADYSIGNEDUPREPORT ------------------------
	@Param message DISCORDJS.MESSAGE: Pass the message that prompted the command.
	@Param raid JSON.OBJECT: Pass the object raidData[raidName] from raidData.json.
	@Param username STRING: Pass a valid name or nothing.

	@Return resultTrueArray ARRAY[roleOrReserve, DISCORDJS.USER, roleOrReserveIndex]: 
	Array values depend on if user was in roles or reserve, the user passed, and the index
	the user was found at in roles or reserves.
	@Return resultFalseArray ARRAY[userNotFound=2, DISCORDJS.USER]:
	 
	Checks whether the username passed or the message author is already signed up
	as taking a role or being a reserve in the raid. If the passed user is found in raid.roles, it will
	be indicated by 0. If passed user is found in raid.reserves, it will be indicated by 1.
	If passed user is not found, it will be indicated by 2, and the index will not be passed.
	*/
	var userToAdd = SelfOrAnotherUser(message, username).toString();
	var userAlreadyInReserves = UserInSignUpReserves(userToAdd, raid);
	var userAlreadyInList = UserInSignUpList(userToAdd, raid);

	if(userAlreadyInReserves || userAlreadyInReserves === 0) {
		return [0, userToAdd, userAlreadyInReserves];
	}
	if(userAlreadyInList || userAlreadyInList === 0) {
		return [1, userToAdd, userAlreadyInList]
	}

	return [2, userToAdd];
}


function raidExists(raidName) {
	/* ------------------------------ RAIDEXISTS ------------------------------
	@Param member DISCORDJS.USER: Pass the author of the message that prompted the command.

	@Return result BOOLEAN: true/false, depending on role of the member.

	If the member has 1 of the high roles, true is returned. If not, false is returned.
	*/
	for(var i = 0; i < raidData["availableRaids"].raids.length; i++) {
		if(raidData["availableRaids"].raids[i] === (raidName)) {
			return i;
		}
	}
	return false;
}


function HigherPermission(member) {
	/* ------------------------------ HIGHERPERMISSION ------------------------------
	@Param member DISCORDJS.USER: Pass the author of the message that prompted the command.

	@Return result BOOLEAN: true/false, depending on role of the member.

	If the member has 1 of the high roles, true is returned. If not, false is returned.
	*/
	if(member.roles.some(r => highRoles.includes(r.name))){
		return true; //If member is 1 of the high roles (higher permission), return true
	} else {
		return false; //if not return false.
	}
}


function CanFindAndManageUser(message, username) {
	/* ------------------------------ CANFINDANDMANAGEUSER ------------------------------
	@Param message DISCORDJS.MESSAGE: Pass the message that prompted the command.
	@Param username STRING: Pass a name.

	@Return result BOOLEAN: true/false, depending on permission and username validity.

	 
	1. If the message author doesn't have the permission, the author is told in a 
		chat message, and false is returned.
	2. If the username is invalid/not found, the author is told in a chat message, and
		false is returned.
	3. If the message author have the permission and the username is valid, true is returned.
	*/
	if(!UserExists(username)) {
		if(!HigherPermission(message.member)) {
			message.channel.send(message.author + ", you don't have permission to manage other users.");
			return false;
		}
		message.channel.send(message.author + ", I can't find the user named: \'" + username + "\'.");
		return false;
	}
	return true;
}


function UserExists (username) {
	/* ------------------------------ USEREXISTS ------------------------------
	@Param username STRING|UNDEFINED: Pass a name or nothing.

	@Return result BOOLEAN: true/false depending on username exists.

	If the username is not undefined (an argument is passed), and the user still can't 
	be found on the server, false is returned. Otherwise it returns true.

	Note: this function returns true even though no argument is passed. This is to help
	maintaining "overloaded" commands for ex. raidAdd, so highRoles also can signup
	themselves, without having to pass their own name as argument. (May not be the best way
	to do this, but w/e).
	*/
	if(username !== undefined && client.users.find("username", username) === null) {
		return false;
	}

	return true;
}


function SelfOrAnotherUser(message, username) {
	/* ------------------------------ SELFORANOTHERUSER ------------------------------
	@Param message DISCORDJS.MESSAGE: Pass the message that prompted the command.
	@Param username STRING: Pass a valid discord name from the server.

	@Return selfOrAnotherUser DISCORDJS.USER: ToString representation of a DiscordJS user.

	If the message author has the permission, and the username is valid, 
	the User.ToString corresponding to the username will be returned. Otherwise the
	message author will be returned.
	*/
	if((message.member.roles.some(r => highRoles.includes(r.name))) && username) {
		var selfOrAnotherUser = client.users.find("username", username).toString();
	} else {
		var selfOrAnotherUser = message.author;
	}
	return selfOrAnotherUser;
}


function RaidSetupMessage(raid) {
	/* ------------------------------ RAIDSETUPMESSAGE ------------------------------
	@Param raid JSON.OBJECT: Pass the object raidData[raidName] from raidData.json.

	@Return result STRING: A String representation of a raidSetup.

	Inserts info from the raid object into a String template.
	*/
	return ("raidSetup: " + raid.name + " \n" +
		"\@everyone \n" +
		raid.day + " " + raid.date + " " + raid.time + " " + raid.timezone + "\n" +
		"1. Chronotank \n" +
		raid.signUpGraph[1].discordID + " " + raid.signUpGraph[1].flavorText + "\n \n" +

		"2. Support Chrono \n" + 
		raid.signUpGraph[2].discordID + " " + raid.signUpGraph[2].flavorText + "\n \n" +

		"3. Druid \n" + 
		raid.signUpGraph[3].discordID + " " + raid.signUpGraph[3].flavorText + "\n \n" +

		"4. Druid \n" + 
		raid.signUpGraph[4].discordID + " " + raid.signUpGraph[4].flavorText + "\n \n" +

		"5. PS \n" + 
		raid.signUpGraph[5].discordID + " " + raid.signUpGraph[5].flavorText + "\n \n" +

		"6. PS \n" + 
		raid.signUpGraph[6].discordID + " " + raid.signUpGraph[6].flavorText + "\n \n" +

		"7. DPS/Condi DPS \n" + 
		raid.signUpGraph[7].discordID + " " + raid.signUpGraph[7].flavorText + "\n \n" +

		"8. DPS/Condi DPS \n" + 
		raid.signUpGraph[8].discordID + " " + raid.signUpGraph[8].flavorText + "\n \n" +

		"9. DPS/Condi DPS \n" + 
		raid.signUpGraph[9].discordID + " " + raid.signUpGraph[9].flavorText + "\n \n" + 

		"10. DPS/Condi DPS \n" + 
		raid.signUpGraph[10].discordID + " " + raid.signUpGraph[10].flavorText + "\n \n" +

		"Reserves:" +
		RaidReservesToString(raid) + "\n \n" +

		"The list has been reset, so please tell me whatever role you'd like to fill! \n \n" +

		"If you're not familiar with the bosses please take a look at the guides in #raid-guides. I hope to see you all. Happy raiding!" + 
		"\n(To sign up use the raidAdd command. Example \'~raidAdd " + raid.name + " 5 CPS\')");
}


function RaidReservesToString(raid){
	/* ------------------------------ RAIDRESERVESTOSTRING ------------------------------
	@Param raid JSON.OBJECT: Pass the object raidData[raidName] from raidData.json.

	@Return result STRING: A String representation of raid.reserves.

	Iterates the raid.reserves data in the raid object adding each element as a string 
	representation.
	*/
	var resultString = "";

	for(var i = 0; i < raid.reserves.length; i++) {
		resultString += "\n" + raid.reserves[i]
	}

	return resultString;
}

function RaidSetupInMessageChannel(channelID, raid) {
	//Returns true if the raidSetup message was 
	if(channelID === raid.channel) {
		return true;
	} else {
		return false;
	}
}

function UpdateJSON() {
	/* ----------------------------- UPDATEJSON ------------------------------

	Writes/updates the changes to raidData.json.
	*/
	fs.writeFile("./raidData.json", JSON.stringify(raidData), (err) => {
		if (err) console.error(err); //log errors
	});
}


/**************************************************************************************
***************************************************************************************
*********************  CODE RELATED TO GRAPH DATASTRUCTURE  ***************************
***************************************************************************************
***************************************************************************************/

function numberSort(a, b) {
    return a - b;
};
/*


Interval parsing from strings


*/
//Turns "chrono", "druid", "ps", "dps", "all" => [1,2], [3,4], [5,6], [7,10], [1,10]
function DefinedInterval(definedInterval) {
	definedInterval = definedInterval.toLowerCase();
	switch (definedInterval) {
		case "chrono":
			return [1,2];
			break;

		case "uba":
			return [2];
			break;

		case "druid":
			return [3,4];
			break;

		case "ps":
			return [5,6];
			break;

		case "dps":
			return [7,10];
			break;

		case "any":
			return [1,10];
			break;

		case "all":
			return [1,10];
			break;

		default:
			return false;
	}
}

//Turns "[1,5]" => [1, 5]
function AddInterval(intervalString) {
	var intervalNumbers = [];

	if(intervalString.length > 2){
		return false;
	}
	if(!parseInt(intervalString[0]) || !parseInt(intervalString[intervalString.length-1])) {
		return false;
	}
	if(parseInt(intervalString[0]) > parseInt(intervalString[intervalString.length-1])) {
		return false;
	}
	if(parseInt(intervalString[0]) > 10) {
		return false;
	}
	if(parseInt(intervalString[0]) < 1) {
		return false;
	}
	if(parseInt(intervalString[intervalString.length-1]) > 10) {
		return false;
	}
	if(parseInt(intervalString[intervalString.length-1]) < 1) {
		return false;
	}

	for(var i = parseInt(intervalString[0]); i <= parseInt(intervalString[intervalString.length-1]); i++) {
		if(!intervalNumbers) {
			intervalNumbers = [i];
		} else {
			intervalNumbers.push(i);
		}
	}

	return intervalNumbers;
}

//Turns "[7-10]" or "dps" => [7,10] 
function IntervalStringsToIntervals(intervalStrings){
	var intervals = [];
	for(var i = 0; i < intervalStrings.length; i++) {
		if(DefinedInterval(intervalStrings[i])) {
			intervals.push(DefinedInterval(intervalStrings[i]));
		} else if(AddInterval(intervalStrings[i].slice(1,-1).split("-"))){
			intervals.push(AddInterval(intervalStrings[i].slice(1,-1).split("-")));
		} else {
			return intervalStrings[i];
		}
	}
	return intervals;
}

//Turns [1, 1, 2, 3, 4, 4, 5] => [1, 2, 3, 4, 5]
function RemoveDuplicates(numbersArray) {
	var numbersArrayNoDuplicates = [];

	for(var i = 0; i < numbersArray.length; i++) {
		if(numbersArray[i] !== numbersArray[i+1]) {
			numbersArrayNoDuplicates.push(numbersArray[i]);
		}
	}

	return numbersArrayNoDuplicates;
}

//Turns [1, 3] => [1, 2, 3]
function IntervalToFullNumber(interval) {
	var fullNumber = [interval[0]];
	for (var i = interval[0]; i <= interval[interval.length-1]; i++) {
		fullNumber.push(i);
	}
	return fullNumber;
}

//Turns [[7, 10], [5, 8]] => [7, 8, 9, 10, 5, 6, 7, 8] => [5, 6, 7, 8, 9, 10]
function IntervalsToFullNumbers(intervals) {
	if(!AddInterval(intervals[0])) { //Is it a valid interval?
		return intervals[0];
	}

	var fullNumbers = IntervalToFullNumber(intervals[0]);
	for(var i = 1; i < intervals.length; i++) {
		fullNumbers = fullNumbers.concat(IntervalToFullNumber(intervals[i]));//Concatinate all interval arrays
	}

	fullNumbers.sort(numberSort); // Sort the numbers to prepare for removing duplicates.
	fullNumbers = RemoveDuplicates(fullNumbers); //Remove duplicates

	return fullNumbers;
}

//Turns [1, 2, 3, 4, 5] => "[1-5]"
function NumbersArrayToIntervalString(numbersArrayNoDuplicates) {
	var intervalString = "";
	var x = 0;
	var y = x;

	for(var i = 0; i < numbersArrayNoDuplicates.length; i++) {
		if((numbersArrayNoDuplicates[i+1]-numbersArrayNoDuplicates[i]) !== 1) {
			if(x === y) {
				intervalString += "[" + numbersArrayNoDuplicates[x] + "], ";
			} else {
				intervalString += "[" + numbersArrayNoDuplicates[x] + "-" + numbersArrayNoDuplicates[y] + "], ";
			}
			x = i+1;
			y = x 
		} else {
			y = i+1;
		}
	}

	return intervalString.slice(0,-2);
}

function Intersect(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
        return b.indexOf(e) !== -1;
    });
}

/*


Graph creation and manipulation


*/
//Own implementation
function Vertex(spot, adjecentEdges) { 
	this.spot = spot;
	this.discordID = "";
	this.flavorText = "";
	this.adjecentEdges = adjecentEdges;
	this.color = null;
	this.distance = Infinity;
	this.parent = null;
}

//Own graph implementation specific to signUpList problem
function SignUpGraph() {
	var graph = [new Vertex(0, [0])];
	for(var i = 1; i < 11; i++) {
		graph.push(new Vertex(i, [i]));
	}
	return graph;
}

function SetSourceVertex(Graph, adjEdges, id, text) {
	Graph[0].adjecentEdges = adjEdges;
	Graph[0].discordID = id;
	Graph[0].flavorText = text;
}

//[CLRS] 22.2, page 595, Pseudo code implementation
function BFS(Graph, source) { 
	for(var i = 1; i < (Graph.length); i++) {
		Graph[i].color = "white";
		Graph[i].distance = Infinity;
		Graph[i].parent = null;
	}

	source.color = "gray";
	source.distance = 0;
	source.parent = null;

	var queue = new Queue();
	queue.Enqueue(source);

	while(!queue.IsEmpty()) {
		var u = queue.Dequeue(); //Vertex u is the next element in the Queue
		for (var i = 0; i < u.adjecentEdges.length; i++) {
			if(Graph[(u.adjecentEdges[i])].color === "white") {
				Graph[(u.adjecentEdges[i])].color = "gray";
				Graph[(u.adjecentEdges[i])].distance = (u.distance + 1);
				Graph[(u.adjecentEdges[i])].parent = u.spot;
				queue.Enqueue(Graph[(u.adjecentEdges[i])]);
			}
		}
		u.color = "black"
	}
}

function EmptySpotReachable(Graph, emptySpots) {
	for (var i = 0; i < emptySpots.length; i++) {
		if(Graph[Graph[emptySpots[i]].parent]) {
			return Graph[emptySpots[i]];
		}
	}
	return false;
}

function CopyVertexInfo(v1, v2) {
	v2.discordID = v1.discordID;
	v2.flavorText = v1.flavorText;
	v2.adjecentEdges = v1.adjecentEdges;
}

function PlaceSourceInList(Graph, emptySpotWithinReach){
	if(emptySpotWithinReach.parent === null) {
		SetSourceVertex(Graph, [0], "", "");
		return;
	}

	CopyVertexInfo(Graph[emptySpotWithinReach.parent], emptySpotWithinReach);
	PlaceSourceInList(Graph, Graph[emptySpotWithinReach.parent]);
	return;
}

/*


Queue creation and manipulation


*/


function Queue() {
	this.head = 0;
	this.tail = 0;
	this.qArray = [undefined, undefined, undefined, undefined, undefined,
		undefined, undefined, undefined, undefined, undefined]; 
		//We will at most have 10 vertices in our queue
}

Queue.prototype.Enqueue = function(x) {
	if(this.IsFull()) {
		throw new Error("Queue overflow. \n" +
			"Head: " + this.head + ", Tail: " + this.tail + ", qLength: " + this.qArray.length);
	}

	this.qArray[this.tail] = x;
	if(this.tail === this.length) {
		this.tail = 0;
	} else {
		this.tail++;
	}
}

Queue.prototype.Dequeue = function() {
	if(this.IsEmpty()) {
		throw new Error("Queue underflow. \n" +
			"Head: " + this.head + ", Tail: " + this.tail + ", qLength: " + this.qArray.length);
	}

	x = this.qArray[this.head];
	if(this.head === this.length) {
		this.head = 0;
	} else {
		this.head++;
	}
	return x;
}

Queue.prototype.IsFull = function() {
	if((this.head === (this.tail + 1)) || 
		((this.head === 0) && (this.tail === this.qArray.length))) {
		return true;
	} else {
		return false;
	}
}

Queue.prototype.IsEmpty = function() {
	if(this.head === this.tail) {
		return true;
	} else {
		return false;
	}
}

/**************************************************************************************
***************************************************************************************
*************************  TESTING - CODE IN PRODUCTION  ******************************
***************************************************************************************
***************************************************************************************/


/*
node -e 'require("./app.js").test()'
*/
module.exports.test = function () {

};
