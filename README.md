# bananaBot
#### Discord Bot for organizing raids in GW2

For a nice little project I decided to make a bot to make raid organizing much easier in our GW2 guild, which means this bot was also only made with our own needs in focus.
This is my first big project, and it has been cool trying to get everything working and thinking of efficient/working solutions.
Any feedback is welcome!

Shoutout to https://github.com/AnIdiotsGuide for getting me started with his guides.

## How to use bananaBot

### 1. Deploying the bot
This section will be much alike the better version found at https://anidiotsguide.gitbooks.io/discord-js-bot-guide/getting-started/the-long-version.html

1. Setup the bot account

Thankfully, discord has made this very easy. Go to https://discordapp.com/developers/applications/me, and under the tab "My Apps" press the "New App" square. Choose a name for your bot (this will be the displayed name in discord), and press create app. You'll be taken to the app site, where you'll need both the client ID, and the token for later. Don't forget to press "Create a Bot User" aswell!
Copy the clientID and go to https://finitereality.github.io/permissions-calculator/?v=1341652161, where you first set the permissions of the bot (should be pre-filled), and at the bottom of the page you just fill in the clientID and press "Add". Select the server you'd like to invite the bot to.

2. Download bananaBot

First off we want to get this bad boy onto wherever you intend to host bananaBot. Download this repository/clone it via the terminal using: 
```$ git clone git@github.com:XLOlsen/bananaBot.git```
After this you can change the origin to your own repository,
```$ git remote set-url origin http://github.com/YOU/YOUR_REPO```
or add another remote, so you can still fetch upgrades:
```$ git remote add personal http://github.com/YOU/YOUR_REPO```

3. Create your own settings.json file

Open an empty file, paste in: 
```
{	
	"token":"YOUR_TOKEN_GOES_HERE", 
	"botOwner":"YOUR_DISCORD_ID_GOES_HERE",
	"prefix":"~",
	"logChannel":"YOUR_LOG_CHANNEL_ID_GOES_HERE_OR_YOU_CAN_LEAVE_IT_BLANK",
	"highRoles":["YOUR_DISCORD_OFFICER_AND_LEADER_ROLE_NAMES_GO_HERE"],
	"coreMembers":["YOUR_DISCORD_CORE_RAID_ROLE_NAME_GOES_HERE"],
	"guildMembers":["YOUR_DISCORD_GUILDMEMBER_ROLE_NAME_GOES_HERE"],
	"keywordRoles":["YOUR_PREDETERMINED_INTERVALS_GOES_HERE"],
	"roleNames":["YOUR_RAID_SETUP_GOES_HERE"]
} 
```
keywordRoles being arrays with the form ["nameOfCustomInterval","customInterval"], while roleNames is the actual setup, requiring an array of 10 elements on the form ["role1", "role2", "role3", ..., "role9", "role10"].
Example of how my settings file look: (With personal/secure fields censored)
```
{
	"token":"censored",
	"botOwner":"censored",
	"prefix":"~",
	"logChannel":"censored",
	"highRoles":["Idiotic Leader", "Officers", "Master of Coin"],
	"coreMembers":["Core Raid Members"],
	"guildMembers":["BNN"],
	"keywordRoles":[["chrono",[1,2]],["uba",[2]],["druid",[3]],["banners",[4]],["healer",[5]], ["dps",[6,10]], ["any",[1,10]],["all",[1,10]]],
	"roleNames":["Chrono Tank", "Support Chrono", "Druid PS", "Warrior Banners", "Healer/DPS", "DPS", "DPS", "DPS", "DPS", "DPS"]
}
```

Then save this file in the same folder as the other files, naming it settings.json.
That's it! Of course, place your own unique token that you got from https://discordapp.com/developers/applications/me in the file at YOUR_TOKEN_GOES_HERE, and fill in all the other stuff you'd like to customise.

4. Install latest Node.js version

Go to https://nodejs.org/en/ and get the latest version. Install it.

5. Install dependencies (DiscordJS)

Go ahead and install the dependencies for the bot. As of this version(bananaBot 1.3.0), it'll only be discordJS. To install the dependencies go ahead in the terminal and type:
```$ npm install```
After it's done, you should now have a node modules folder inside of your repository, and you can now fire up the bot by typing:
```$ node bananaBot.js```

6. Tinkering the bot to your needs

As of version bananaBot version 1.4.0, I've tried to make the bot more customizable, so it can be used in other guilds. This means most of the previous hardcoded stuff goes into the settings.json file, and can be customized from there. However the help messages (inside commands) all are hardcoded using the prefix ~ (tilde), which means, if you pick another prefix, you might want to go through all of the txt files inside of command and update them there. Other than that, go ahead and make the bot suit your needs!

### 2. Getting started with bananaBot

So you've got the bot up and running on whatever, and you wanna know how this can be used? How it can improve your raid sign up situation? Let me tell you the general workflow of using this bot for raid registration. But first off, some general information for working with the bot:

#### 2.0 Practical information
   * All commands should be executed using the prefix.
   * All commands are case-sensitive. (Hint: camelCase)
   * All arguments are seperated by spaces.
   * Each command have a required number of arguments, which should be entered in correct order. 

If these 4 'rules' of operating the bot are not followed, you may receive unexpected results. Even though the bot have alot of fail safe's, and (not so)useful help messages, I might've missed some. Who knows?

If you're ever in doubt try the ```~help``` or ```~help (commandName)``` commands, they will let you see the order of arguments, aswell as specifying what each argument expects, explain the commands etc.

In short, they're there, as the name implies, to help you.

#### 2.1 Creating and setting up a new raid (Officers only)

1. Starting from a fresh an officer will have to create a new raid. This is done by calling the```~newRaid ``` command. An example of this command could be ```~newRaid trainingRaid```, which will create a new raid, limited to the channel the command was called, called 'trainingRaid', where everyone is allowed to sign up (For guild only raids, consult ```~help newRaid```).

2. Once created, you can setup a sign up message calling the ```~raidSetup``` command. Example ```~raidSetup trainingRaid Sunday 24/12 8pm CEST```, will setup a sign up message for the raid 'trainingRaid', with the information about when the raid will happen (Notice how each argument to the command is seperated by a space). When the ```~raidSetup``` command is called, the bot will create a sign up message and pin it to the channel. 

3. Next up you can choose to add a raid leader, this is done with the ```~setRL``` command. You can either set yourself as raid leader, or let another one do the dirty work of leading the raid. Example ```~setRL trainingRaid XLOlsen``` (Note: when dealing with discord names, the discord.js framework is also case-sensitive when looking for users.).

You're done, the raid is set, and everyone can now happily sign up.

#### 2.2 Signing up for raids (Everyone)

To sign up for a raid you can go through this quick checklist:

1.  Find out the raid name of the name you want to sign up to. This can be done calling the ```~listRaids``` command, or simply looking at the top of the sign up message of which you want to sign up to.
2. Head on over to the channel the raid was setup in. This will be the same channel as the sign up message was sent. This information can also be found using the ```~listRaids``` command.
3. Sign up. 

If you're finding yourself typing the wrong name, or being in the wrong channel, the bot will let you know.

You can sign up for a raid in 3 different ways. 

1. raidFill (Single/multiple spot(s), guaranteed a spot)
2. raidReserves (Backup/reserves, not guaranteed a spot) 

Also when shit hits the fan/you find out you can't attend the raid even though you signed up, you can use:

4. raidRemove (Removes you from the raid, whether you're add/fill/reserve)

##### 2.2.1 raidFill

```~raidFill``` is for when you don't mind playing multiple roles/filling multiple spots. This command uses intervals to fill for different spots, but also have some predetermined intervals by name.

The formal expression for a valid interval is:

[i-j] where 0 < i <= j < 11

[i] where 0 < i < 11

This just means that intervals such as [1-3] and [8] are valid, and intervals such as [3-1] and [11] are invalid. The predetermined intervals are:

```chrono```=[1-2], ```druid```=[3], ```banners```=[4], ```healer```=[5], ```dps```=[6-10], ```all```=[1-10], ```any```=[1-10].

And there might be a secret one aswell.

All intervals are seperated by ```+```, which means ```[1-3]+dps+[6]+chrono``` is a valid interval.

But how does one use ```~raidFill```? Let's look at the structure:

```raidFill(raidName, intervals, discordName)```

Again we have raidName which was the name of the raid, then we have intervals which are any valid interval as explained above(Remember to seperate different intervals by ```+```), and last we have the optional discordName, which again is limited to officers only.

An example of using ```~raidFill``` would be: 

```~raidFill trainingRaid druid+chrono+[1]+[6-8]```

As you'll notice, your intervals doesn't have to make sense, they just have to be valid. This will sign you up as fill for spots [1-4], [6-8], and you'll be placed in the first available spots of the ones you've specified. Now you might ask: Am I gonna be stuck on the first available spot then? 
The answer is: No, you can be moved around. Here comes the smart thing about the bot. 

Let's take an example: You want spot [3-4], but they're both taken. The thing is, guy in spot #3 also signed up as fill for spot #7, which means the bot will move him to spot #7 instead, so you can be signed up for spot #3. This is done using something called breadth first search, and... 

Well I shouldn't bore you with all the details...

Instead, let us just say that the bot will find a spot for you if it's possible, if it's not possible, you'll have to try for another spot(s).


For help, you can again use ```~help raidFill```.

##### 2.2.2 raidReserves

So the raid is full, and you really want to go? Ask an officer to setup another raid! Or, you can use ```~raidReserves```. This will add you as a backup to the raid in case somebody who signed up decides to be late/not show up anyways. This will let us know, if we can contact you in case of 'emergencies'.
The command structure is:

```raidReserves (raidName, discordName)```

It's pretty simple, raidName would be the name of the raid you'd like to be a reserve, and discordName is again optional and limited to officers.

Example of use: ```~raidReserves trainingRaid```

This will add you as a reserve on the sign up message of the raid 'trainingRaid'.

For more help, check out ```~help raidReserves```

##### 2.2.3 raidRemove

Picture this: 
You forgot your birthday, a huge load of homework hit your desk, your pc broke, your girlfriend spontaneously invited your in-laws for dinner... In other words, you can't attend the raid you signed up for, for some reason. Fear not! You can sign off at any time using ```~raidRemove``` command.

Just remember, **standard social etiquette still applies**:

1. Try to cancel your sign up as soon as you know you can't attend.
2. If it's late/on the day, please let an officer know, best to contact the raid leader if possible.
3. Remember to remove yourself, to make the spot open for others. You can even do this through your phone by invoking the ```~raidRemove``` command. (remember, all 'commands' are in fact just simple discord messages).

So now we got that out of the way, let's look at the command structure:

```raidRemove(raidName, discordName)```

Same as the others. raidName is the name of the raid where you want yourself removed from, discordName is optional limited to officers only.

Example of use: ```~raidRemove trainingRaid```

This will remove you from 'trainingRaid', whether you signed up using```~raidFill``` or ```~raidReserves```.

For more help, try ```~help raidRemove```.

