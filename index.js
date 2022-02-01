const { ChatClient, AlternateMessageModifier, SlowModeRateLimiter } = require('dank-twitch-irc');
const chalk = require('chalk');
const got = require('got');
const config = require('./config');

const usernameRegex = new RegExp(/^@?([\w]{1,25}),?$/);

const talkedRecently = new Set();
let userCD = parseInt(config.userCooldown);
let globalCD = parseInt(config.globalCooldown);
var cooldown = false;

// declare client
let client = new ChatClient({
    username: config.botUsername,
    password: `oauth:${config.botOauth}`,
    rateLimits: "default"
});


// events on client
client.use(new AlternateMessageModifier(client));
client.use(new SlowModeRateLimiter(client, 10));
client.on("ready", async () => {
	console.log(`Successfully connected to chat`);
});
client.on("close", async (error) => {
    if (error !== null){
        console.error(`Client closed due to error`, error);
    }
});

// Cytat command function
function cytat(channel, username){
    (async () => {
        try {
            do {
                var response = await got(`https://harambelogs.pl/channel/demonzz1/user/${username}/random`);
            } while (!response.body.includes('#demonzz1'));
            if (username == 'pierdzibak_kwiatka' || username == 'pierdzibak_laskawy') {
                var emote = "Pierdzibak";
            } else
            if (username == 'ltk__') {
                var emote = "Madge";
            } else
            if (username == 'julkalols') {
                var emote = "mitoman";
            }
            if (username == 'gawcio69') {
                var emote = "peepoFoil";
            }
            let bodyCytat = response.body;
            if (bodyCytat.includes(username)){
                let quote = bodyCytat.split(`#demonzz1 ${username}:`);
                let quoteMsg = quote[1].trim();
                client.say(channel, `${emote} Thinking ${quoteMsg} Thinking2 ${quote[0]}`);
                return;
            } else if (bodyCytat.includes('pierdzibak_laskawy')) {
                let quote = bodyCytat.split(`#demonzz1 pierdzibak_laskawy:`);
                let quoteMsg = quote[1].trim();
                client.say(channel, `${emote} Thinking ${quoteMsg} Thinking2 ${quote[0]}`);
                return;    
            } else {
                client.say(channel, `Nie udało się pobrać cytatu PoroSad`);
                return;
            }
        } catch (error) {
            console.error(error.response);
            return;
        }
    })();
};

function checkUsername(toCheck){
    if (toCheck.length < 1){
        return null;
    }
    let match = usernameRegex.exec(toCheck[0].toLowerCase());
    if (match === null){
        return null;
    }
    let target = match[1];
    return target;
}

client.on("PRIVMSG", async (msg) => {
    if (msg.senderUserID === config.botID){
        return;
    };
    if (!msg.messageText.startsWith(config.prefix)){
        return;
    };
    if ((cooldown == true) && !(msg.senderUserID === config.ownerID)){
        console.log(`User Cooldown`); 
        return;
    }
    if (talkedRecently.has(msg.senderUserID) && !(msg.senderUserID === config.ownerID)){
        console.log(`Global Cooldown`);
        return;
    };
    let args = msg.messageText.slice(config.prefix.length).trim().split(/\s+/); // object 
    const command = args.shift().toLowerCase(); // string ONLY command
    const stripPrefix = String(msg.messageText).substring(config.prefix.length); // the same as "args" but this is STRING
    switch(command){
        case 'ping':
            client.say(msg.channelName, `PONG FeelsDankMan`);
            break;
        case 'help':
            client.say(msg.channelName, `@${msg.senderUsername}, dostępne komendy: ${config.prefix}ping, ${config.prefix}help, ${config.prefix}czyjpies [nick], ${config.prefix}top5 [nick], ${config.prefix}lastseen [nick], ${config.prefix}cytat_pierdzibaka, ${config.prefix}cytat_janusza, ${config.prefix}cytat_ltk, ${config.prefix}cytat_gawcia FeelsDankMan`);
            break;
        case 'echo':
            if (msg.senderUserID === config.ownerID){
                let echoMsg = stripPrefix.replace(/^echo/gi,``);
                if (!echoMsg.length){
                    client.say(msg.channelName, `@${msg.senderUsername}, podaj wiadomość do pokazania! FeelsDankMan`);
                    return;
                } else {
                    client.me(msg.channelName, `FeelsDankMan 📣 ${echoMsg}`);
                };
            };
            break;
        case 'spam':
            if (msg.senderUserID === config.ownerID){
                if (parseInt(args[0]) == null){
                    client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}spam [ilość] [wiadomość] NaM`);
                    return;
                }
                let spamTimes = parseInt(args[0]);
                let spamText = String(args.slice(1).join(' '));
                if (!spamText.length){
                    client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}spam [ilość] [wiadomość] NaM`);
                    return;
                };
                while (spamTimes > 0){
                    client.say(msg.channelName, spamText);
                    spamTimes = spamTimes - 1;
                };
            };
            break;
        case 'czyjpies':
            let target = checkUsername(args);
            if (target == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}czyjpies [nick] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://xayo.pl/api/watchtime/${target}`);
                    const list = JSON.parse(response.body);
                    if (!list.length) {
                        client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych. PoroSad`);
                        return;
                    }
                    let message = `${list[0].streamer} (${list[0].count}min)`;
                    client.say(msg.channelName, `@${msg.senderUsername}, ${target} jest psem: ${message} Wowee`);
                } catch (error) {
                    console.error(error.response);
                    return;
                }
            })();
            break;
        case 'top5':
            let target2 = checkUsername(args);
            if (target2 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}top5 [nick] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://xayo.pl/api/watchtime/${target2}`);
                    const list = JSON.parse(response.body);
                    if (!list.length) {
                        client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych. PoroSad`);
                        return;
                    }
                    let message = `${list[0].streamer} ${list[0].count}min | ${list[1].streamer} ${list[1].count}min | ${list[2].streamer} ${list[2].count}min | ${list[3].streamer} ${list[3].count}min | ${list[4].streamer} ${list[4].count}min`;
                    client.say(msg.channelName, `@${msg.senderUsername}, TOP5 ${target2} -> ${message} PepoG`);
                } catch (error) {
                    console.error(error.response);
                    return;
                }
            })();
            break;
        case 'lastseen':
            let target3 = checkUsername(args);
            if (target3 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}lastseen [nick] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://vislaud.com/api/chatters?logins=${target3}`);
                    const list = JSON.parse(response.body);
                    if (list[0] == null) {
                        client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych. PoroSad`);
                        return;
                    }
                    let streamer = list[0].lastseen.streamer.displayName;
                    let lastseen = list[0].lastseen.timestamp;
                    lastseen = lastseen.split('T');
                    let lastseenDate = String(lastseen[0]);
                    let lastseenTime = new Date(lastseen).toLocaleTimeString('pl-PL');
                    client.say(msg.channelName, `@${msg.senderUsername}, użytkownik ${target3} był ostatnio widzany na kanale: ${streamer} (${lastseenTime} ${lastseenDate})`);
                } catch (error) {
                    console.error(error.response);
                    return;
                }
            })();  
            break;
        case 'cytat_pierdzibaka':
            cytat(msg.channelName, 'pierdzibak_kwiatka');
            break;
        case 'cytat_janusza':
            cytat(msg.channelName, 'julkalols');
            break;
        case 'cytat_ltk':
            cytat(msg.channelName, 'ltk__');
            break;
        case 'cytat_gawcia':
            cytat(msg.channelName, 'gawcio69');
            break;
    }
    talkedRecently.add(msg.senderUserID);
    setTimeout(() => {
        talkedRecently.delete(msg.senderUserID);       
    }, userCD);

    cooldown = true;
    setTimeout(() => {
        cooldown = false;
    }, globalCD);
});

client.connect();
client.joinAll(config.connectChannels);
