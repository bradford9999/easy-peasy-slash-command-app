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
//const { SlackBotWorker } = require('botbuilder-adapter-slack');

//var movies = require('./movies.js');

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
var reportingInterval = "0 50 15 * * *";

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

scheduler(reportingInterval, function() {
    sendDailyBingImage();
    sendDailyMovieQuote();    
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

function sendDailyMovieQuote() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://hooks.slack.com/services/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", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(getMoviePayload(getRandomMovie())));

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
                                "type": "plain_text",
                                "text": copyright
                            }
                        }
                    }]
                }]
            };
}

function getRandomMovie() {
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
    return notUsed[index];
}

function getMoviePayload(movieObject) {
return {
                blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "plain_text",
                        "text": "\"" + movieObject.quote + "\""
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
                                "type": "plain_text",
                                "text": movieObject.movie
                            }
                        }
                    }]
                }]
            };
}

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
    //var quotes = movies.default;
    console.log(message);
        if(message.text.trim() === "") {
            slashCommand.replyPublic(message, getMoviePayload(getRandomMovie()));
            return;
        } else if(message.text.startsWith("add")) {
            var regex = /\[([^\]]*)\]/g;
            var messageSplit = message.text.match(regex);
            if(messageSplit.length === 2 ) {
            var moviename = messageSplit[0].replace("[","").replace("]","") + " submitted by:" + message.user_name;
            var moviequote = messageSplit[1].replace("[","").replace("]","");
            quotes.push( { quote: moviequote, movie: moviename } );
            slashCommand.res.end();
            slashCommand.replyPrivateDelayed(message, "Ive added the quote: " + moviequote + " from the movie: "+ moviename);
            return;
            }
        }
    default:
            slashCommand.res.end();
            slashCommand.replyPrivateDelayed(message, "Im afraid I dont know how to " + message.command + " "+ message.text + " yet.");
        //slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }
                    
});

quotes=[
{quote:"Look, Daddy. Teacher says, 'Every time a bell rings an angel gets his wings.'", movie:" IT'S A WONDERFUL LIFE, 1946"},
{quote:"Kid, the next time I say, 'Let's go someplace like Bolivia,' let's go someplace like Bolivia.", movie:" BUTCH CASSIDY AND THE SUNDANCE KID, 1969"},
{quote:"Looks like I picked the wrong week to stop sniffing glue.", movie:" AIRPLANE! Paramount, 1980"},
{quote:"The greatest trick the Devil ever pulled was convincing the world he didn't exist.", movie:" THE USUAL SUSPECTS Columbia, 1995"},
{quote:"Cinderella story. Outta nowhere. A former greenskeeper, now, about to become the Masters champion. It looks like a mirac... It's in the hole! It's in the hole! It's in the hole!", movie:" CADDYSHACK, 1980"},
{quote:"What is it you want, Mary? What do you want? You want the moon? Just say the word, and I'll throw a lasso around it and pull it down.", movie:" IT'S A WONDERFUL LIFE, 1946"},
{quote:"Listen to me, mister. You're my knight in shining armor. Don't you forget it. You're going to get back on that horse, and I'm going to be right behind you, holding on tight, and away we're gonna go, go, go!", movie:" ON GOLDEN POND, 1981"},
{quote:"This is the people's war! It is our war! We are the fighters! Fight it, then! Fight it with all that is in us, and may God defend the right.", movie:" MRS. MINIVER, 1942"},
{quote:"Fat, drunk, and stupid is no way to go through life, son.", movie:" NATIONAL LAMPOON'S ANIMAL HOUSE, 1978"},
{quote:"I'm here to fight for truth, justice, and the American way.", movie:" SUPERMAN, 1978"},
{quote:"You think I'm licked. You all think I'm licked. Well, I'm not licked. And I'm going to stay right here and fight for this lost cause. Even if this room gets filled with lies like these, and the Taylors and all their armies come marching into this place.", movie:" MR. SMITH GOES TO WASHINGTON, 1939"},
{quote:"In Switzerland, they had brotherly love, and they had 500 years of democracy and peace. And what did that produce? The cuckoo clock.", movie:" THE THIRD MAN, 1949"},
{quote:"I'll get you, my pretty, and your little dog, too!", movie:" THE WIZARD OF OZ, 1939"},
{quote:"Give me a whisky, ginger ale on the side. And don't be stingy, baby.", movie:" ANNA CHRISTIE, 1930"},
{quote:"It isn't that I don't like you, Susan, because after all, in moments of quiet, I'm strangely drawn toward you; but, well, there haven't been any quiet moments!", movie:" BRINGING UP BABY, 1938"},
{quote:"Ilsa, I'm no good at being noble, but it doesn't take much to see that the problems of three little people don't amount to a hill of beans in this crazy world.", movie:" CASABLANCA, 1942"},
{quote:"Mr. Allen, this may come as a shock to you, but there are some men who don't end every sentence with a proposition.", movie:" PILLOW TALK, 1959"},
{quote:"Sawyer, you're going out a youngster, but you've got to come back a star!", movie:" 42ND STREET, 1933"},
{quote:"Would you like me to tell you the little story of right hand, left hand? The story of good and evil? H-A-T-E. It was with this left hand that old brother Cain struck the blow that laid his brother low. L-O-V-E. You see these fingers, dear hearts? These fingers has veins that run straight to the soul of man - the right hand, friends, the hand of love.", movie:" THE NIGHT OF THE HUNTER, 1955"},
{quote:"...I believe in long, slow, deep, soft, wet kisses that last three days.", movie:" BULL DURHAM, 1988"},
{quote:"Well, I've wrestled with reality for thirty-five years, Doctor, and I'm happy to state I finally won out over it.", movie:" HARVEY, 1950"},
{quote:"Oh, Jerry, don't let's ask for the moon. We have the stars.", movie:" NOW, VOYAGER, 1942"},
{quote:"Captain, it is I, Ensign Pulver, and I just threw your stinking palm tree overboard. Now, what's all this crud about no movie tonight?", movie:" MISTER ROBERTS, 1955"},
{quote:"Et cetera, et cetera, et cetera.", movie:" THE KING AND I, 1956"},
{quote:"One, two, Freddy's coming for you...", movie:" A NIGHTMARE ON ELM STREET, 1984"},
{quote:"You're lit from within, Tracy. You've got fires banked down in you, hearth-fires and holocausts.", movie:" THE PHILADELPHIA STORY, 1940"},
{quote:"My biological clock is ticking like this, and the way this case is going, I ain't never getting married!", movie:" MY COUSIN VINNY, 1992"},
{quote:"Frankly, my dear, I don't give a damn.", movie:"GONE WITH THE WIND, 1939"},
{quote:"But because I am mad, I hate you. Because I am mad, I have betrayed you. And because I'm mad, I'm rejoicing in my heart, without a shred of pity, without a shred of regret, watching you go with glory in my heart!", movie:" GASLIGHT, 1940"},
{quote:"What do they think I am, dumb or something? Why, I make more money than Calvin Coolidge! Put together!", movie:" SINGIN' IN THE RAIN, 1952"},
{quote:"All right, Mr. DeMille, I'm ready for my close-up.", movie:"SUNSET BOULEVARD, 1950"},
{quote:"Greed, for lack of a better word, is good.", movie:" WALL STREET, 1987"},
{quote:"Oh, no, it wasn't the airplanes. It was Beauty killed the Beast.", movie:" KING KONG, 1933"},
{quote:"Well, it's not the men in your life that counts, it's the life in your men.", movie:" I'M NO ANGEL, 1933"},
{quote:"Watch the skies, everywhere, keep looking! Keep watching the skies!", movie:" THE THING FROM ANOTHER WORLD, 1951"},
{quote:"Hey, Bud, let's party!", movie:" FAST TIMES AT RIDGEMONT HIGH, 1982"},
{quote:"You see, François, marriage is a beautiful mistake which two people make together. But with you, François, I think it would be a mistake.", movie:" TROUBLE IN PARADISE, 1932"},
{quote:"Oh, Moses, Moses, you stubborn, splendid, adorable fool!", movie:" THE TEN COMMANDMENTS, 1956"},
{quote:"Open the pod bay doors, HAL.", movie:" 2001: A SPACE ODYSSEY, 1968"},
{quote:"Hello, everybody. This is Mrs. Norman Maine.", movie:" A STAR IS BORN, 1954"},
{quote:"Stella! Hey, Stella!", movie:" A STREETCAR NAMED DESIRE, 1951"},
{quote:"Get away from her, you bitch!", movie:" ALIENS, 1986"},
{quote:"Sometimes there's so much beauty in the world I feel like I can't take it, like my heart's going to cave in.", movie:" AMERICAN BEAUTY, 1999"},
{quote:"Oh, it was nobody's fault but my own. I was looking up. It was the nearest thing to heaven. You were there.", movie:" AN AFFAIR TO REMEMBER, 1957"},
{quote:"One morning I shot an elephant in my pajamas. How he got in my pajamas, I don't know.", movie:" ANIMAL CRACKERS, 1930"},
{quote:"La-dee-da, la-dee-da.", movie:" ANNIE HALL, 1977"},
{quote:"Houston, we have a problem.", movie:" APOLLO 13, 1995"},
{quote:"Life is a banquet, and most poor suckers are starving to death!", movie:" AUNTIE MAME, 1958"},
{quote:"Yeah, baby!", movie:" AUSTIN POWERS: INTERNATIONAL MAN OF MYSTERY, 1997"},
{quote:"That'll do, pig. That'll do.", movie:" BABE, 1995"},
{quote:"I'm the ghost with the most, babe.", movie:" BEETLEJUICE, 1988"},
{quote:"Okay, but I get to be on top.", movie:" BIG, 1988"},
{quote:"I've seen things you people wouldn't believe. Attack ships on fire off the shoulder of Orion. I watched C-beams glitter in the dark near the Tannhauser gate. All those moments will be lost in time, like tears in rain. Time to die.", movie:" BLADE RUNNER, 1982"},
{quote:"That dirty, double-crossin' rat!", movie:" BLONDE CRAZY, 1931"},
{quote:"Wouldja do me a favor, Harry? Drop dead!", movie:" BORN YESTERDAY, 1950"},
{quote:"They may take away our lives, but they'll never take our freedom!", movie:" BRAVEHEART, 1995"},
{quote:"Mama, face it. I was the slut of all time.", movie:" BUTTERFIELD 8, 1960"},
{quote:"I'd love to kiss you, but I just washed my hair.", movie:" CABIN IN THE COTTON, 1932"},
{quote:"Louis, I think this is the beginning of a beautiful friendship.", movie:" CASABLANCA, 1942"},
{quote:"Play it, Sam. Play 'As Time Goes By.'", movie:" CASABLANCA, 1942"},
{quote:"Of all the gin joints in all the towns in all the world, she walks into mine.", movie:" CASABLANCA, 1942"},
{quote:"For the first time in my life, people cheering for me. Were you deaf? Didn't you hear 'em? We're not hitchhiking any more. We're riding.", movie:" CHAMPION, 1949"},
{quote:"Forget it, Jake. It's Chinatown.", movie:" CHINATOWN, 1974"},
{quote:"Carpe diem. Seize the day, boys. Make your lives extraordinary.", movie:" DEAD POETS SOCIETY, 1989"},
{quote:"Yippie-ki-yay, mother******!", movie:" DIE HARD, 1988"},
{quote:"Gentlemen, you can't fight in here! This is the War Room!", movie:" DR. STRANGELOVE, 1964"},
{quote:"Hoke, you're my best friend.", movie:" DRIVING MISS DAISY, 1989"},
{quote:"I could dance with you 'til the cows come home. On second thought, I'd rather dance with the cows 'til you came home.", movie:" DUCK SOUP, 1933"},
{quote:"You know, Billy. We blew it.", movie:" EASY RIDER, 1969"},
{quote:"They're called boobs, Ed.", movie:" ERIN BROCKOVICH, 2000"},
{quote:"I won't be ignored, Dan!", movie:" FATAL ATTRACTION, 1987"},
{quote:"Life moves pretty fast. If you don't stop and look around once in a while, you could miss it.", movie:" FERRIS BUELLER'S DAY OFF, 1986"},
{quote:"If you build it, he will come.", movie:" FIELD OF DREAMS, 1989"},
{quote:"I do not know how to kiss, or I would kiss you. Where do the noses go?", movie:" FOR WHOM THE BELL TOLLS, 1943"},
{quote:"My mama always said, 'Life is like a box of chocolates. You never know what you're gonna get.'", movie:" FORREST GUMP, 1994"},
{quote:"Mama says, 'Stupid is as stupid does.'", movie:" FORREST GUMP, 1994"},
{quote:"Face it girls, I'm older and I have more insurance.", movie:" FRIED GREEN TOMATOES, 1991"},
{quote:"Hello, gorgeous.", movie:" FUNNY GIRL, 1968"},
{quote:"If you are a minority of one, the truth is the truth.", movie:" GANDHI, 1982"},
{quote:"I always say a kiss on the hand might feel very good, but a diamond tiara lasts forever.", movie:" GENTLEMEN PREFER BLONDES, 1953"},
{quote:"If I'd been a ranch, they would've named me the Bar Nothing.", movie:" GILDA, 1946"},
{quote:"Father to a murdered son. Husband to a murdered wife. And I will have my vengeance, in this life or the next.", movie:" GLADIATOR, 2000"},
{quote:"A martini. Shaken, not stirred.", movie:" GOLDFINGER, 1964"},
{quote:"After all, tomorrow is another day!", movie:" GONE WITH THE WIND, 1939"},
{quote:"As God is my witness, I'll never be hungry again.", movie:" GONE WITH THE WIND, 1939"},
{quote:"Good morning, Vietnam!", movie:" GOOD MORNING, VIETNAM, 1987"},
{quote:"We go together, Laurie. I don't know why. Maybe like guns and ammunition go together.", movie:" GUN CRAZY, 1949"},
{quote:"You're a better man than I am, Gunga Din.", movie:" GUNGA DIN, 1939"},
{quote:"L-I-V-E! Live! Otherwise, you got nothing to talk about in the locker room.", movie:" HAROLD AND MAUDE, 1971"},
{quote:"Men like my father cannot die. They are with me still -- real in memory as they were in flesh, loving and beloved forever. How green was my valley then.", movie:" HOW GREEN WAS MY VALLEY, 1941"},
{quote:"I'll remember you, honey. You're the one that got away.", movie:" HUD, 1963"},
{quote:"Well, I proved once and for all that the limb is mightier than the thumb.", movie:" IT HAPPENED ONE NIGHT, 1934"},
{quote:"To my big brother George, the richest man in town!", movie:" IT'S A WONDERFUL LIFE, 1946"},
{quote:"And for an hour, for an hour - I'm the best actress in the world...", movie:" KLUTE, 1971"},
{quote:"In my case, self-absorption is completely justified. I have never discovered any other subject so worthy of my attention.", movie:" LAURA, 1944"},
{quote:"Mother of mercy, is this the end of Rico?", movie:" LITTLE CAESAR, 1930"},
{quote:"I think people should mate for life, like pigeons or Catholics.", movie:" MANHATTAN, 1979"},
{quote:"I have nipples, Greg. Could you milk me?", movie:" MEET THE PARENTS, 2000"},
{quote:"Personally, Veda's convinced me that alligators have the right idea. They eat their young.", movie:" MILDRED PIERCE, 1945"},
{quote:"No wire hangers, ever!", movie:" MOMMIE DEAREST, 1981"},
{quote:"Over? Did you say 'over?' Nothing is over until we decide it is! Was it over when the Germans bombed Pearl Harbor? Hell, no!", movie:" NATIONAL LAMPOON'S ANIMAL HOUSE, 1978"},
{quote:"I'm as mad as hell, and I'm not going to take this anymore!", movie:" NETWORK, 1976"},
{quote:"Ninotchka, it's midnight. One half of Paris is making love to the other half.", movie:" NINOTCHKA, 1939"},
{quote:"The last miracle I did was the 1969 Mets. Before that, I think you have to go back to the Red Sea.", movie:" OH, GOD!, 1977"},
{quote:"Come here, Norman. Hurry up. The loons! The loons! They're welcoming us back.", movie:" ON GOLDEN POND, 1981"},
{quote:"You know, maybe I was wrong and luck is like love. You have to go all the way to find it.", movie:" OUT OF THE PAST, 1947"},
{quote:"Not much meat on her, but what's there is choice.", movie:" PAT AND MIKE, 1952"},
{quote:"Now, I want you to remember that no bastard ever won a war by dying for his country. He won it by making the other poor dumb bastard die for his country.", movie:" PATTON, 1970"},
{quote:"I know you are, but what am I?", movie:" PEE-WEE'S BIG ADVENTURE, 1985"},
{quote:"Get your stinking paws off me, you damned dirty ape!", movie:" PLANET OF THE APES, 1968"},
{quote:"I did join the Army, but I joined a different Army. I joined the one with the condos and the private rooms.", movie:" PRIVATE BENJAMIN, 1980"},
{quote:"Yo, Adrian!", movie:" ROCKY, 1976"},
{quote:"I gave her my heart, and she gave me a pen.", movie:" SAY ANYTHING..., 1989"},
{quote:"Never apologize and never explain, it's a sign of weakness.", movie:" SHE WORE A YELLOW RIBBON, 1949"},
{quote:"Magic Mirror on the wall, who is the fairest one of all?", movie:" SNOW WHITE AND THE SEVEN DWARFS, 1937"},
{quote:"Well, nobody's perfect.", movie:" SOME LIKE IT HOT, 1959"},
{quote:"Look at that! Look how she moves. That's just like Jell-O on springs. She must have some sort of built-in motor. I tell you, it's a whole different sex!", movie:" SOME LIKE IT HOT, 1959"},
{quote:"Well, here's another nice mess you've gotten me into!", movie:" SONS OF THE DESERT, 1933"},
{quote:"Nobody has ever escaped from Stalag 17. Not alive, anyway.", movie:" STALAG 17, 1953"},
{quote:"Do, or do not. There is no try.", movie:" STAR WARS V: THE EMPIRE STRIKES BACK, 1980"},
{quote:"Help me, Obi-Wan Kenobi. You're my only hope.", movie:" STAR WARS, 1977"},
{quote:"There's a lot to be said for making people laugh. Did you know that's all some people have? It isn't much, but it's better than nothing in this cockeyed caravan. Boy!", movie:" SULLIVAN'S TRAVELS, 1941"},
{quote:"Match me, Sidney.", movie:" SWEET SMELL OF SUCCESS, 1957"},
{quote:"Vegas, baby.", movie:" SWINGERS, 1996"},
{quote:"You're so money, and you don't even know it.", movie:" SWINGERS, 1996"},
{quote:"Years from now, when you talk about this and you will -- be kind.", movie:" TEA AND SYMPATHY, 1956"},
{quote:"Hasta la vista, baby.", movie:" TERMINATOR 2: JUDGMENT DAY, 1991"},
{quote:"Georgia, love is for the very young.", movie:" THE BAD AND THE BEAUTIFUL, 1952"},
{quote:"Don't mess with the bull, young man. You'll get the horns!", movie:" THE BREAKFAST CLUB, 1985"},
{quote:"In spite of everything, I still believe that people are really good at heart.", movie:" THE DIARY OF ANNE FRANK, 1959"},
{quote:"Keep your friends close, but your enemies closer.", movie:" THE GODFATHER: PART II, 1974"},
{quote:"I know it was you, Fredo. You broke my heart. You broke my heart.", movie:" THE GODFATHER: PART II, 1974"},
{quote:"Michael, we're bigger than U.S. Steel.", movie:" THE GODFATHER: PART II, 1974"},
{quote:"Just when I thought I was out, they pull me back in.", movie:" THE GODFATHER: PART III, 1990"},
{quote:"Mrs. Robinson, you're trying to seduce me. Aren't you?", movie:" THE GRADUATE, 1967"},
{quote:"Wherever there's a fight so hungry people can eat, I'll be there.", movie:" THE GRAPES OF WRATH, 1940"},
{quote:"If it weren't for graft, you'd get a very low type of people in politics.", movie:" THE GREAT McGINTY, 1940"},
{quote:"Out here, due process is a bullet.", movie:" THE GREEN BERETS, 1968"},
{quote:"Eddie, you're a born loser.", movie:" THE HUSTLER, 1961"},
{quote:"To God, there is no zero. I still exist.", movie:" THE INCREDIBLE SHRINKING MAN, 1957"},
{quote:"Wait a minute, wait a minute. You ain't heard nothin' yet!", movie:" THE JAZZ SINGER, 1927"},
{quote:"Wax-on, wax-off.", movie:" THE KARATE KID, 1984"},
{quote:"Hey, lady!", movie:" THE LADIES' MAN, 1961"},
{quote:"Hi-Yo, Silver!", movie:" THE LONE RANGER, 1956"},
{quote:"One drink's too many, and a hundred's not enough.", movie:" THE LOST WEEKEND, 1945"},
{quote:"You're good, you're very good.", movie:" THE MALTESE FALCON, 1941"},
{quote:"I cannot stand little notes on my pillow! 'We are all out of cornflakes, F.U.' It took me three hours to figure out F.U. was Felix Unger.", movie:" THE ODD COUPLE, 1968"},
{quote:"Dyin' ain't much of a living, boy.", movie:" THE OUTLAW JOSEY WALES, 1976"},
{quote:"Chivalry is not only dead, it's decomposed.", movie:" THE PALM BEACH STORY, 1942"},
{quote:"With my brains and your looks, we could go places.", movie:" THE POSTMAN ALWAYS RINGS TWICE, 1946"},
{quote:"Today, I consider myself the luckiest man on the face of the earth.", movie:" THE PRIDE OF THE YANKEES, 1942"},
{quote:"Not many people know it, but the Führer was a terrific dancer.", movie:" THE PRODUCERS, 1968"},
{quote:"Let's go home, Debbie.", movie:" THE SEARCHERS, 1956"},
{quote:"Get busy livin', or get busy dyin'.", movie:" THE SHAWSHANK REDEMPTION, 1994"},
{quote:"I do wish we could chat longer, but I'm having an old friend for dinner.", movie:" THE SILENCE OF THE LAMBS, 1991"},
{quote:"If you wanna call me that, smile.", movie:" THE VIRGINIAN, 1929"},
{quote:"Warriors, come out to play!", movie:" THE WARRIORS, 1979"},
{quote:"If they move, kill 'em.", movie:" THE WILD BUNCH, 1969"},
{quote:"I'm melting! Melting! Oh, what a world! What a world!", movie:" THE WIZARD OF OZ, 1939"},
{quote:"Lions and tigers and bears, oh my!", movie:" THE WIZARD OF OZ, 1939"},
{quote:"There's a name for you ladies, but it isn't used in high society -- outside of a kennel.", movie:" THE WOMEN, 1939"},
{quote:"I have come here to chew bubble gum and kick ass, and I'm all out of bubble gum.", movie:" THEY LIVE, 1988"},
{quote:"What he did to Shakepeare, we are doing now to Poland.", movie:" TO BE OR NOT TO BE, 1942"},
{quote:"Miss Jean Louise, stand up. Your father's passing.", movie:" TO KILL A MOCKINGBIRD, 1962"},
{quote:"You never really understand a person until you consider things from his point of view, until you climb inside of his skin and walk around in it.", movie:" TO KILL A MOCKINGBIRD, 1962"},
{quote:"Fill your hands, you son-of-a-bitch!", movie:" TRUE GRIT, 1969"},
{quote:"Made it, Ma! Top of the world!", movie:" WHITE HEAT, 1949"},
{quote:"Women should be kept illiterate and clean, like canaries.", movie:" WOMAN OF THE YEAR, 1942"},
{quote:"Here's looking at you, kid.", movie:"CASABLANCA, 1942"},
{quote:"Go ahead, make my day.", movie:"SUDDEN IMPACT, 1983"},
{quote:"Elementary, my dear Watson.", movie:"THE ADVENTURES OF SHERLOCK HOLMES, 1939"},
{quote:"Toto, I've got a feeling we're not in Kansas anymore.", movie:"THE WIZARD OF OZ, 1939"},
{quote:"Oh, Frank, my lips are hot. Kiss my hot lips.", movie:" M*A*S*H, 1970"},
{quote:"Gobble gobble, gobble gobble. We accept her. One of us, one of us.", movie:" FREAKS, 1932"},
{quote:"Are you gonna bark all day, little doggie, or are you gonna bite?", movie:" RESERVOIR DOGS, 1992"},
{quote:"All-righty then!", movie:" ACE VENTURA, PET DETECTIVE, 1994"},
{quote:"This is the West, sir. When the legend becomes fact, print the legend.", movie:" THE MAN WHO SHOT LIBERTY VALANCE, 1962"},
{quote:"You've got to ask yourself one question: 'Do I feel lucky?' Well, do ya, punk?", movie:" DIRTY HARRY, 1971"},
{quote:"Sherif Ali, so long as the Arabs fight tribe against tribe, so long will they be a little people, a silly people, greedy, barbarous, and cruel as you are.", movie:" LAWRENCE OF ARABIA, 1962"},
{quote:"You know how to whistle, don't you, Steve? You just put your lips together and blow.", movie:" TO HAVE AND HAVE NOT, 1944"},
{quote:"Ah, but the strawberries! That's, that's where I had them.", movie:" THE CAINE MUTINY, 1954"},
{quote:"I love him because he's the kind of guy who gets drunk on a glass of buttermilk, and I love the way he blushes right up over his ears. I love him because he doesn't know how to kiss, the jerk!", movie:" BALL OF FIRE, 1941"},
{quote:"I wouldn't give you two cents for all your fancy rules if, behind them, they didn't have a little bit of plain, ordinary, everyday kindness and a little looking out for the other fella, too.", movie:" MR. SMITH GOES TO WASHINGTON, 1939"},
{quote:"That's what I love about these high school girls, man. I keep getting older, they stay the same age.", movie:" DAZED AND CONFUSED, 1993"},
{quote:"No matter what I ever do or say, Heathcliff, this is me -- now -- standing on this hill with you. This is me, forever.", movie:" WUTHERING HEIGHTS, 1939"},
{quote:"Come out, come out, wherever you are!", movie:" CAPE FEAR, 1991"},
{quote:"Remember, you're fighting for this woman's honor, which is probably more than she ever did.", movie:" DUCK SOUP, 1933"},
{quote:"You don't understand! I could've had class. I could've been a contender. I could've been somebody, instead of a bum, which is what I am.", movie:"ON THE WATERFRONT, 1954"},
{quote:"Yes, it used to be beautiful -- what with the rackets, whoring, guns.", movie:" ATLANTIC CITY, 1981"},
{quote:"Dave, stop. Stop, will you? Stop, Dave. Will you stop, Dave? Stop, Dave. I'm afraid.", movie:" 2001: A SPACE ODYSSEY, 1968"},
{quote:"When's the last time you picked your feet, Willy? Who's your connection, Willy? What's his name? I've got a man in Poughkeepsie who wants to talk to you. You ever been to Poughkeepsie?", movie:" THE FRENCH CONNECTION, 1971"},
{quote:"But, in the opinion of the court, you are not only sane but you're the sanest man that ever walked into this courtroom.", movie:" MR. DEEDS GOES TO TOWN, 1936"},
{quote:"Good night, you princes of Maine, you kings of New England.", movie:" THE CIDER HOUSE RULES, 1999"},
{quote:"It's amazing, Molly. The love inside, you take it with you.", movie:" GHOST, 1990"},
{quote:"Would you be shocked if I put on something more comfortable?", movie:" HELL'S ANGELS, 1930"},
{quote:"And our bodies are earth. And our thoughts are clay. And we sleep and eat with death.", movie:" ALL QUIET ON THE WESTERN FRONT, 1930"},
{quote:"It's alive! It's alive!", movie:" FRANKENSTEIN, 1931"},
{quote:"Listen to them. Children of the night. What music they make.", movie:" DRACULA, 1931"},
{quote:"I ain't so tough.", movie:" THE PUBLIC ENEMY, 1931"},
{quote:"I want to be alone.", movie:" GRAND HOTEL, 1932"},
{quote:"Jane. Tarzan. Jane. Tarzan.", movie:" TARZAN THE APE MAN, 1932"},
{quote:"It took more than one man to change my name to Shanghai Lily.", movie:" SHANGHAI EXPRESS, 1932"},
{quote:"Why don't you come up sometime and see me?", movie:" SHE DONE HIM WRONG, 1933"},
{quote:"Chance is the fool's name for fate.", movie:" THE GAY DIVORCEE, 1934"},
{quote:"Mr. Christian!", movie:" MUTINY ON THE BOUNTY, 1935"},
{quote:"We belong dead.", movie:" BRIDE OF FRANKENSTEIN, 1935"},
{quote:"His eyes have made love to me all evening.", movie:" CAMILLE, 1936"},
{quote:"Never give a sucker an even break.", movie:" POPPY, 1936"},
{quote:"The calla lilies are in bloom again.", movie:" STAGE DOOR, 1937"},
{quote:"There is no bad boy.", movie:" BOYS TOWN, 1938"},
{quote:"There's no place like home.", movie:" THE WIZARD OF OZ, 1939"},
{quote:"Fiddle-dee-dee.", movie:" GONE WITH THE WIND, 1939"},
{quote:"I don't know nothin' 'bout birthin' babies.", movie:" GONE WITH THE WIND, 1939"},
{quote:"Pay no attention to that man behind the curtain!", movie:" THE WIZARD OF OZ, 1939"},
{quote:"Sanctuary!", movie:" THE HUNCHBACK OF NOTRE DAME, 1939"},
{quote:"A lie keeps growing and growing until it's as clear as the nose on your face.", movie:" PINOCCHIO, 1940"},
{quote:"Last night I dreamt I went to Manderley again.", movie:" REBECCA, 1940"},
{quote:"Tell 'em to go out there with all they got and win just one for the Gipper.", movie:" KNUTE ROCKNE ALL AMERICAN, 1940"},
{quote:"I need him like the axe needs the turkey.", movie:" THE LADY EVE, 1941"},
{quote:"Rosebud.", movie:" CITIZEN KANE, 1941"},
{quote:"The stuff that dreams are made of.", movie:" THE MALTESE FALCON, 1941"},
{quote:"Why don't you get out of that wet coat and into a dry martini?", movie:" THE MAJOR AND THE MINOR, 1942"},
{quote:"Round up the usual suspects.", movie:" CASABLANCA, 1942"},
{quote:"We'll always have Paris.", movie:" CASABLANCA, 1942"},
{quote:"My mother thanks you. My father thanks you. My sister thanks you. And I thank you.", movie:" YANKEE DOODLE DANDY, 1942"},
{quote:"Where's the rest of me?", movie:" KINGS ROW, 1942"},
{quote:"You're my Lassie come home.", movie:" LASSIE COME HOME, 1943"},
{quote:"I can't believe it. Right here where we live - right here in St. Louis.", movie:" MEET ME IN ST. LOUIS, 1944"},
{quote:"Insanity runs in my family. It practically gallops.", movie:" ARSENIC AND OLD LACE, 1944"},
{quote:"Stop makin' noises like a husband.", movie:" DETOUR, 1945"},
{quote:"Who's on first.", movie:" THE NAUGHTY NINETIES, 1945"},
{quote:"There are only two things more beautiful than a good gun -- a Swiss watch and a woman from anywhere.", movie:" RED RIVER, 1948"},
{quote:"There are eight million stories in the naked city. This has been one of them.", movie:" THE NAKED CITY, 1948"},
{quote:"Badges? We ain't got no badges! We don't need no badges! I don't have to show you any stinking badges!", movie:" THE TREASURE OF THE SIERRA MADRE, 1948"},
{quote:"What a dump.", movie:" BEYOND THE FOREST, 1949"},
{quote:"I was born when she kissed me. I died when she left me. I lived a few weeks while she loved me.", movie:" IN A LONELY PLACE, 1950"},
{quote:"I am big! It's the pictures that got small.", movie:" SUNSET BOULEVARD, 1950"},
{quote:"We didn't need dialogue. We had faces.", movie:" SUNSET BOULEVARD, 1950"},
{quote:"Fasten your seatbelts. It's going to be a bumpy night.", movie:"ALL ABOUT EVE, 1950"},
{quote:"I love you. I've loved you since the first moment I saw you. I guess maybe I've even loved you before I saw you.", movie:" A PLACE IN THE SUN, 1951"},
{quote:"Gort! Klaatu barada nikto!", movie:" THE DAY THE EARTH STOOD STILL, 1951"},
{quote:"I have always depended on the kindness of strangers.", movie:" A STREETCAR NAMED DESIRE, 1951"},
{quote:"We're sisters under the mink.", movie:" THE BIG HEAT, 1953"},
{quote:"Shane! Shane! Come back!", movie:" SHANE, 1953"},
{quote:"Do you want a leg or a breast?", movie:" TO CATCH A THIEF, 1955"},
{quote:"You're tearing me apart!", movie:" REBEL WITHOUT A CAUSE, 1955"},
{quote:"They're here already! You're next! You're next!", movie:" INVASION OF THE BODY SNATCHERS, 1956"},
{quote:"The pellet with the poison's in the vessel with the pestle. The chalice from the palace has the brew that is true.", movie:" THE COURT JESTER, 1956"},
{quote:"Madness. Madness.", movie:" THE BRIDGE ON THE RIVER KWAI, 1957"},
{quote:"Help me! Help me!", movie:" THE FLY, 1958"},
{quote:"He was some kind of a man. What does it matter what you say about people?", movie:" TOUCH OF EVIL, 1958"},
{quote:"A boy's best friend is his mother.", movie:" PSYCHO, 1960"},
{quote:"We all go a little mad sometimes.", movie:" PSYCHO, 1960"},
{quote:"Shut up and deal.", movie:" THE APARTMENT, 1960"},
{quote:"I'm Spartacus! I'm Spartacus!", movie:" SPARTACUS, 1960"},
{quote:"How do I look?", movie:" BREAKFAST AT TIFFANY'S, 1961"},
{quote:"No prisoners! No prisoners!", movie:" LAWRENCE OF ARABIA, 1962"},
{quote:"Bond. James Bond.", movie:" DR. NO, 1962"},
{quote:"Mein Führer! I can walk!", movie:" DR. STRANGELOVE, 1964"},
{quote:"And that's how you play 'Get the Guests.'", movie:" WHO'S AFRAID OF VIRGINIA WOOLF?, 1966"},
{quote:"You think of yourself as a colored man. I think of myself as a man.", movie:" GUESS WHO'S COMING TO DINNER, 1967"},
{quote:"Plastics.", movie:" THE GRADUATE, 1967"},
{quote:"They call me Mister Tibbs!", movie:" IN THE HEAT OF THE NIGHT, 1967"},
{quote:"What we've got here is failure to communicate.", movie:" COOL HAND LUKE, 1967"},
{quote:"We rob banks.", movie:" BONNIE AND CLYDE, 1967"},
{quote:"This isn't a dream! This is really happening!", movie:" ROSEMARY'S BABY, 1968"},
{quote:"I'm walking here! I'm walking here!", movie:" MIDNIGHT COWBOY, 1969"},
{quote:"Love means never having to say you're sorry.", movie:" LOVE STORY, 1970"},
{quote:"I'm going to make him an offer he can't refuse.", movie:"THE GODFATHER, 1972"},
{quote:"It's a Sicilian message. It means Luca Brasi sleeps with the fishes.", movie:" THE GODFATHER, 1972"},
{quote:"Leave the gun. Take the cannolis.", movie:" THE GODFATHER, 1972"},
{quote:"I bet you can squeal like a pig.", movie:" DELIVERANCE, 1972"},
{quote:"Can you dig it?", movie:" SUPERFLY, 1972"},
{quote:"Soylent Green is people!", movie:" SOYLENT GREEN, 1973"},
{quote:"What an excellent day for an exorcism.", movie:" THE EXORCIST, 1973"},
{quote:"She's my sister! She's my daughter!", movie:" CHINATOWN, 1974"},
{quote:"What hump?", movie:" YOUNG FRANKENSTEIN, 1974"},
{quote:"Excuse me while I whip this out.", movie:" BLAZING SADDLES, 1974"},
{quote:"You're gonna need a bigger boat.", movie:" JAWS, 1975"},
{quote:"Attica! Attica!", movie:" DOG DAY AFTERNOON, 1975"},
{quote:"You talkin' to me?", movie:" TAXI DRIVER, 1976"},
{quote:"Is it safe?", movie:" MARATHON MAN, 1976"},
{quote:"Non!", movie:" SILENT MOVIE, 1976"},
{quote:"Does your dog bite?", movie:" THE PINK PANTHER STRIKES AGAIN, 1976"},
{quote:"Follow the money.", movie:" ALL THE PRESIDENT'S MEN, 1976"},
{quote:"May the Force be with you.", movie:"STAR WARS, 1977"},
{quote:"I don't want to move to a city where the only cultural advantage is being able to make a right turn on a red light.", movie:" ANNIE HALL, 1977"},
{quote:"Toga! Toga!", movie:" NATIONAL LAMPOON'S ANIMAL HOUSE, 1978"},
{quote:"This is this.", movie:" THE DEER HUNTER, 1978"},
{quote:"Have you checked the children lately?", movie:" WHEN A STRANGER CALLS, 1979"},
{quote:"It's showtime!", movie:" ALL THAT JAZZ, 1979"},
{quote:"I love the smell of napalm in the morning.", movie:" APOCALYPSE NOW, 1979"},
{quote:"I like to watch.", movie:" BEING THERE, 1979"},
{quote:"I was born a poor black child.", movie:" THE JERK, 1979"},
{quote:"Be the ball.", movie:" CADDYSHACK, 1980"},
{quote:"I am not an animal! I am a human being. I am a man.", movie:" THE ELEPHANT MAN, 1980"},
{quote:"I am your father.", movie:" STAR WARS V: THE EMPIRE STRIKES BACK, 1980"},
{quote:"We're on a mission from God.", movie:" THE BLUES BROTHERS, 1980"},
{quote:"Here's Johnny!", movie:" THE SHINING, 1980"},
{quote:"It's good to be the king!", movie:" HISTORY OF THE WORLD: PART I, 1981"},
{quote:"You aren't too bright. I like that in a man.", movie:" BODY HEAT, 1981"},
{quote:"They're here!", movie:" POLTERGEIST, 1982"},
{quote:"E.T. phone home.", movie:" E.T.: THE EXTRA-TERRESTRIAL, 1982"},
{quote:"You'll shoot your eye out.", movie:" A CHRISTMAS STORY, 1983"},
{quote:"Would you like to play a game?", movie:" WARGAMES, 1983"},
{quote:"Better to be king for a night than schmuck for a lifetime.", movie:" THE KING OF COMEDY, 1983"},
{quote:"Say 'hello' to my little friend!", movie:" SCARFACE, 1983"},
{quote:"I've been slimed.", movie:" GHOSTBUSTERS, 1984"},
{quote:"We came. We saw. We kicked its ass.", movie:" GHOSTBUSTERS, 1984"},
{quote:"These go to eleven.", movie:" THIS IS SPINAL TAP, 1984"},
{quote:"I'll be back.", movie:" THE TERMINATOR, 1984"},
{quote:"There are simply too many notes.", movie:" AMADEUS, 1984"},
{quote:"Roads? Where we're going we don't need roads.", movie:" BACK TO THE FUTURE, 1985"},
{quote:"I had a farm in Africa.", movie:" OUT OF AFRICA, 1985"},
{quote:"I think it pisses God off when you walk by the color purple in a field and don't notice it.", movie:" THE COLOR PURPLE, 1985"},
{quote:"Please-baby-please-baby-please-baby-baby-baby. Please!", movie:" SHE'S GOTTA HAVE IT, 1986"},
{quote:"Be afraid. Be very afraid.", movie:" THE FLY, 1986"},
{quote:"Nobody puts Baby in a corner.", movie:" DIRTY DANCING, 1987"},
{quote:"Snap out of it!", movie:" MOONSTRUCK, 1987"},
{quote:"Snakes! Why did it have to be snakes?", movie:" RAIDERS OF THE LOST ARK, 1987"},
{quote:"I'll meet you at the place near the thing where we went that time.", movie:" BROADCAST NEWS, 1987"},
{quote:"I'll be taking these Huggies and whatever cash you got.", movie:" RAISING ARIZONA, 1987"},
{quote:"Hello. My name is Inigo Montoya. You killed my father. Prepare to die!", movie:" THE PRINCESS BRIDE, 1987"},
{quote:"What is your major malfunction?", movie:" FULL METAL JACKET, 1987"},
{quote:"I'm not bad. I'm just drawn that way.", movie:" WHO FRAMED ROGER RABBIT, 1988"},
{quote:"I have a head for business and a bod for sin.", movie:" WORKING GIRL, 1988"},
{quote:"I'm an excellent driver.", movie:" RAIN MAN, 1988"},
{quote:"The dingo took my baby!", movie:" A CRY IN THE DARK, 1988"},
{quote:"I'll have what she's having.", movie:" WHEN HARRY MET SALLY..., 1989"},
{quote:"Excellent!", movie:" BILL AND TED'S EXCELLENT ADVENTURE, 1989"},
{quote:"Have you ever danced with the Devil in the pale moonlight?", movie:" BATMAN, 1989"},
{quote:"I am your number one fan.", movie:" MISERY, 1990"},
{quote:"I want the fairy tale.", movie:" PRETTY WOMAN, 1990"},
{quote:"Funny like I'm a clown? I amuse you?", movie:" GOODFELLAS, 1990"},
{quote:"A census taker once tried to test me. I ate his liver with some fava beans and a nice chianti.", movie:" THE SILENCE OF THE LAMBS, 1991"},
{quote:"Why don't you go outside and jerk yourself a soda?", movie:" BUGSY, 1991"},
{quote:"You can't handle the truth!", movie:" A FEW GOOD MEN, 1992"},
{quote:"There's no crying in baseball!", movie:" A LEAGUE OF THEIR OWN, 1992"},
{quote:"Schwing!", movie:" WAYNE'S WORLD, 1992"},
{quote:"We're not worthy. We're not worthy.", movie:" WAYNE'S WORLD, 1992"},
{quote:"Hoo-ah!", movie:" SCENT OF A WOMAN, 1992"},
{quote:"We didn't land on Plymouth Rock. Plymouth Rock landed on us!", movie:" MALCOLM X, 1992"},
{quote:"It's a hell of a thing killin' a man. You take away all he's got and all he's ever gonna have.", movie:" UNFORGIVEN, 1992"},
{quote:"You ask me if I have a God complex. Let me tell you something. I am God.", movie:" MALICE, 1993"},
{quote:"Life will find a way.", movie:" JURASSIC PARK, 1993"},
{quote:"The list is an absolute good. The list is life.", movie:" SCHINDLER'S LIST, 1993"},
{quote:"Bring out the Gimp.", movie:" PULP FICTION, 1994"},
{quote:"They call it a 'Royale with Cheese.'", movie:" PULP FICTION, 1994"},
{quote:"Somebody stop me!", movie:" THE MASK, 1994"},
{quote:"To infinity and beyond!", movie:" TOY STORY, 1995"},
{quote:"As if!", movie:" CLUELESS, 1995"},
{quote:"Do you like scary movies?", movie:" SCREAM, 1996"},
{quote:"You betcha!", movie:" FARGO, 1996"},
{quote:"Show me the money!", movie:" JERRY MAGUIRE, 1996"},
{quote:"You had me at 'hello.'", movie:" JERRY MAGUIRE, 1996"},
{quote:"You complete me.", movie:" JERRY MAGUIRE, 1996"},
{quote:"You know the difference between you and me? I make this look good.", movie:" MEN IN BLACK, 1997"},
{quote:"One million dollars!", movie:" AUSTIN POWERS: INTERNATIONAL MAN OF MYSTERY, 1997"},
{quote:"This is nothing!", movie:" WAG THE DOG, 1997"},
{quote:"I'm king of the world!", movie:"TITANIC, 1997"},
{quote:"You make me want to be a better man.", movie:" AS GOOD AS IT GETS, 1997"},
{quote:"Forget about it.", movie:" DONNIE BRASCO, 1997"},
{quote:"Earn this.", movie:" SAVING PRIVATE RYAN, 1998"},
{quote:"I see dead people.", movie:" THE SIXTH SENSE, 1999"},
{quote:"First rule of Fight Club is - you do not talk about Fight Club.", movie:" FIGHT CLUB, 1999"},
{quote:"My precious.", movie:" THE LORD OF THE RINGS: THE TWO TOWERS, 2002"}
];
