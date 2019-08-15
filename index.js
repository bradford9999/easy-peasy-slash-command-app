/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
______    ______    ______   __  __    __    ______
/\  == \  /\  __ \  /\__  _\ /\ \/ /   /\ \  /\__  _\
\ \  __<  \ \ \/\ \ \/_/\ \/ \ \  _"-. \ \ \ \/_/\ \/
\ \_____\ \ \_____\   \ \_\  \ \_\ \_\ \ \_\   \ \_\
\/_____/  \/_____/    \/_/   \/_/\/_/  \/_/    \/_/


This is a sample Slack Button application that provides a custom
Slash command.

This bot demonstrates many of the core features of Botkit:

*
* Authenticate users with Slack using OAuth
* Receive messages using the slash_command event
* Reply to Slash command both publicly and privately

# RUN THE BOT:

Create a Slack app. Make sure to configure at least one Slash command!

-> https://api.slack.com/applications/new

Run your bot from the command line:

clientId=<my client id> clientSecret=<my client secret> PORT=3000 node bot.js

Note: you can test your oauth authentication locally, but to use Slash commands
in Slack, the app must be hosted at a publicly reachable IP or host.


# EXTEND THE BOT:

Botkit is has many features for building cool and useful bots!

Read all about it here:

-> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('botkit');

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.PORT || !process.env.VERIFICATION_TOKEN) {
    console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN and PORT in environment');
    process.exit(1);
}

var config = { }
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),interactive_replies: true
    };
} else {
    config = {
        json_file_store: './db_slackbutton_slash_command/',interactive_replies: true
    };
}

var controller = Botkit.slackbot(config).configureSlackApp(
{
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['commands','bot'],
}
);
 //make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

controller.setupWebserver(process.env.PORT, function (err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});
//
// BEGIN EDITING HERE!
//
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


var scheduler = require('./scheduler');
var reportingInterval = "0 0 10 * * *";

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

scheduler(reportingInterval, function() {
    sendDailyBingImage();
//    sendDailyMovieQuote();
    
});

function sendDailyBingImage() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://hooks.slack.com/services/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", true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    JSDOM.fromURL("https://www.bing.com/").then(dom => {
        var copyright = getBingCopyright(dom);
        var url = getBingImageUrl(dom);
        xhr.send(JSON.stringify(getBingPayload(url, copyright)));
    });
}
function getBingImageUrl(dom) {
    return "http://bing.com"+ dom.window.document.querySelector("#bgLink").getAttribute("href");
}

function getBingCopyright(dom) {
    var regex = /{"copyright":"(.*)","copyrightlink"/;
    var copyright = dom.window.document.body.innerHTML.match(regex)[1];
    return copyright;
}

function getBingPayload(url, copyright) {
    return {
                blocks: [
                {
                    "type": "image",
                    "title": {
                        "type": "plain_text",
                        "text": new Date().toLocaleDateString()
                    },
                    "image_url": url,
                    "alt_text": "Where is the world is ..."
                },
                {
                    "type": "actions",
                    "elements": [{
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Where is the picture?",
                            "emoji": true
                        },
                        "confirm": {
                            "title": {
                                "type": "plain_text",
                                "text": "Copyright Information:"
                            },
                            "text": {
                                "type": "mrkdwn",
                                "text": copyright
                            }
                        }
                    }]
                }]
            };
}

controller.on('block_actions', function(bot, message) {
console.log("HERE block");

});
controller.on('interactive_message_callback', function(bot, message) {
console.log("here interactive_message_callback");
});
controller.hears('hello', 'direct_message', function (bot, message) {
    bot.reply(message, 'Hello!');
});
controller.on('slash_command', function (slashCommand, message) {
    // but first, let's make sure the token matches!
    if (message.token !== process.env.VERIFICATION_TOKEN) return; //just ignore it.
    switch (message.command) {

    case "/bing": //handle the `/echo` slash command. We might have others assigned to this app too!
    // The rules are simple: If there is no text following the command, treat it as though they had requested "help"
    // Otherwise just echo back to them what they sent us.

    // If we made it here, just echo what the user typed back at them
        if(message.text === "") {

            JSDOM.fromURL("https://www.bing.com/").then(dom => {
                var copyright = getBingCopyright(dom);
                var url = getBingImageUrl(dom);
                slashCommand.replyPublic(message, getBingPayload(url, copyright));
            });
            return;
        }

        slashCommand.replyPrivate(message,
            "I get the bing background for the day!" +
            "Just type `/bing` to see it.");
        return;

    case "/moviequote":
    console.log(message.text);
        if(message.text === "") {
            //get random quote
            var notUsed = quotes.filter(e => e.used == false);
            if (notUsed.length == 0) {
                for (var i = 0; i < quotes.length; i++) {
                    quotes[i].used = false;
                }
                notUsed = quotes.filter(e => e.used == false);
            }

            var size = notUsed.length;
            var index = Math.floor(Math.random() * size);
            notUsed[index].used = true;
            slashCommand.replyPublic(message, {
                blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "\"" + notUsed[index].quote + "\""
                    }
                },
                {
                    "type": "actions",
                    "elements": [{
                        "type": "button",
                        "value":"bingStuff",
                        "text": {
                            "type": "plain_text",
                            "text": "What is the movie?",
                            "emoji": true
                        },
                        "confirm": {
                            "title": {
                                "type": "plain_text",
                                "text": "And the movie is..."
                            },
                            "text": {
                                "type": "mrkdwn",
                                "text": notUsed[index].movie + ", " + notUsed[index].year
                            }
                        }
                    }]
                }]
            });
            return;
        }
        break;
    default:
        slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }
                    
});


var quotes = [
    {quote: "Frankly, my dear, I don't give a damn.", movie: "GONE WITH THE WIND", year: "1939" },
{quote: "I'm gonna make him an offer he can't refuse.", movie: "THE GODFATHER", year: "1972" },
{quote: "You don't understand! I coulda had class. I coulda been a contender. I could've been somebody, instead of a bum, which is what I am.", movie: "ON THE WATERFRONT", year: "1954" },
{quote: "Toto, I've a feeling we're not in Kansas anymore.", movie: "THE WIZARD OF OZ", year: "1939" },
{quote: "Here's looking at you, kid.", movie: "CASABLANCA", year: "1942" },
{quote: "Go ahead, make my day.", movie: "SUDDEN IMPACT", year: "1983" },
{quote: "All right, Mr. DeMille, I'm ready for my close-up.", movie: "SUNSET BLVD.", year: "1950" },
{quote: "May the Force be with you.", movie: "STAR WARS", year: "1977" },
{quote: "Fasten your seatbelts. It's going to be a bumpy night.", movie: "ALL ABOUT EVE", year: "1950" },
{quote: "You talking to me?", movie: "TAXI DRIVER", year: "1976" },
{quote: "What we've got here is failure to communicate.", movie: "COOL HAND LUKE", year: "1967" },
{quote: "I love the smell of napalm in the morning.", movie: "APOCALYPSE NOW", year: "1979" },
{quote: "Love means never having to say you're sorry.", movie: "LOVE STORY", year: "1970" },
{quote: "The stuff that dreams are made of.", movie: "THE MALTESE FALCON", year: "1941" },
{quote: "E.T. phone home.", movie: "E.T. THE EXTRA-TERRESTRIAL", year: "1982" },
{quote: "They call me Mister Tibbs!", movie: "IN THE HEAT OF THE NIGHT", year: "1967" },
{quote: "Rosebud.", movie: "CITIZEN KANE", year: "1941" },
{quote: "Made it, Ma! Top of the world!", movie: "WHITE HEAT", year: "1949" },
{quote: "I'm as mad as hell, and I'm not going to take this anymore!", movie: "NETWORK", year: "1976" },
{quote: "Louis, I think this is the beginning of a beautiful friendship.", movie: "CASABLANCA", year: "1942" },
{quote: "A census taker once tried to test me. I ate his liver with some fava beans and a nice Chianti.", movie: "THE SILENCE OF THE LAMBS", year: "1991" },
{quote: "Bond. James Bond.", movie: "DR. NO", year: "1962" },
{quote: "There's no place like home.", movie: "THE WIZARD OF OZ", year: "1939" },
{quote: "I am big! It's the pictures that got small.", movie: "SUNSET BLVD.", year: "1950" },
{quote: "Show me the money!", movie: "JERRY MAGUIRE", year: "1996" },
{quote: "Why don't you come up sometime and see me?", movie: "SHE DONE HIM WRONG", year: "1933" },
{quote: "I'm walking here! I'm walking here!", movie: "MIDNIGHT COWBOY", year: "1969" },
{quote: "Play it, Sam. Play 'As Time Goes By.'", movie: "CASABLANCA", year: "1942" },
{quote: "You can't handle the truth!", movie: "A FEW GOOD MEN", year: "1992" },
{quote: "I want to be alone.", movie: "GRAND HOTEL", year: "1932" },
{quote: "After all, tomorrow is another day!", movie: "GONE WITH THE WIND", year: "1939" },
{quote: "Round up the usual suspects.", movie: "CASABLANCA", year: "1942" },
{quote: "I'll have what she's having.", movie: "WHEN HARRY MET SALLY", year: "1989" },
{quote: "You know how to whistle, don't you, Steve? You just put your lips together and blow.", movie: "TO HAVE AND HAVE NOT", year: "1944" },
{quote: "You're gonna need a bigger boat.", movie: "JAWS", year: "1975" },
{quote: "Badges? We ain't got no badges! We don't need no badges! I don't have to show you any stinking badges!", movie: "THE TREASURE OF THE SIERRA MADRE", year: "1948" },
{quote: "I'll be back.", movie: "THE TERMINATOR", year: "1984" },
{quote: "Today, I consider myself the luckiest man on the face of the earth.", movie: "THE PRIDE OF THE YANKEES", year: "1942" },
{quote: "If you build it, he will come.", movie: "FIELD OF DREAMS", year: "1989" },
{quote: "My mama always said life was like a box of chocolates. You never know what you're gonna get.", movie: "FORREST GUMP", year: "1994" },
{quote: "We rob banks.", movie: "BONNIE AND CLYDE", year: "1967" },
{quote: "Plastics.", movie: "THE GRADUATE", year: "1967" },
{quote: "We'll always have Paris.", movie: "CASABLANCA", year: "1942" },
{quote: "I see dead people.", movie: "THE SIXTH SENSE", year: "1999" },
{quote: "Stella! Hey, Stella!", movie: "A STREETCAR NAMED DESIRE", year: "1951" },
{quote: "Oh, Jerry, don't let's ask for the moon. We have the stars.", movie: "NOW, VOYAGER", year: "1942" },
{quote: "Shane. Shane. Come back!", movie: "SHANE", year: "1953" },
{quote: "Well, nobody's perfect.", movie: "SOME LIKE IT HOT", year: "1959" },
{quote: "It's alive! It's alive!", movie: "FRANKENSTEIN", year: "1931" },
{quote: "Houston, we have a problem.", movie: "APOLLO 13", year: "1995" },
{quote: "You've got to ask yourself one question: 'Do I feel lucky?' Well, do ya, punk?", movie: "DIRTY HARRY", year: "1971" },
{quote: "You had me at 'hello.'", movie: "JERRY MAGUIRE", year: "1996" },
{quote: "One morning I shot an elephant in my pajamas. How he got in my pajamas, I don't know.", movie: "ANIMAL CRACKERS", year: "1930" },
{quote: "There's no crying in baseball!", movie: "A LEAGUE OF THEIR OWN", year: "1992" },
{quote: "La-dee-da, la-dee-da.", movie: "ANNIE HALL", year: "1977" },
{quote: "A boy's best friend is his mother.", movie: "PSYCHO", year: "1960" },
{quote: "Greed, for lack of a better word, is good.", movie: "WALL STREET", year: "1987" },
{quote: "Keep your friends close, but your enemies closer.", movie: "THE GODFATHER PART II", year: "1974" },
{quote: "As God is my witness, I'll never be hungry again.", movie: "GONE WITH THE WIND", year: "1939" },
{quote: "Well, here's another nice mess you've gotten me into!", movie: "SONS OF THE DESERT", year: "1933" },
{quote: "Say 'hello' to my little friend!", movie: "SCARFACE", year: "1983" },
{quote: "What a dump.", movie: "BEYOND THE FOREST", year: "1949" },
{quote: "Mrs. Robinson, you're trying to seduce me. Aren't you?", movie: "THE GRADUATE", year: "1967" },
{quote: "Gentlemen, you can't fight in here! This is the War Room!", movie: "DR. STRANGELOVE", year: "1964" },
{quote: "Elementary, my dear Watson.", movie: "THE ADVENTURES OF SHERLOCK HOLMES", year: "1939" },
{quote: "Take your stinking paws off me, you damned dirty ape.", movie: "PLANET OF THE APES", year: "1968" },
{quote: "Of all the gin joints in all the towns in all the world, she walks into mine.", movie: "CASABLANCA", year: "1942" },
{quote: "Here's Johnny!", movie: "THE SHINING", year: "1980" },
{quote: "They're here!", movie: "POLTERGEIST", year: "1982" },
{quote: "Is it safe?", movie: "MARATHON MAN", year: "1976" },
{quote: "Wait a minute, wait a minute. You ain't heard nothin' yet!", movie: "THE JAZZ SINGER", year: "1927" },
{quote: "No wire hangers, ever!", movie: "MOMMIE DEAREST", year: "1981" },
{quote: "Mother of mercy, is this the end of Rico?", movie: "LITTLE CAESAR", year: "1930" },
{quote: "Forget it, Jake, it's Chinatown.", movie: "CHINATOWN", year: "1974" },
{quote: "I have always depended on the kindness of strangers.", movie: "A STREETCAR NAMED DESIRE", year: "1951" },
{quote: "Hasta la vista, baby.", movie: "TERMINATOR 2: JUDGMENT DAY", year: "1991" },
{quote: "Soylent Green is people!", movie: "SOYLENT GREEN", year: "1973" },
{quote: "Open the pod bay doors, please, HAL.", movie: "2001: A SPACE ODYSSEY", year: "1968" },
{quote: "Striker: Surely you can't be serious. ", movie: "AIRPLANE!", year: "1980" },
{quote: "Rumack: I am serious...and don't call me Shirley.", movie: ", year: " },
{quote: "Yo, Adrian!", movie: "ROCKY", year: "1976" },
{quote: "Hello, gorgeous.", movie: "FUNNY GIRL", year: "1968" },
{quote: "Toga! Toga!", movie: "NATIONAL LAMPOON'S ANIMAL HOUSE", year: "1978" },
{quote: "Listen to them. Children of the night. What music they make.", movie: "DRACULA", year: "1931" },
{quote: "Oh, no, it wasn't the airplanes. It was Beauty killed the Beast.", movie: "KING KONG", year: "1933" },
{quote: "My precious.", movie: "THE LORD OF THE RINGS: TWO TOWERS", year: "2002" },
{quote: "Attica! Attica!", movie: "DOG DAY AFTERNOON", year: "1975" },
{quote: "Sawyer, you're going out a youngster, but you've got to come back a star!", movie: "42ND STREET", year: "1933" },
{quote: "Listen to me, mister. You're my knight in shining armor. Don't you forget it. You're going to get back on that horse, and I'm going to be right behind you, holding on tight, and away we're gonna go, go, go!", movie: "ON GOLDEN POND", year: "1981" },
{quote: "Tell 'em to go out there with all they got and win just one for the Gipper.", movie: "KNUTE ROCKNE ALL AMERICAN", year: "1940" },
{quote: "A martini. Shaken, not stirred.", movie: "GOLDFINGER", year: "1964" },
{quote: "Who's on first.", movie: "THE NAUGHTY NINETIES", year: "1945" },
{quote: "Cinderella story. Outta nowhere. A former greenskeeper, now, about to become the Masters champion. It looks like a mirac...It's in the hole! It's in the hole! It's in the hole!", movie: "CADDYSHACK", year: "1980" },
{quote: "Life is a banquet, and most poor suckers are starving to death!", movie: "AUNTIE MAME", year: "1958" },
{quote: "I feel the need - the need for speed!", movie: "TOP GUN", year: "1986" },
{quote: "Carpe diem. Seize the day, boys. Make your lives extraordinary.", movie: "DEAD POETS SOCIETY", year: "1989" },
{quote: "Snap out of it!", movie: "MOONSTRUCK", year: "1987" },
{quote: "My mother thanks you. My father thanks you. My sister thanks you. And I thank you.", movie: "YANKEE DOODLE DANDY", year: "1942" },
{quote: "Nobody puts Baby in a corner.", movie: "DIRTY DANCING", year: "1987" },
{quote: "I'll get you, my pretty, and your little dog, too!", movie: "WIZARD OF OZ, THE", year: "1939" },
{quote: "I'm the king of the world!", movie: "TITANIC", year: "1997" }
];

