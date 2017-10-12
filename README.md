# bananaBot
Discord Bot for organizing raids in GW2

For a nice little project I decided to make a bot to make raid organizing much easier in our GW2 guild, which means this bot was also
only made with our own needs in focus.
What it can do is create a sign-up message, where people can add/fill/remove themselves.
This will make it easier to organize raids as, instead of always having an officer handle everything manually, we let a bot do it.
Right now users can only add/fill/remove themselves from the signup, and officers can add/remove others aswell as setting up new raids
and resetting raid setup messages individually.

The bot is only tested on single channels, that is, the intended use is for the bot to only read messages from a single raidRegistration channel.
All information(What signups are available, who signed up etc.) is stored in a single JSON file.

This is my first big project, and it has been cool trying to get everything working and thinking of efficient/working solutions.
Any feedback is welcome!

Future ideas include:
- "DiscordRole" only raid signups (Ex. So only guildmembers can sign up)
- MultiChannel support, making a raidSetup for each channel
- Reserving spot
- True fill (When someone wants to fill spot 1 - 4, make sure the person atleast gets 1 of the spots)
