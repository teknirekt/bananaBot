const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");

//From settings.json:
const token = require("./settings.json").token; //Bot's unique token, found at https://discordapp.com/developers/applications/me
const prefix = require("./settings.json").prefix; //The command prefix to avoid accidentally calling commands through regular chatting.
const botOwner = require("./settings.json").botOwner; //The discordID of the owner of the bot (The one who deploys the bot).
	//Example of roles inside settings.json: "highRoles":["Idiotic Leader", "Officers", "Master of Coin"]
	//Notice: Roles are arrays where the elements are the roleNames as strings
const highRoles = require("./settings.json").highRoles; //The roles within your discord server of higher order (ex. officers and leaders).
const coreMembers = require("./settings.json").coreMembers; //The role of your core raid team (if any).
const guildMembers = require("./settings.json").guildMembers; //All roles assigned to members of your guild.
const logChannel = require("./settings.json").logChannel; //The channel where you want to log sign up messages upon removal.
const keywordRoles = require("./settings.json").keywordRoles;
const roleNames = require("./settings.json").roleNames;

let raidData = JSON.parse(fs.readFileSync("./raidData.json", "utf8"));

client.on("ready",() => {
	console.log(new Date + "\nI\'m Online\nI\'m Online")
});

 //This is the prefix for executing bot commands

client.on("message", message => {
	let args = message.content.split(" ").slice(1); // returns an array with string arguments who were separated by space.
	let command = message.content.split(" ")[0];

	if(!message.content.startsWith(prefix)) return; //If message doesn't contain the bot prefix, the bot ignores the message

	if(message.author.bot) return; //Ignore other bots

	if(message.channel.type === "dm") return; //Ignore DM channels.


	//Secret test
	if(compareStringsLowerCase(command, (prefix + "test"))) {
		console.log("Testing...");
	} else

	if(compareStringsLowerCase(command, (prefix + "cookie"))) {
		message.channel.send(message.author + ", thank you for the :cookie:\n Much appreciated :smiley:");
	} else

	if(compareStringsLowerCase(command, (prefix + "info"))) {
		/*------------------------------ INFO ------------------------------

		Prints out info message.
		*/
		message.channel.send("```" + fs.readFileSync("commands/info.txt", "utf8") + "```");
	} else 
	
	if (compareStringsLowerCase(command, (prefix + "help"))) { 	
		/* ------------------------------ HELP ------------------------------
		@param (args[0] = command) 		STRING

		Lists all commands, or in depth explanation of specific commands.
		*/	
		switch (args[0].toLowerCase()) {

			case "deleteraid":
				message.channel.send("```" + fs.readFileSync("commands/deletRaid.txt", "utf8") + "```");
				break;

			case "listraids":
				message.channel.send("```" + fs.readFileSync("commands/listRaids.txt", "utf8") + "```");
				break;

			case "newraid":
				message.channel.send("```" + fs.readFileSync("commands/newRaid.txt", "utf8") + "```");
				break;

			case "raidfill":
				message.channel.send("```" + fs.readFileSync("commands/raidFill.txt", "utf8") + "\n" + raidFillHelpMessage() + "```");
				break;

			case "raidreserves":
				message.channel.send("```" + fs.readFileSync("commands/raidReserves.txt", "utf8") + "```");
				break;

			case "raidremove":
				message.channel.send("```" + fs.readFileSync("commands/raidRemove.txt", "utf8") + "```");
				break;

			case "raidsetup":
				message.channel.send("```" + fs.readFileSync("commands/raidSetup.txt", "utf8") + "```");
				break;

			case "setrl":
				message.channel.send("```" + fs.readFileSync("commands/setRL.txt", "utf8") + "```");
				break;

			case "clearrl":
				message.channel.send("```" + fs.readFileSync("commands/clearRL.txt", "utf8") + "```");
				break;

			case "clearsum":
				message.channel.send("```" + fs.readFileSync("commands/clearSUM.txt", "utf8") + "```");
				break;

			default:
				message.channel.send("```" + fs.readFileSync("commands/commands.txt", "utf8") + "```");
		}
	} else

	if(compareStringsLowerCase(command, (prefix + "intervals"))) {
		var resultString = ""
		for (var i = 0; i < keywordRoles.length; i++) {
			resultString += "\'" + keywordRoles[i][0] + "\', ";
		}
		resultString = resultString.slice(0, -2);
		message.channel.send("List of keyword intervals:\n" + resultString + ".");
	} else 

	/*

	
	Commands regarding signing up for raids.


	*/
	
	if(compareStringsLowerCase(command, (prefix + "raidFill"))) {
		/* RAIDFILL 
		@param (args[0] = raidName) 	STRING
		@param (args[1] = intervals) 	INTERVAL (atleast 1)
		@param (args[2] = discordName)	STRING (optional)

		Add author of message/user to the raidSignup as fill:
		*/

		//Checks if the raid exists. If not, end the command w/ helpful message.

		if(args.length !== 2 && args.length !== 3) {

			//If message author is an officer
			if(HigherPermission(message.member)) {
				message.channel.send(message.author + ", raidFill requires 2-3 arguments.\nraidFill(raidName, intervals, discordName(optional)).");
			} else {

				message.channel.send(message.author + ", raidFill requires 2 arguments.\nraidFill(raidName, intervals).");
			}
			return;
		} else if (args.length === 3 && !HigherPermission(message.member)){
				message.channel.send(message.author + ", raidFill requires 2 arguments.\nraidFill(raidName, intervals).");
				return;
		}

		var raid = CheckRaidExists(message, args[0]); //Either false or an index
		if(!raid) {
			return;
		}

		//Checks whether the raid was initiated in the channel the command was called. If not, tell user which channel the raid is in.
		if(!CheckInRightChannel(message, raid)) {
			return;
		}

		//Checks if user is permitted to signup. If not, return.
		if(!CheckAllowedRoles(message, raid)) {
			return;
		}

		//Check if raid registration is active for raid.
		if(raid.currentSignupMsg === "") {
			message.channel.send(message.author + ", registration for the raid \'" + raid.name + "\' isn't active.");
			return;
		}

		message.channel.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {

			//Is message author allowed to add other users and is it a valid username?
			if(!CanFindAndManageUser(message, args[2])) { 
				return;
			}

			//Find out whether message author should be passed on, or the username from the argument (If any).
			var userAlreadySigned = UserAlreadySignedReport(message, raid, args[2]);

			//Checks if user is already signed up. If yes, return and tell the user.
			if(!CheckUserAlreadySigned(message, raid, userAlreadySigned)) {
				return;
			}

			//Checks if there are any spots left in the list/graph. If not, tell user.
			if(!CheckAnySpotsLeft(message, raid)) {
				return;
			}

			//Places intervals in args[1] into an array with each interval being a seperate element.
			var stringIntervals = args[1].split("+");

			//If there aren't any given any intervals, tell user and return.
			if(!stringIntervals || stringIntervals.length === 0) {
				message.channel.send("Please add intervals/spots you'd like to fill.");
				return;
			}

			//For all elements in stringIntervals, turn valid intervals("[7-10]" or "dps") => [7,10], find a nonvalid returns a string.
			stringIntervals = (IntervalStringsToIntervals(stringIntervals));

			//If interval is invalid (a string), tell user which exact interval was invalid and return.
			if(typeof(stringIntervals) === "string") {
				message.channel.send("\'" + stringIntervals + "\' is not a valid interval.\n" +
					"Examples of valid intervals: [1-3], [6], " + keywordRoles[0][0] + ", " + keywordRoles[2][0] + ", " + keywordRoles[3][0] + ", " + keywordRoles[4][0] + ", " + keywordRoles[5][0] + ", " + keywordRoles[6][0] + "\n" +
					"" + prefix + "help raidFill");
				return;
			}

			//Turns [[7, 10], [5, 8]] => [7, 8, 9, 10, 5, 6, 7, 8] => [5, 6, 7, 8, 9, 10] (Each number in all intervals only appearing once.)
			stringIntervals = (IntervalsToFullNumbers(stringIntervals));

			//Turns [1, 2, 3, 4, 5] => "[1-5]"
			var backToIntervalStrings = NumbersArrayToIntervalString(stringIntervals);



			//Placing user in spot #0, adding additional info to the vertice, about which spots user tries to fill.
			SetSourceVertex(raid.signUpGraph, stringIntervals,
				userAlreadySigned[1].toString(), backToIntervalStrings);

			//Using BFS to try and find a path from spot 0 (source vertex) to an empty spot vertex (empty spots = rolesAvailable).
			BFS(raid.signUpGraph, raid.signUpGraph[0]);

			//Sets a switchVertex to being either the empty spot vertex, or false if none exists.
			var switchVertex = EmptySpotReachable(raid.signUpGraph, raid.rolesAvailable);

			//Checks whether or not an empty spot vertex was found (switchVertex = false if not).
			if(switchVertex) {
				
				//If yes, move everyone on the path one step towards the empty spot, making the wanted spot the new empty spot, which
					//then can be replaced by the user wanted to sign up (vertex #0). Vertex #0 is then reset to empty values. 
				PlaceSourceInList(raid.signUpGraph, switchVertex);

				//Remove the switchVertex(the empty spot initially found using BFS) spot# from empty spots list (rolesAvailable.
				raid.rolesAvailable.splice(raid.rolesAvailable.indexOf(switchVertex.spot), 1);

				//Write to database file
				UpdateJSON();

				//Update sign up message, mentioning the user in the first available spot(1st argument), followed by the flavor text = intervals as strings.
				fetchedMsg.edit(RaidSetupMessage(raid));

				//Tell user they're put on the sign up, and where they're placed.
				message.channel.send(userAlreadySigned[1] + ", I've signed you up in \'" + raid.name + 
					"\', as fill for spots: " + backToIntervalStrings);
			} else {

				//If a path to an empty spot can't be found, reset spot #0 (source vertex).
				SetSourceVertex(raid.signUpGraph, [0], "", "");

				//Write to JSON file.
				UpdateJSON();

				//Notice user that the bot couldn't find an available spot.
				message.channel.send(userAlreadySigned[1] + ", I'm sorry. I couldn't sign you up in \'" + raid.name + 
					"\', as fill for spots: (" + backToIntervalStrings + "), as they're currently taken.");
			}
		}).catch(err => {console.log(err)});
	} else
	
	if(compareStringsLowerCase(command, (prefix + "raidReserves"))) {
		/* RAIDRESERVE
		@param (args[0] = raidName) 		STRING
		@param (args[1] = discordName) 		STRING (optional)

		Add author of message to the raidSignup as reserve:
		*/

		if(args.length !== 1 && args.length !== 2) {

			//If message author is an officer
			if(HigherPermission(message.member)) {
				message.channel.send(message.author + ", raidReserves requires 1 or 2 arguments.\nraidReserves(raidName, discordName(optional)).");
			} else {
				message.channel.send(message.author + ", raidReserves requires 1 argument.\nraidReserves(raidName).");
			}
			return;
		}   else if (args.length === 2 && !HigherPermission(message.member)){
				message.channel.send(message.author + ", raidReserves requires 1 argument.\nraidReserves(raidName).");
				return;
		}

		//Checks if the raid exists. If not, end the command w/ helpful message.
		var raid = CheckRaidExists(message, args[0]); //Either false or an index
		if(!raid) {
			return;
		}

		//Checks whether the raid was initiated in the channel the command was called. If not, tell user which channel the raid is in.
		if(!CheckInRightChannel(message, raid)) {
			return;
		}

		//Checks if user is permitted to signup. If not, return.
		if(!CheckAllowedRoles(message, raid)) {
			return;
		}
		
		//Check if raid registration is active for raid.
		if(raid.currentSignupMsg === "") {
			message.channel.send(message.author + ", registration for the raid \'" + raid.name + "\' isn't active.");
			return;
		}

		//Grab the sign up message
		message.channel.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {

			//Is message author allowed to add other users and is it a valid username?
			if(!CanFindAndManageUser(message, args[1])) { 
				return;
			}

			//Find out whether message author should be passed on, or the username from the argument (If any).
			var userAlreadySigned = UserAlreadySignedReport(message, raid, args[1]);

			//Checks if user is already signed up. If yes, return and tell the user.
			if(!CheckUserAlreadySigned(message, raid, userAlreadySigned)) {
				return;
			}

			//Push user onto reserve list
			raid.reserves.push(userAlreadySigned[1].toString());

			//Update database
			UpdateJSON();

			//Updates sign up message, mentioning user down in 'Reserves:'.
			fetchedMsg.edit(RaidSetupMessage(raid));

			//Tell user they're put on the sign up, and where they're placed.
			message.channel.send(userAlreadySigned[1] + ", I've added you to \'" + raid.name + "\' as a reserve.")

		}).catch(err =>{console.log("raidReserves:\n" + err)});
	} else

	if(compareStringsLowerCase(command, (prefix + "raidRemove"))) {
		/* RAIDREMOVE 
		@param (args[0] = raidName) 		STRING
		@param (args[1] = discordName) 		STRING (optional)

		Remove author of message from raidSignUp:
		*/

		if(args.length !== 1 && args.length !== 2) {

			//If message author is an officer
			if(HigherPermission(message.member)) {
				message.channel.send(message.author + ", raidRemove requires 1 or 2 arguments.\nraidRemove(raidName, discordName(optional)).");
			} else {
				message.channel.send(message.author + ", raidRemove requires 1 argument.\nraidRemove(raidName).");
			}
			return;
		} else if (args.length === 2 && !HigherPermission(message.member)){
				message.channel.send(message.author + ", raidRemove requires 1 argument.\nraidRemove(raidName).");
				return;
		}

		//Checks if the raid exists. If not, end the command w/ helpful message.
		var raid = CheckRaidExists(message, args[0]); //Either false or an index
		if(!raid) {
			return;
		}

		//Checks whether the raid was initiated in the channel the command was called. If not, tell user which channel the raid is in.
		if(!CheckInRightChannel(message, raid)) {
			return;
		}

		//Check if raid registration is active for raid.
		if(raid.currentSignupMsg === "") {
			message.channel.send(message.author + ", registration for the raid \'" + raid.name + "\' isn't active.");
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

	if(compareStringsLowerCase(command, (prefix + "raidSetup"))) {
		/* RAIDSETUP 
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
			return;
		}

		//Checking if the user added enough arguments. If not, tell user and return.
		if(args.length !== 5) {
			message.channel.send("raidFill requires 5 arguments: (raid, day, date, time, timezone). \nArguments are separated by spaces\n" +
				"Example: trainingRaid Saturday 24/12 8pm CEST");
			return;

		} 
		
		//Checks if the raid exists. If not, end the command w/ helpful message.
		var raid = CheckRaidExists(message, args[0]); //Either false or an index
		if(!raid) {
			return;
		}

		//Checks whether the raid was initiated in the channel the command was called. If not, tell user which channel the raid is in.
		if(!CheckInRightChannel(message, raid)) {
			return;
		}

		//If the raid has a sign up message prior to the command call find it, and delete it.
		if(raid.channel && raid.currentSignupMsg) { //Delete previous signup message.
			client.channels.get(raid.channel)
				.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {
        
        			//Tell user that the previous message gets deleted.
					message.channel.send("Deleting previous raidSignUp message for \'" + raid.name + "\' from channel \'" + 
						client.channels.get(raid.channel) + "\'.");
					//Log the message into the console before it's deleted.
					LogPreviousSignUpToLogChannel(raid, fetchedMsg);
					fetchedMsg.delete();
				}).catch(err =>{console.log("raidSetup, deletePrevFetchedMsg:\n" + err)});
		}

		//Make a new raid with given inputs, and all slots empty
		raid.day = args[1];
		raid.date = args[2];
		raid.time = args[3];
		raid.timezone = args[4];
		raid.rolesAvailable = [1,2,3,4,5,6,7,8,9,10];
		raid.signUpGraph = new SignUpGraph();
		raid.reserves = [];
		UpdateJSON();

		//Send the sign up message in the channel, set it as current msg and pin it.
		message.channel.send(RaidSetupMessage(raid)).then((msg, msgs) => {
			raid.currentSignupMsg = msg.id;
			raid.channel = msg.channel.id;
			msg.pin();
			UpdateJSON();
		}).catch(err =>{console.log("raidSetup, sendMessage:\n" + err)});
	} else

	if(compareStringsLowerCase(command, (prefix + "setRL"))) {
		/* SETRL 
		@param (args[0] = raidName) 		STRING
		@param (args[1] = discordName) 		STRING(optional)
		
		Set raid leader of the raid, to be either message author/discordName.
		*/
		
		//Check if user is allowed to set a raid leader.
		if(!HigherPermission(message.member)) {
			message.channel.send(message.author + ", you don't have permission to run this command.");
			return;
		}

		//Check amount of arguments passed
		if(args.length !== 1 && args.length !== 2) {
			message.channel.send(message.author + " setRL requires 1-2 arguments.\nsetRL(raidName, discordName(optional))");
			return;
		}

		//Checks if the raid exists. If not, end the command w/ helpful message.
		var raid = CheckRaidExists(message, args[0]); //Either false or an index
		if(!raid) {
			return;
		}

		//Checks whether the raid was initiated in the channel the command was called. If not, tell user which channel the raid is in.
		if(!CheckInRightChannel(message, raid)) {
			return;
		}

		//If a username is passed (2nd argument), and the user can't be found. Tell user and return.
		if(args[1] && !UserExists(args[1])) {
			message.channel.send(message.author + ", I can't find user: " + args[1]);
			return;
		}

		//Determine whether or not the message author or a user passed through argument is to be raid leader.
		//Will always be the 2nd argument, if 2nd argument exists and is a valid username.
		var userToAdd = SelfOrAnotherUser(message, args[1]);

		//Set raidleader
		raid.raidLeader = userToAdd.toString();
		UpdateJSON();

		//If there's a current sign up message, update it with new info. If not, do nothing.
		if(raid.currentSignupMsg !== "") {
			message.channel.fetchMessage(raid.currentSignupMsg)
				.then(fetchedMsg => {
					fetchedMsg.edit(RaidSetupMessage(raid));
			});
		}

		//Say in chat, that a new raid leader has been set.
		message.channel.send("I've set " + raid.raidLeader + " as raid leader for \'" +
			raid.name + "\'.");
	} else 

	if(compareStringsLowerCase(command, (prefix + "clearRL"))) {
		/* CLEARRL 
		@param (args[0] = raidName) 		STRING
		
		Set raidleader to "None".
		*/

		//Check if user is allowed to clear raid leader.
		if(!HigherPermission(message.member)) {
			message.channel.send(message.author + ", you don't have permission to run this command.");
			return;
		}

		//Check amount of arguments passed
		if(args.length !== 1) {
			message.channel.send(message.author + " clearRL requires 1 argument.\nclearRL(raidName)");
			return;
		}
		
		//Checks if the raid exists. If not, end the command w/ helpful message.
		var raid = CheckRaidExists(message, args[0]); //Either false or an index
		if(!raid) {
			return;
		}

		//Checks whether the raid was initiated in the channel the command was called. If not, tell user which channel the raid is in.
		if(!CheckInRightChannel(message, raid)) {
			return;
		}

		//Clear raid leader
		raid.raidLeader = "None";
		UpdateJSON();

		//If there's a current sign up msg, update it with the new info, if not do nothing.
		if(raid.currentSignupMsg !== "") {
			message.channel.fetchMessage(raid.currentSignupMsg)
				.then(fetchedMsg => {
					fetchedMsg.edit(RaidSetupMessage(raid));
			});
		}

		//Tell chat that you cleared the raid leader.
		message.channel.send("I've cleared the raid leader for \'" + raid.name + "\'.");
	} else

	if(compareStringsLowerCase(command, (prefix + "clearSUM"))) {
		/* CLEARSUM 
		@param (args[0] = raidName) 		STRING
	
		Deletes the sign up message of the raid, and logs it to logChannel, if the channel exists.
		*/

		//First permission is checked:
		if(!HigherPermission(message.member)) {
			message.channel.send(message.author + ", you don't have permission to run this command.");
			return;
		}
		
		//Check if the right amount of arguments
		if(args.length !== 1) {
			message.channel.send(message.author + "clearSUM requires 1 argument\nclearSUM(raidName)")
			return;
		}

		//Checks if the raid exists. If not, end the command w/ helpful message.
		var raid = CheckRaidExists(message, args[0]); //Either false or an index
		if(!raid) {
			return;
		}

		//Checks whether the raid was initiated in the channel the command was called. If not, tell user which channel the raid is in.
		if(!CheckInRightChannel(message, raid)) {
			return;
		}

		//If the raid has a sign up message prior to the command call find it, and delete it.
		if(raid.currentSignupMsg !== "") { //Delete previous signup message.
			client.channels.get(raid.channel)
				.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {
        
        			//Tell user that the previous message gets deleted.
					message.channel.send("Deleting active raidSignUp message for \'" + raid.name + "\' from channel \'" + client.channels.get(raid.channel) + "\'.");

					//Log the message into the logChannel before it's deleted.
					LogPreviousSignUpToLogChannel(raid, fetchedMsg);
					fetchedMsg.delete();

					//set currentSignupMsg to the empty string = sign up inactive
					raid.currentSignupMsg = "";
					UpdateJSON();
				}).catch(err =>{console.log("clearSUM, deletePrevFetchedMsg:\n" + err)});
		} else {
			message.channel.send(message.author + ", there was no active sign up for \'" + raid.name + "\'.");
			return;
		}
	} else

	/*


	Commands regarding creation of new raids.


	*/

	if(compareStringsLowerCase(command, (prefix + "newRaid"))) {
		/* NEWRAID 
		@param (args[0] = raidName) 		STRING
		@param (args[1] = permission)		STRING (optional)	

		Adds a new raid to available raids, @the channel the command was posted in.	
		*/

		//Check if user is allowed to create new raids.
		if(!HigherPermission(message.member)) {
			message.channel.send(message.author + ", you don't have permission for this command.");
			return;
		}

		//Check amount of arguments
		if(args.length !== 1 && args.length !== 2) {
			message.channel.send(message.author + ", newRaid requires 1-2 arguments.\nnewRaid(raidName, permission(optional))");
			return;
		}

		//If availableRaids doesn't exist, initialize it with blank data
		if(!raidData["availableRaids"]) raidData["availableRaids"] = { 
			raids: []
		};
		UpdateJSON();


		//Check if the raid already exists, if it does tell user and return.
		if(raidExists(args[0]) === 0 || raidExists(args[0])) {
			message.channel.send("The raid: \'" + args[0] + "\', already exists.")
			return;
		}

		//Add the raidName to available raids.
		raidData["availableRaids"].raids.push(args[0]);

		//Set permissions based on whether 3 argument is core/guild/nothing
		var permissions = ParseStringToRolesStringArray(args[1]);

		//If no 2nd argument was passed/2nd argument couldn't be identified, set permission to everyone.
		if(!permissions) {
			permissions = ["everyone"];
		}

		//Initialize the new raid with blank data
		raidData[args[0]] = {
			name: args[0],
			day: "",
			date: "",
			time: "",
			timezone: "",
			rolesAvailable: [],
			signUpGraph: [],
			reserves: [],
			currentSignupMsg: "",
			channel: message.channel.id,
			allowedRoles: permissions,
			raidLeader: "None"
		};
		UpdateJSON();

		//Tell user the raid was setup, and what options the user have chosen for the raid.
		message.channel.send(message.author + ", I've added \'" + args[0] + "\' to available raids." +
			"\nThe raid is setup in this channel, \'" + client.channels.get(message.channel.id) + "\'." + 
			"\nPeople who are able to join: " + (raidData[args[0]].allowedRoles.join(", ")));
	} else

	if(compareStringsLowerCase(command, (prefix + "deleteRaid"))) {
		/* DELETERAID 
		@param (args[0] = raidName) 		STRING
		
		Deletes a raid, given it exists in availableRaids.
		*/

		//Checks if user is allowed to delete raids.
		if(!HigherPermission(message.member)) {
			message.channel.send(message.author + ", you don't have permission for this command.");
			return;
		}

		//Check amount of arguments
		if(args.length !== 1) {
			message.channel.send(message.author + ", deleteRaid requires 1 arguments.\ndeleteRaid(raidName, permission(optional))");
			return;
		}

		//raidExist returns index of raid if raid exists and false if raid was not found.
		var raidToDelete = raidExists(args[0]);		

		//Check whether the raid exists or not
		if(raidToDelete === 0 || raidToDelete) {
			//If yes, delete 
			raidData["availableRaids"].raids.splice(raidToDelete, 1);

			//If it had a message setup, delete the message and log it in console.
			if(raidData[args[0]].currentSignupMsg) {
				message.channel.send("Deleting SignUp message for \'" + args[0] + "\'.");
				client.channels.get(raidData[args[0]].channel)
					.fetchMessage(raidData[args[0]].currentSignupMsg).then(fetchedMsg => {
						LogPreviousSignUpToLogChannel(raid, fetchedMsg);
						fetchedMsg.delete();//Get channel=>message=>delete it

					}).catch(error => {
						console.error(error);
					});
					 
			}
			//Also delete info about the raid. (The JSON object)
			delete raidData[args[0]];
			UpdateJSON();
			
			//Tell user the command succeeded.
			message.channel.send(message.author + ", I've deleted \'" + args[0] + "\' from available raids.")
			return;
		} else {
			//If raid didn't exist, tell user and return.
			message.channel.send("The raid \'" + args[0] + "\' doesn't exist.");
			return;
		}
	} else

	if(compareStringsLowerCase(command, (prefix + "listRaids"))) {
		/* LISTRAIDS
	
		Lists all raids available to setup.
		*/
		//Check amount of arguments
		if(args.length !== 0) {
			message.channel.send(message.author + ", listRaid takes no arguments.\nlistRaids()");
			return;
		}

		//If available raids JSON object doesn't exist, tell user and return.
		if(!raidData["availableRaids"] || raidData["availableRaids"].raids.length === 0) {
			message.channel.send("There currently are no available raids.");
			return;
		}
		//If there are available raids send a list with information about name, channel and permissions.
		message.channel.send("Available raids are: " + RaidsAvailableToString(raidData["availableRaids"].raids));
	} else

	if(compareStringsLowerCase(command, (prefix + "guide"))) {
		/* GUIDE
		Posts a guide message linking to https://github.com/XLOlsen/bananaBot
		*/

		//If the message author is not the botowner, return.
		if(message.author.id !== botOwner) {
			return;
		} else {
			//If message author is botowner, set up the message and send it.
			var richMsg = new Discord.RichEmbed()
			.setTitle("How to use bananaBot for raid registration")
			.setDescription("If it is your first time using bananaBot, I **highly recommend** you to take " +
				"2 minutes of your time to read the small guide to give you a better experience using bananaBot.\n" + 
				"The guide is hosted over at github, and will teach you the basics of using the bot for raid registration\n" +
				"If you have further questions don't hesitate to try the " + prefix + "help" +
				" command, or DM me @XLOlsen#5081")
			.setFooter("Live for Banana", "https://cdn.drawception.com/images/panels/2014/8-5/Xek68GTmsX-11.png")
			.setTimestamp()
			.addField("2.0 Practical information", "https://github.com/XLOlsen/bananaBot#20-practical-information")
			.addField("2.1 Creating and setting up a new raid (Officers only)", "https://github.com/XLOlsen/bananaBot#21-creating-and-setting-up-a-new-raid-officers-only")
			.addField("2.2 Signing up for raids (Everyone)", "https://github.com/XLOlsen/bananaBot#22-signing-up-for-raids-everyone");
			message.channel.send(richMsg);
		}
	}
		
});

client.login(token); 

/* 
Login with bot token.
Can generate a new token @ https://discordapp.com/developers/applications/me ,
or create a new bot, by choosing "New App".

Make sure to update the token inside /settings.json
*/

/******************************************************************************
*******************************************************************************
*************************  Below are some helping functions  ******************
*******************************************************************************
******************************************************************************/

/*


Check if user is signed up already


*/

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

/*


Other functions


*/

function raidExists(raidName) {
	/* ------------------------------ RAIDEXISTS ------------------------------
	
	*/
	if(!raidData["availableRaids"]) {
		return false;
	}

	for(var i = 0; i < raidData["availableRaids"].raids.length; i++) {
		if(compareStringsLowerCase(raidData["availableRaids"].raids[i], raidName)) {
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

function PermissionToSignUp(member, raid) {
	if(member.roles.some(r => raid.allowedRoles.includes(r.name))){
		return true; //If member is 1 of the allowed roles, return true
	} else {
		return false; //if not return false.
	}
}

function ParseStringToRolesStringArray(roleString) {
	switch(roleString) {

		case "core":
			return coreMembers;

		case "guild":
			return guildMembers;

		default:
			return false;

		}
}

function AllowedRolesToString(raid) {
	var resultString = "";
	for (var i = 0; i < raid.allowedRoles.length; i++) {
		if(raid.allowedRoles[i] !== "everyone") {
			resultString += client.channels.get(raid.channel).guild.roles.find("name", raid.allowedRoles[i]) + ", "

		} else {
			resultString += "\@everyone, "
		}
		
	}
	return resultString.slice(0, -2);
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
	return ("Raid Setup: **" + raid.name + "** \n" +
		"Raid Leader: " + raid.raidLeader + "\n" +
		"Allowed to join:" + AllowedRolesToString(raid) + "\n" + 
		raid.day + " " + raid.date + " " + raid.time + " " + raid.timezone + "\n\n" +
		"1. " + roleNames[0] + " \n" +
		raid.signUpGraph[1].discordID + " " + raid.signUpGraph[1].flavorText + "\n \n" +

		"2. " + roleNames[1] + " \n" + 
		raid.signUpGraph[2].discordID + " " + raid.signUpGraph[2].flavorText + "\n \n" +

		"3. " + roleNames[2] + " \n" + 
		raid.signUpGraph[3].discordID + " " + raid.signUpGraph[3].flavorText + "\n \n" +

		"4. " + roleNames[3] + " \n" + 
		raid.signUpGraph[4].discordID + " " + raid.signUpGraph[4].flavorText + "\n \n" +

		"5. " + roleNames[4] + " \n" + 
		raid.signUpGraph[5].discordID + " " + raid.signUpGraph[5].flavorText + "\n \n" +

		"6. " + roleNames[5] + " \n" + 
		raid.signUpGraph[6].discordID + " " + raid.signUpGraph[6].flavorText + "\n \n" +

		"7. " + roleNames[6] + " \n" + 
		raid.signUpGraph[7].discordID + " " + raid.signUpGraph[7].flavorText + "\n \n" +

		"8. " + roleNames[7] + " \n" + 
		raid.signUpGraph[8].discordID + " " + raid.signUpGraph[8].flavorText + "\n \n" +

		"9. " + roleNames[8] + " \n" + 
		raid.signUpGraph[9].discordID + " " + raid.signUpGraph[9].flavorText + "\n \n" + 

		"10. " + roleNames[9] + " \n" + 
		raid.signUpGraph[10].discordID + " " + raid.signUpGraph[10].flavorText + "\n \n" +

		"Reserves:" +
		RaidReservesToString(raid) + "\n \n" +

		"The list has been reset, so please tell me whatever role you'd like to fill! \n \n" +

		"If you're not familiar with the bosses please take a look at the guides in #raid-guides. I hope to see you all. Happy raiding!" + 
		"\n(To sign up use either raidFill command or be reserve with raidReserves command. \n" +
		"Use " + prefix + "help command if you're in doubt.");
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

function RaidsAvailableToString(availableRaids) {
	var resultString = "";
	for (var i = 0; i < availableRaids.length; i++) {
		if(raidData[availableRaids[i]].currentSignupMsg !== "") {
			resultString += "\n\n" + (i+1) + ". " + availableRaids[i] + " at channel " +
				client.channels.get(raidData[availableRaids[i]].channel) + 
				".\n Sign up is **open**, and **" + 
				raidData[availableRaids[i]].allowedRoles.join("**, **") +
				"** is allowed to join."
		} else {
			resultString += "\n\n" + (i+1) + ". " + availableRaids[i] + " at channel " +
				client.channels.get(raidData[availableRaids[i]].channel) + 
				".\n Sign up is **unavailable**, and **" + 
				raidData[availableRaids[i]].allowedRoles.join("**, **") +
				"** is allowed to join."
		}
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

function LogPreviousSignUpToLogChannel(raid, logMessage) {
	if(logChannel !== "") {
		client.channels.get(logChannel).send((new Date()) + "\n" + logMessage);
		return;
	} else {
		return;
	}
}

function raidFillHelpMessage() {
	var keywordIntervalsString = "";
	for (var i = 0; i < keywordRoles.length; i++) {
		keywordIntervalsString += keywordRoles[i][0] + ", ";
	}
	keywordIntervalsString = keywordIntervalsString.slice(0, -2);

	return "Valid intervals: [1], [1-3], [3-10], " + keywordIntervalsString +
			"\n[i-j] where 0 < i <= j < 11 \n" + 
			"[i] where 0 < i < 11 \n" + 
			"Example:\n" +
			"'~raidFill trainingRaid chrono+[3]+dps+[5-8]'";
}

function compareStringsLowerCase(string1, string2) {
	if(string1.toLowerCase() === string2.toLowerCase()) {
		return true
	} else return false;
}

/*


Checking information about user/sign up list/message content, with error handling


*/

function CheckRaidExists(message, raidName) {
	//Checks if the raid exists. If not tell user and return false.
	var raid = raidExists(raidName); //Either false or an index
	if(!(raid || (raid === 0)) || raid.currentSignupMsg === "") {
		message.channel.send("There currently is no signup for this raid: " + raidName);
		return false;
	} else {
		return raidData[raidData["availableRaids"].raids[raid]];
	}
}

function CheckInRightChannel(message, raid) {
	//Checks whether the raid was initiated in the channel the command was called. If not, tell user which channel the raid is in.
	if(!RaidSetupInMessageChannel(message.channel.id, raid)) {
		message.channel.send("\'" + raid.name + "\' is not setup in this channel.\n" + 
			"Go to \'" + client.channels.get(raid.channel) + "\' for the right channel.");
		return false;
	} else {
		return true;
	}
}

function CheckAllowedRoles(message, raid) {
	//Checks if user is permitted to signup. If not, return.
	if(raid.allowedRoles[0] !== "everyone" && !(PermissionToSignUp(message.member, raid))) {
		message.channel.send(message.author + ", I'm sorry, but you don't have permission to join \'" + raid.name + "\', "+
			"as it is restricted to: " + raid.allowedRoles);
		return false;
	} else {
		return true;
	}
}

function CheckUserAlreadySigned(message, raid, userAlreadySigned) {

	//Checks if user is already signed up. If yes, return and tell the user.
	switch (true) { 

		//If user is signed up to reserves
		case (userAlreadySigned[0] === 0): 
			message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
				raid.name + "\' as a reserve.");
			return false;

		//If user is signed up in list
		case (userAlreadySigned[0] === 1): 
			message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
				raid.name + "\' at a specified spot or as fill.");
			return false;

		default:
			return true;
	}
}

function CheckAnySpotsLeft(message, raid) {
	//Checks if there are any spots left in the list/graph. If not, tell user.
	if(raid.rolesAvailable.length === 0) {
		message.channel.send(message.author + ", I'm sorry I couldn't sign you up, as there are no more spots left.\n" +
			"Sign up as a reserve using \'" + prefix + "raidReserves " + raid.name + "\', or ask an officer to open up another raid.");
		return false;
	} else {
		return true;
	}
}
/******************************************************************************
*******************************************************************************
*********************  CODE RELATED TO GRAPH DATASTRUCTURE  *******************
*******************************************************************************
******************************************************************************/

function numberSort(a, b) {
    return a - b;
};
/*


Interval parsing from strings


*/
//Turns "chrono", "druid", "dps", "all" => [1,2], [3], [5,6], [7,10], [1,10]
function DefinedInterval(definedInterval) {
	definedInterval = definedInterval.toLowerCase();
	for (var i = 0; i < keywordRoles.length; i++) {
		if(definedInterval === keywordRoles[i][0]){
			return keywordRoles[i][1];
		}
	}
	return false;
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

/*


Graph creation and manipulation


*/
function Vertex(spot, adjecentEdges) { 
	this.spot = spot;
	this.discordID = "";
	this.flavorText = "";
	this.adjecentEdges = adjecentEdges;
	this.color = null;
	this.distance = Infinity;
	this.parent = null;
}

//Graph implementation specific to signUpList problem
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

/******************************************************************************
*******************************************************************************
*************************  TESTING - CODE IN PRODUCTION  **********************
*******************************************************************************
******************************************************************************/


/*
node -e 'require("./bananaBot.js").test()'
*/
module.exports.test = function () {

};
