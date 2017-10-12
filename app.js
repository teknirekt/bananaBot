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
const raidRemoveTXT = fs.readFileSync("commands/raidRemove.txt", "utf8");
const raidSetupTXT = fs.readFileSync("commands/raidSetup.txt", "utf8");

let raidData = JSON.parse(fs.readFileSync("./raidData.json", "utf8"));
/* Ideas for future versions:
- Make raidSetup function restrict who's allowed to signup based on an additional argument 
ex. permission = everyone/officers/guildmembers.
-Add a fill array for raidSetup, signing up for fill using array.push.

- Set channel option

- Reserve spot option
*/

client.on("ready",() => {
	console.log("I\'m Online\nI\'m Online")
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


	/*------------------------------ INFO ------------------------------

	Prints out info message.
	*/
	if(message.content.startsWith(prefix + "info")) {
		message.channel.send(infoTXT);
	}


	/* ------------------------------ HELP ------------------------------
	@param (args[0] = command) 		STRING

	Lists all commands, or in depth explanation of specific commands.
	*/
	if (message.content.startsWith(prefix + "help")) { 		
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


	/* ------------------------------ RAIDADD ------------------------------
	@param (args[0] = raidName) 		STRING
	@param (args[1] = roleIndex) 		INT
	@param (args[2] = roleDescription) 	STRING
	@param (args[3] = discordName) 		STRING (optional)

	Add author of message or user to the raidSignup:
	*/
	if(message.content.startsWith(prefix + "raidAdd")) {

		var raid = raidExists(args[0]);
		if(!(raid || (raid === 0))) {
			message.channel.send("There currently is no signup for this raid: " + args[0]);
			return;
		}
		raid = raidData[args[0]];

		message.channel.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {
			if(!CanFindAndManageUser(message, args[3])) { //Is messageAuthor allowed to add 
				return; //other users and is it a valid username?
			}
			var userAlreadySigned = UserAlreadySignedReport(message, raid, args[3]);

			switch (true) { //Is user already signed up?
				case (userAlreadySigned[0] === 0): //If user is signed up for a spot
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
				 		args[0] + "\', spot #" + (userAlreadySigned[2] + 1));
					return;
				case (userAlreadySigned[0] === 1): //If user is signed up to fill
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
						args[0] + "\' as fill.");
					return;
			}
			switch (true) {
				case ((parseInt(args[1]) >= 1) && (parseInt(args[1]) <= 4) && (raid.roles[args[1]-1] === "")):
					raid.roles[parseInt(args[1])-1] = userAlreadySigned[1] + "";
					UpdateJSON();
					fetchedMsg.edit(RaidSetupMessage(raid));
					message.channel.send(userAlreadySigned[1] + ", I signed you up for spot #" + args[1] + " in " + raid.name + ".");
					break;
				case ((parseInt(args[1]) >= 5) && (parseInt(args[1]) <= 10) && (raid.roles[args[1]-1] === "")):
					raid.roles[parseInt(args[1])-1] = userAlreadySigned[1] + " " + args[2];
					UpdateJSON();
					fetchedMsg.edit(RaidSetupMessage(raid));
					message.channel.send(userAlreadySigned[1] + ", I signed you up for spot #" + args[1] + " in " + raid.name + ".");
					break;
				default:
					message.channel.send("The desired spot \'" + args[1] + "\' is either already filled, or otherwise unavailable.");
			}
		});
	} else


	/* ------------------------------ RAIDFILL ------------------------------
	@param (args[0] = raidName) 		STRING
	@param (args[1] = discordName) 		STRING (optional)

	Add author of message to the raidSignup as shop-up/fill:
	*/
	if(message.content.startsWith(prefix + "raidFill")) {

		var raid = raidExists(args[0]);
		if(!(raid || (raid === 0))) {
			message.channel.send("There currently is no signup for this raid: " + args[0]);
			return;
		}
		raid = raidData[args[0]];

		message.channel.fetchMessage(raid.currentSignupMsg).then(fetchedMsg => {

			if(!CanFindAndManageUser(message, args[1])) { //Is messageAuthor allowed to add 
				return; //other users and is it a valid username?
			}

			var userAlreadySigned = UserAlreadySignedReport(message, raid, args[1]);

			switch (true) { //Is user already signed up?
				case (userAlreadySigned[0] === 0): //If user is signed up for a spot
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
				 		args[0] + "\', spot #" + (userAlreadySigned[2] + 1));
					return;
				case (userAlreadySigned[0] === 1): //If user is signed up to fill
					message.channel.send("User, " + userAlreadySigned[1] + ", is already signed up for \'" +
						args[0] + "\' as fill.");
					return;
			}

			raid.fill.push(userAlreadySigned[1]);
			UpdateJSON();
			fetchedMsg.edit(RaidSetupMessage(raid));
			message.channel.send(userAlreadySigned[1] + ", I've added you to \'" + raid.name + "\' as fill.")

		});
	} else


	/* ------------------------------ RAIDREMOVE ------------------------------
	@param (args[0] = raidName) 		STRING
	@param (args[1] = discordName) 		STRING (optional)

	Remove author of message from raidSignUp:
	*/
	if(message.content.startsWith(prefix + "raidRemove")) {
		var raid = raidExists(args[0]);
		if(!(raid || (raid === 0))) { //Does raid exist?
			message.channel.send("There currently is no signup for this raid: " + args[0]);
			return; //If no, stop.
		}
		raid = raidData[args[0]];

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

				case (userAlreadySigned[0] === 0): //If user is signed up for a spot
					raid.roles[userAlreadySigned[2]] = "";
					UpdateJSON();
					fetchedMsg.edit(RaidSetupMessage(raid));
					message.channel.send(userAlreadySigned[1] + ", I've removed you from spot #" + (userAlreadySigned[2] + 1) + " in \'" + raid.name + "\'.");
					return;

				case (userAlreadySigned[0] === 1): //If user is signed up to fill
					raid.fill.splice(userAlreadySigned[2], 1);
					UpdateJSON();
					fetchedMsg.edit(RaidSetupMessage(raid));
					message.channel.send(userAlreadySigned[1] + ", I've removed you from fill in \'" + raid.name + "\'.");
					return;
			}

		});
	} else


	/* ------------------------------ RAIDSETUP ------------------------------
	@param (args[0] = raidName) 		STRING
	@param (args[1] = day)		 		STRING
	@param (args[2] = date)		 		STRING
	@param (args[3] = time) 			STRING
	@param (args[4] = timezone) 		STRING


	Set up a raidSetup message inside the channel, deleting previous message.
	*/
	if(message.content.startsWith(prefix + "raidSetup")) {
		//First permission is checked:
		if(!HigherPermission(message.member)) {
			message.channel.send(message.author + ", you don't have permission to run this command.");
		}
		var raid = raidExists(args[0]);
		if(!(raid || (raid === 0))) { //Does raid exist?
			message.channel.send("The raid \'" + args[0] + "\' hasn't yet been initialized.");
			return; //If no, stop.
		}

		if(!raidData[args[0]]) {
			raidData[args[0]] = { //If raid doesn't exist
				//Initialize the new raid with blank data
				name: args[0],
				day: "",
				date: "",
				time: "",
				timezone: "",
				roles: ["","","","","","","","","",""],
				fill: [],
				currentSignupMsg: "",
				channel: ""
			};
			UpdateJSON(); //Update JSON.
		}

		if(args.length < 5) {
			message.channel.send("Please fill in 5 arguments (raid, day, date, time, timezone). \nArguments are separated by spaces\n" +
				"Example: trainingRaid Saturday 24/12 8pm CEST");
			return;

		} 

		if(raidData[args[0]].channel.id && raidData[args[0]].currentSignupMsg) { //Delete previous signup message.
			client.channels.get(raidData[args[0]].channel.id)
				.fetchMessage(raidData[args[0]].currentSignupMsg).then(fetchedMsg => {
					message.channel.send("Deleting previous raidSignUp message from channel \'" + raidData[args[0]].channel.id + "\'.")
				fetchedMsg.delete();
				});
		}

		//Make a new raid with given inputs, and all slots empty
		raidData[args[0]].day = args[1];
		raidData[args[0]].date = args[2];
		raidData[args[0]].time = args[3];
		raidData[args[0]].timezone = args[4];
		raidData[args[0]].roles = ["","","","","","","","","",""];
		raidData[args[0]].fill = [];
		UpdateJSON();

		message.channel.send(RaidSetupMessage(raidData[args[0]])).then((msg, msgs) => {
			raidData[args[0]].currentSignupMsg = msg.id;
			raidData[args[0]].channel = msg.channel.id;
			msg.pin();
			UpdateJSON();
		});
	} else


	/* ------------------------------ NEWRAID ------------------------------
	@param (args[0] = raidName) 		STRING

	Adds a new raid name to available raids.	
	*/
	if(message.content.startsWith(prefix + "newRaid")) {

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
		UpdateJSON();
		message.channel.send(message.author + ", I've added \'" + args[0] + "\' to available raids.");
	} else


	/* ------------------------------ DELETERAID ------------------------------
	@param (args[0] = raidName) 		STRING
	
	Deletes a raid, given it exists in availableRaids.
	*/
	if(message.content.startsWith(prefix + "deleteRaid")) {
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
			UpdateJSON();
			message.channel.send(message.author + ", I've deleted \'" + args[0] + "\' from available raids.")
			return;
		} else {
			message.channel.send("The raid \'" + args[0] + "\' doesn't exist.");
		}
	} else


	/* ------------------------------ LISTRAIDS ------------------------------
	
	Lists all raids available to setup.
	*/
	if(message.content.startsWith(prefix + "listRaids")) {
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


/* ------------------------------ USERINSIGNUPROLES ------------------------------
@Param userToString DISCORDJS.USER.TOSTRING: String representation of a discord user.
@Param raid JSON.OBJECT: Pass the object raidData[raidName] from raidData.json.

@Return result INT: (true) Index of found user in raid.roles.
@Return result BOOLEAN: false.

Iterates the raid.roles elements in the raid object, searching for the user. If the user
is found, the index is returned. If not, false is returned.
*/
function UserInSignUpFill(userToString, raid) {
	for(var i = 0; i < raid.fill.length; i++) {
		if(raid.fill[i].indexOf(userID) !== -1) {
			return i; //If user is in raid.fill list return index i 
		}
	}
	return false; //If user was not found in raid.fill return false
}


/* ------------------------------ USERINSIGNUPROLES ------------------------------
@Param userToString DISCORDJS.USER.TOSTRING: String representation of a discord user.
@Param raid JSON.OBJECT: Pass the object raidData[raidName] from raidData.json.

@Return result INT: (true) Index of found user in raid.roles.
@Return result BOOLEAN: false.

Iterates the raid.roles elements in the raid object, searching for the user. If the user
is found, the index is returned. If not, false is returned.
*/
function UserInSignUpRoles(userToString, raid) {
	for(var i = 0; i < raid.roles.length; i++) {
		if(raid.roles[i].indexOf(userID) !== -1) {
			return i; //If user is in raid.roles list return index i
		}
	}
	return false; //If user was not found in raid.roles return false
}


/* ------------------------------ USERALREADYSIGNEDUPREPORT ------------------------------
@Param message DISCORDJS.MESSAGE: Pass the message that prompted the command.
@Param raid JSON.OBJECT: Pass the object raidData[raidName] from raidData.json.
@Param username STRING: Pass a valid name or nothing.

@Return resultTrueArray ARRAY[roleOrFill, DISCORDJS.USER, roleOrFillIndex]: 
Array values depend on if user was in roles or fill, the user passed, and the index
the user was found at in roles or fill.
@Return resultFalseArray ARRAY[userNotFound=2, DISCORDJS.USER]:
 
Checks whether the username passed or the message author is already signed up
as taking a role or filling the raid. If the passed user is found in raid.roles, it will
be indicated by 0. If passed user is found in raid.fill, it will be indicated by 1.
If passed user is not found, it will be indicated by 2, and the index will not be passed.
*/
function UserAlreadySignedReport(message, raid, username) {

	var userToAdd = SelfOrAnotherUser(message, username);
	var userAlreadySignedUpRoles = UserInSignUpRoles(userToAdd, raid);
	var userAlreadySignedUpFill = UserInSignUpFill(userToAdd, raid);

	if(userAlreadySignedUpRoles || userAlreadySignedUpRoles === 0) {
		return [0, userToAdd, userAlreadySignedUpRoles];
	}
	if(userAlreadySignedUpFill || userAlreadySignedUpFill === 0) {
		return [1, userToAdd, userAlreadySignedUpFill];
	}
	return [2, userToAdd];
}


/* ------------------------------ RAIDEXISTS ------------------------------
@Param member DISCORDJS.USER: Pass the author of the message that prompted the command.

@Return result BOOLEAN: true/false, depending on role of the member.

If the member has 1 of the high roles, true is returned. If not, false is returned.
*/
function raidExists(raidName) {
	for(var i = 0; i < raidData["availableRaids"].raids.length; i++) {
		if(raidData["availableRaids"].raids[i] === (raidName)) {
			return i;
		}
	}
	return false;
}


/* ------------------------------ HIGHERPERMISSION ------------------------------
@Param member DISCORDJS.USER: Pass the author of the message that prompted the command.

@Return result BOOLEAN: true/false, depending on role of the member.

If the member has 1 of the high roles, true is returned. If not, false is returned.
*/
function HigherPermission(member) {
	if(member.roles.some(r => highRoles.includes(r.name))){
		return true; //If member is 1 of the high roles (higher permission), return true
	} else {
		return false; //if not return false.
	}
}


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
function CanFindAndManageUser(message, username) {
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
function UserExists (username) {
	if(username !== undefined && client.users.find("username", username) === null) {
		return false;
	}

	return true;
}


/* ------------------------------ SELFORANOTHERUSER ------------------------------
@Param message DISCORDJS.MESSAGE: Pass the message that prompted the command.
@Param username STRING: Pass a valid discord name from the server.

@Return selfOrAnotherUser DISCORDJS.USER: ToString representation of a DiscordJS user.

If the message author has the permission, and the username is valid, 
the User.ToString corresponding to the username will be returned. Otherwise the
message author will be returned.
*/
function SelfOrAnotherUser(message, username) {
	if((message.member.roles.some(r => highRoles.includes(r.name))) && username) {
		var selfOrAnotherUser = client.users.find("username", username).toString();
	} else {
		var selfOrAnotherUser = message.author;
	}
	return selfOrAnotherUser;
}


/* ------------------------------ RAIDSETUPMESSAGE ------------------------------
@Param raid JSON.OBJECT: Pass the object raidData[raidName] from raidData.json.

@Return result STRING: A String representation of a raidSetup.

Inserts info from the raid object into a String template.
*/
function RaidSetupMessage(raid) {
	return ("raidSetup: " + raid.name + " \n" +
		"\@everyone \n" +
		raid.day + " " + raid.date + " (" + raid.time + " " + raid.timezone + ")" + "\n" +
		"1. Chronotank \n" +
		raid.roles[0] + "\n \n" +

		"2. Support Chrono \n" + 
		raid.roles[1] + "\n \n" +

		"3. Druid \n" + 
		raid.roles[2] + "\n \n" +

		"4. Druid \n" + 
		raid.roles[3] + "\n \n" +

		"5. PS \n" + 
		raid.roles[4] + "\n \n" +

		"6. PS \n" + 
		raid.roles[5] + "\n \n" + 

		"7. DPS/Condi DPS \n" + 
		raid.roles[6] + "\n \n" + 

		"8. DPS/Condi DPS \n" + 
		raid.roles[7] + "\n \n" + 

		"9. DPS/Condi DPS \n" + 
		raid.roles[8] + "\n \n" + 

		"10. DPS/Condi DPS \n" + 
		raid.roles[9] + "\n \n" +

		"Show-ups/fill" +
		RaidFillToString(raid) + "\n \n" +

		"The list has been reset, so please tell me whatever role you'd to fill! \n \n" +

		"If you're not familiar with the bosses please take a look at the guides in #raid-guides. I hope to see you all. Happy raiding!" + 
		"\n(To sign up use the raidAdd command. Example \'~raidAdd " + raid.name + " 5 CPS\')");
}


/* ------------------------------ RAIDFILLTOSTRING ------------------------------
@Param raid JSON.OBJECT: Pass the object raidData[raidName] from raidData.json.

@Return result STRING: A String representation of raid.fill.

Iterates the raid.fill data in the raid object adding each element as a string 
representation.
*/
function RaidFillToString(raid) {
	var result = "";
	for(var i = 0; i < raid.fill.length; i++) {
		result += "\n" + raid.fill[i]
	}
	return result;
}



/* ------------------------------ UPDATEJSON ------------------------------

Writes/updates the changes to raidData.json.
*/
function UpdateJSON() {
	fs.writeFile("./raidData.json", JSON.stringify(raidData), (err) => {
		if (err) console.error(err); //log errors
	});
}