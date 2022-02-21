const { ChatClient, AlternateMessageModifier, SlowModeRateLimiter, replyToServerPing } = require('@aidenhadisi/amazeful-twitch-irc');
const got = require('got');
const config = require('./config');
const fs = require("fs");

const usernameRegex = new RegExp(/^@?([\w]{1,25}),?$/);

var talkedRecently = new Set();
var cooldownChannel = new Set();
var userCD = parseInt(config.userCooldown);
var globalCD = parseInt(config.globalCooldown);
var date = new Date().toLocaleString().replace(',','').split(' ');

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
    client.say(config.connectChannels[0], `Pomyślnie połączono z czatem! Stare`);
});
client.on("close", async (error) => {
    if (error !== null){
        console.error(`Client closed due to error`, error);
    }
});

// cytat command function
function cytat(channel, usernameID, sendernick){
    if (channel != 'demonzz1'){
        client.say(channel, ` @${sendernick}, Ta komenda jest dostępna tylko na czacie kanału demonzz1 👍`);
        return;
    };
    (async () => {
        try {
            do {
                var response = await got(`https://harambelogs.pl/channel/demonzz1/userid/${usernameID}/random`);
            } while (!response.body.includes(`#demonzz1`));
            if (usernameID == '139448263') {
                var emote = "Pierdzibak";
                var nick = "pierdzibak1";
            };
            if (usernameID == '127732599') {
                var emote = "mitoman";
                var nick = "januszlols";
            };
            if (usernameID == '703242397') {
                var emote = "peepoFoil";
                var nick = "gawcio69";
            };
            if (response.body.includes(nick)){
                let quote = response.body.split(`#demonzz1 ${nick}:`);
                let quoteMsg = quote[1].trim();
                client.say(channel, `${emote} Thinking ${quoteMsg} Thinking2 ${quote[0]}`);
            } else {
                client.say(channel, `@${sendernick}, Nie udało się pobrać cytatu PoroSad`);
            }
        } catch (error) {
            client.say(channel, `@${sendernick}, Wystąpił błąd podczas pobierania cytatu PoroSad`);
        }
    })();
};

// check & convert target username function
function checkUsername(toCheck){
    if (toCheck == null){
        return null;
    }
    toCheck = String(toCheck)
    let match = usernameRegex.exec(toCheck.toLowerCase());
    if (match === null){
        return null;
    }
    let target = String(match[1]);
    return target;
}


client.on("PRIVMSG", async (msg) => {
    if (msg.senderUserID === config.botID){
        return;
    };
    if (!msg.messageText.startsWith(config.prefix)){
        return;
    };
    if (cooldownChannel.has(msg.channelID) && !(msg.senderUserID === config.ownerID)){
        return;
    };
    if (talkedRecently.has(msg.senderUserID) && !(msg.senderUserID === config.ownerID)){
        return;
    };
    let args = msg.messageText.slice(config.prefix.length).trim().split(/\s+/); // object 
    const command = args.shift().toLowerCase(); // string ONLY command
    const stripPrefix = String(msg.messageText).substring(config.prefix.length); // the same as "args" but this is STRING
    switch(command){
        case 'ping':
            let t0 = performance.now();
            await client.ping();
            let t1 = performance.now();
            let latency = (t1 - t0).toFixed();
            client.say(msg.channelName, `FeelsDankMan PONG! Latency: ${latency}ms Channels: ${config.connectChannels.length}`);
            break;
        case 'help':
            client.say(msg.channelName, `@${msg.senderUsername}, https://bot.szkajpur.pl/ FeelsDankMan`);
            break;
        case 'echo':
            if (msg.senderUserID === config.ownerID || msg.isMod){
                let echoMsg = stripPrefix.replace(/^echo/gi,``);
                if (!echoMsg.length){
                    client.say(msg.channelName, `@${msg.senderUsername}, podaj wiadomość do pokazania! FeelsDankMan`);
                    return;
                } else {
                    client.me(msg.channelName, `FeelsDankMan 📣 ${echoMsg}`);
                };
            };
            break;
        case 'reddit':
            if (args[0] == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}reddit [subreddit name] ppL`);
                return;
            };
            let bany = require(config.bannedRedditsPath);
            let reddit = args[0].toLocaleLowerCase();
            if (bany.includes(reddit)){
                client.say(msg.channelName, `@${msg.senderUsername}, podany subreddit jest zbanowany na bocie!`);
                return;
            }
            (async () => {
                try {
                    const response = await got(`https://meme-api.herokuapp.com/gimme/${reddit}`, {
                        responseType: 'json'
                    });
                    let notsafe = String(response.body.nsfw);
                    if ((notsafe == "true") && !(msg.senderUserID === config.ownerID)){
                        client.say(msg.channelName, `@${msg.senderUsername}, Znaleziony obrazek jest nsfw monkaS`);
                        return;
                    }
					if (notsafe == "true") {
						client.say(msg.channelName, `@${msg.senderUsername}, knaDyppaHopeep "${response.body.subreddit}" 👉 ${response.body.url} ⚠ NSFW ⚠`);
					} else {
                    client.say(msg.channelName, `@${msg.senderUsername}, knaDyppaHopeep "${response.body.subreddit}" 👉 ${response.body.url}`);
					};
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, Nie znaleziono podanego subreddita lub nie ma on zdjęć!`);
                }
            })();
            break;
        case 'spam':
            if (msg.senderUserID === config.ownerID || msg.isMod){
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
        case 'rp':
            if (msg.senderUserID === config.ownerID || msg.isMod){
                (async () => {
                    try {   
                        const response = await got(`https://2g.be/twitch/randomviewer.php?channel=${msg.channelName}`);
                        client.say(msg.channelName, `FeelsDankMan 🔔 @${response.body}`);
                    } catch (error) {
                        return;
                    }
                })();
            }
            break;
        case 'czyjpies':
            let target = checkUsername(args[0]);
            if (target == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}czyjpies [nick] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://xayo.pl/api/watchtime/${target}`, {
                        responseType: 'json'
                    });
                    if (!response.body.length) {
                        client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych. PoroSad`);
                        return;
                    }
                    let message = `${response.body[0].streamer} (${response.body[0].count}min)`;
                    client.say(msg.channelName, `@${msg.senderUsername}, ${target} jest psem: ${message} Wowee`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych. PoroSad`);
                }
            })();
            break;
        case 'top5':
            let target2 = checkUsername(args[0]);
            if (target2 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}top5 [nick] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://xayo.pl/api/watchtime/${target2}`, {
                        responseType: 'json'
                    });
                    if (!response.body.length) {
                        client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych. PoroSad`);
                        return;
                    }
                    let message = `${response.body[0].streamer} ${response.body[0].count}min | ${response.body[1].streamer} ${response.body[1].count}min | ${response.body[2].streamer} ${response.body[2].count}min | ${response.body[3].streamer} ${response.body[3].count}min | ${response.body[4].streamer} ${response.body[4].count}min`;
                    client.say(msg.channelName, `@${msg.senderUsername}, TOP5 ${target2} -> ${message} PepoG`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych. PoroSad`);
                }
            })();
            break;
        case 'lastseen':
            let target3 = checkUsername(args[0]);
            if (target3 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}lastseen [nick] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://vislaud.com/api/chatters?logins=${target3}`, {
                        responseType: 'json'
                    });
                    if (!response.body.length) {
                        client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych. PoroSad`);
                        return;
                    }
                    let streamer = response.body[0].lastseen.streamer.displayName;
                    let lastseen = response.body[0].lastseen.timestamp;
                    lastseen = lastseen.split('T');
                    let lastseenDate = String(lastseen[0]);
                    let lastseenTime = new Date(lastseen).toLocaleTimeString('pl-PL');
                    client.say(msg.channelName, `@${msg.senderUsername}, użytkownik ${target3} był ostatnio widziany na kanale: ${streamer} (${lastseenTime} ${lastseenDate})`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych. PoroSad`);
                }
            })();  
            break;
        case 'tuck': 
            let target4 = checkUsername(args[0]);
            if (target4 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}tuck [nick] ppL`);
                return;
            }
            if (args[1] != undefined) {
                let emote = args[1];
                client.say(msg.channelName, `${msg.senderUsername} tucks ${target4} into bed ${emote} 👉 🛏`);
            } else {
            client.say(msg.channelName, `${msg.senderUsername} tucks ${target4} into bed FeelsDankMan 👉 🛏`);
            };
            break;
        case 'kotek':
            (async () => {
                try {
                    const response = await got(`https://meme-api.herokuapp.com/gimme/cat`);
                    const responsejson = JSON.parse(response.body);
                    client.say(msg.channelName, `@${msg.senderUsername}, CoolCat 👉 ${responsejson.url}`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie znaleziono żadnego kotka. PoroSad`);
                }
            })();
            break;
        case 'piesek':
            (async () => {
                try {
                    const response = await got(`https://meme-api.herokuapp.com/gimme/dog`);
                    const responsejson = JSON.parse(response.body);
                    client.say(msg.channelName, `@${msg.senderUsername}, CorgiDerp 👉 ${responsejson.url}`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie znaleziono żadnego pieska. PoroSad`);
                }
            })();
            break;
        case 'baninfo':
            let target5 = checkUsername(args[0]);
            if (target5 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}baninfo [nick] ppL`);
                return;
            }
            (async () => {
                try {
                    const response = await got(`https://api.ivr.fi/v2/twitch/user/${target5}`, {
                        responseType: 'json'
                    });
                    if (response.body.banned == false){
                        client.say(msg.channelName, `@${msg.senderUsername}, podany użytkownik nie ma bana. EZ`);
                    } else if (response.body.banned == true){
                        client.say(msg.channelName, `@${msg.senderUsername}, ${response.body.displayName} -> Ban Reason: "${response.body.banReason}" | Id: ${response.body.id} | Affiliate: ${response.body.roles.isAffiliate} | Partner: ${response.body.roles.isPartner}`);
                    } else {
                        client.say(msg.channelName, `@${msg.senderUsername}, nie odnaleziono podanego użytkownika. PoroSad`);
                        return;
                    }
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie odnaleziono podanego użytkownika. PoroSad`);
                }
            })();
            break;
        case 'subinfo':           
            let usernameSub = checkUsername(args[0]);
            if (usernameSub == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}subinfo [nick] [channel] ppL`);
                return;
            };
            let channelSub = checkUsername(args[1]);
            if (channelSub == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}subinfo [nick] [channel] ppL`);
                return;                
            };
            (async () => {
                try {
                    const response = await got(`https://api.ivr.fi/twitch/subage/${usernameSub}/${channelSub}`,{
                        responseType: 'json'
                    });
                    if (response.body.hidden == true){
                        client.say(msg.channelName, `@${msg.senderUsername}, podany użytkownik ma ustawione subskrypcje na prywatne. BibleThump`);
                    } else if (response.body.subscribed == false){
                        if (response.body.cumulative.months > 0){
                            let endsub = response.body.cumulative.end;
                            endsub = endsub.split('T');
                            let endsubDate = String(endsub[0]);
                            let endsubTime = new Date(endsub).toLocaleTimeString('pl-PL');
                            client.say(msg.channelName, `Użytkownik: ${response.body.username} | Kanał: ${response.body.channel} | Czy aktualnie subuje: NIE | Ostatni sub: ${response.body.cumulative.months} miesiąc (Skończył się ${endsubDate} ${endsubTime})`);
                        } else {
                            client.say(msg.channelName, `@${msg.senderUsername}, podany użytkownik nie miał suba na kanale ${response.body.channel} PoroSad`);
                        }
                    } else if (response.body.subscribed == true){
                        let endsub = response.body.meta.endsAt;
                        endsub = endsub.split('T');
                        let endsubDate = String(endsub[0]);
                        let endsubTime = new Date(endsub).toLocaleTimeString('pl-PL');
                        if (response.body.meta.type == "gift"){
                            client.say(msg.channelName, `Użytkownik: ${response.body.username} | Kanał: ${response.body.channel} | Czy aktualnie subuje: TAK | Typ suba: ${response.body.meta.type}, tier: ${response.body.meta.tier} | Kupiony przez: ${response.body.meta.gift.name} | ${response.body.cumulative.months} miesiąc, (Skończy się ${endsubDate} ${endsubTime})`);
                        } else {
                            client.say(msg.channelName, `Użytkownik: ${response.body.username} | Kanał: ${response.body.channel} | Czy aktualnie subuje: TAK | Typ suba: ${response.body.meta.type}, tier: ${response.body.meta.tier} | ${response.body.cumulative.months} miesiąc, (Skończy się ${endsubDate} ${endsubTime})`);
                        };
                    }
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie odnaleziono podanego użytkownika lub kanału w bazie danych. PoroSad`);
                    return;
                }
            })();
            break;
        case 'cytat_pierdzibaka':
            cytat(msg.channelName, '139448263', msg.senderUsername);
            break;
        case 'cytat_janusza':
            cytat(msg.channelName, '127732599', msg.senderUsername);
            break;
        case 'cytat_gawcia':
            cytat(msg.channelName, '703242397', msg.senderUsername);
            break;
    }
    talkedRecently.add(msg.senderUserID);
    setTimeout(() => {
        talkedRecently.delete(msg.senderUserID);       
    }, userCD);

    cooldownChannel.add(msg.channelID);
    setTimeout(() => {
        cooldownChannel.delete(msg.channelID);
    }, globalCD);
});

client.connect();
client.joinAll(config.connectChannels);
