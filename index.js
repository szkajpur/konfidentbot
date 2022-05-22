const { ChatClient, AlternateMessageModifier, SlowModeRateLimiter, replyToServerPing, ban } = require('@kararty/dank-twitch-irc');
const got = require('got');
const config = require('./config');
const fs = require("fs");
const { time } = require('console');
const humanizeDuration = require('humanize-duration');
const UserAgent = require('user-agents');

const usernameRegex = new RegExp(/^@?([\w]{1,25}),?$/);
var talkedRecently = new Set();
var cooldownChannel = new Set();
var userCD = parseInt(config.userCooldown);
var globalCD = parseInt(config.globalCooldown);
const runTime = new Date().toString();
const userAgent = new UserAgent();

// declare clients
let client = new ChatClient({
    username: config.botUsername,
    password: `oauth:${config.botOauth}`,
    rateLimits: "default"
});
let anonymousClient = new ChatClient({
    username: "justinfan12345",
    password: "verifiedBot"
});

// events on client
client.use(new AlternateMessageModifier(client));
client.use(new SlowModeRateLimiter(client, 10));

client.on("ready", async () => {
	console.log(`Client · Successfully connected to chat`);
    client.me(config.connectChannels[0], `:tf: Pomyślnie połączono z czatem #${config.connectChannels[0]} · Owner: ${config.ownerUsername} · Prefix: "${config.prefix}" · User cooldown: ${config.userCooldown / 1000}s · Global Cooldown: ${config.globalCooldown / 1000}s`);
});
client.on("close", async (error) => {
    if (error !== null){
        console.error(`Client · Client closed due to error`, error);
    }
});

// events on anonymousClient
anonymousClient.on("ready", async () => {
    console.log(`Anonymous · Successfully connected to chat`)
})
anonymousClient.on("close", async (error) => {
    if (error !== null){
        console.error(`Anonymous · Client closed due to error`, error);
    }
});

// "cytat" command function
function cytat(channel, usernameID, sendernick){
    if (channel != 'demonzz1' && channel != 'szkajpur' && channel != 'szkajpurbot'){
        client.say(channel, ` @${sendernick}, ta komenda jest dostępna tylko na kanałach: #demonzz1, #szkajpur 👍`);
        return;
    };
    (async () => {
        try {
            do {
                var response = await got(`https://harambelogs.pl/channel/demonzz1/userid/${usernameID}/random`, {
                    http2: true
                });
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
                client.say(channel, `@${sendernick}, nie udało się pobrać cytatu PoroSad`);
            }
        } catch (error) {
            client.say(channel, `@${sendernick}, wystąpił błąd podczas pobierania cytatu PoroSad`);
        }
    })();
};

// check ping to ttv servers function
async function getPingDelay() {
	const before = Date.now();
	await client.ping();
	const after = Date.now();
	return after - before;
};

// async function getViewers(channel){
//     (async () => {
//         try {
//             const response = await got(`https://tmi.twitch.tv/group/user/${channel}/chatters`, {
//                 responseType: 'json',
//                 http2: true
//             });
//             const listViewers =[...(response.body.chatters.viewers), ...(response.body.chatters.vips)];
//             fs.writeFileSync(`listViewers_${channel}.txt`, JSON.stringify(listViewers, null, 4));
//             console.log(`Pomyślnie pobrano listę ${response.body.chatter_count} czatowników kanału ${channel}`);
//         } catch (error) {
//             return;
//         }
//     })();
// };

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
};

// sayMulti sends the message in multiple channels at once through client specified
function sayMulti(client, channels, message) {
    for (channel of channels) {
        client.say(channel, message).catch(console.error);
    }
};

// connect clients to chats
client.on("JOIN", async (msg) => {
    console.log(`Client · Joined #${msg.channelName}`);
});

anonymousClient.on("JOIN", async (msg) => {
    console.log(`Anonymous · Joined #${msg.channelName}`);
});

anonymousClient.on("CLEARCHAT", async (msg) => {
    if (msg.isPermaban()){
        sayMulti(client, config.notifyChannels, `⚠ ${msg.targetUsername} dostał perma u mamona! 60 ⚠`);
    }
});

client.connect();
client.joinAll(config.connectChannels);

anonymousClient.connect();
anonymousClient.joinAll(config.anonymousChannels);

// main
client.on("PRIVMSG", async (msg) => {
    if (msg.senderUsername === config.botUsername){
        return;
    };
    if (!msg.messageText.startsWith(config.prefix)){
        return;
    };
    if (cooldownChannel.has(msg.channelID) && !(msg.senderUsername === config.ownerUsername)){
        return;
    };
    if (talkedRecently.has(msg.senderUserID) && !(msg.senderUsername === config.ownerUsername)){
        return;
    };
    let args = msg.messageText.slice(config.prefix.length).trim().split(/\s+/); // object 
    const command = args.shift().toLowerCase(); // string ONLY command
    const stripPrefix = String(msg.messageText).substring(config.prefix.length); // the same as "args" but this is STRING
    switch(command){
        case 'ping':
            const getUptime = new Date().getTime() - Date.parse(runTime);
            const botUptime = humanizeDuration(getUptime, { round: true });
            const delay = await getPingDelay();
            client.say(msg.channelName, `:tf: 🏓 Pong! TMI Latency: ${delay}ms · Bot uptime: ${botUptime} · RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb · Channels: ${Object.keys(client.joinedChannels).length}`);
            break;
        case 'help':
            client.say(msg.channelName, `@${msg.senderUsername}, https://bot.szkajpur.pl/ FeelsDankMan`);
            break;
        case 'channelstats':
            let targetChannel = checkUsername(args[0]);
            if (targetChannel == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}channelstats [channel] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://twitchtracker.com/api/channels/summary/${targetChannel}`, {
                        responseType: 'json',
                        http2: true,
                        headers: {
                            'user-agent': `${userAgent}`
                        }
                    });
                    if (!response.body.rank){
                        client.say(msg.channelName, `@${msg.senderUsername}, nie znaleziono statystyk podanego kanału PoroSad`);
                        return;
                    }
                    let timeStreamed = response.body.minutes_streamed / 60;
                    timeStreamed = Math.round(timeStreamed);
                    client.say(msg.channelName, `@${msg.senderUsername}, Kanał: ${targetChannel} · Ranga: ${response.body.rank} · Czas przestrimowany: ${timeStreamed}h · Średnia widzów: ${response.body.avg_viewers} · Nowe followy: ${response.body.followers} [Dane z ostatnich 30 dni!]`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, wystąpił błąd podczas pobierania statystyk PoroSad`);
                    return;
                }
            })();
            break;
        case 'echo':
            if (msg.senderUsername === config.ownerUsername || msg.isMod){
                let echoMsg = stripPrefix.replace(/^echo/gi,``);
                if (!echoMsg.length){
                    client.say(msg.channelName, `@${msg.senderUsername}, podaj wiadomość do pokazania FeelsDankMan`);
                    return;
                } else {
                    client.say(msg.channelName, `${echoMsg}`);
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
                client.say(msg.channelName, `@${msg.senderUsername}, podany subreddit jest zbanowany na bocie PoroSad`);
                return;
            }
            (async () => {
                try {
                    const response = await got(`https://meme-api.herokuapp.com/gimme/${reddit}`, {
                        responseType: 'json',
                        http2: true
                    });
                    let notsafe = String(response.body.nsfw);
                    if ((notsafe == "true") && !(msg.senderUsername === config.ownerUsername)){
                        client.say(msg.channelName, `@${msg.senderUsername}, znaleziony obrazek jest nsfw monkaS`);
                        return;
                    }
					if (notsafe == "true") {
						client.say(msg.channelName, `@${msg.senderUsername}, :tf: "${response.body.subreddit}" 👉 ${response.body.url} ⚠ NSFW ⚠`);
					} else {
                    client.say(msg.channelName, `@${msg.senderUsername}, :tf: "${response.body.subreddit}" 👉 ${response.body.url}`);
					};
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie znaleziono podanego subreddita lub nie ma on zdjęć PoroSad`);
                }
            })();
            break;
        case 'spam':
            if (msg.senderUsername === config.ownerUsername || msg.isMod){
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
            if (msg.senderUsername === config.ownerUsername || msg.isMod){
                (async () => {
                    try {   
                        const response = await got(`https://2g.be/twitch/randomviewer.php?channel=${msg.channelName}`,{
                            http2: true
                        });
                        client.me(msg.channelName, `FeelsDankMan 🔔 @${response.body}`);
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
                    const response = await got(`https://xayo.pl/api/mostWatched/${target}`, {
                        responseType: 'json',
                        http2: true
                    });
                    let data = response.body[0];
                    client.say(msg.channelName, `@${msg.senderUsername}, ${target} jest psem: ${data.streamer} Wowee`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych PoroSad`);
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
                    const response = await got(`https://xayo.pl/api/mostWatched/${target2}`, {
                        responseType: 'json',
                        http2: true
                    });
                    let data = response.body;
                    let message = `${data[0].streamer} ${Math.round(data[0].count / 60)}h · ${data[1].streamer} ${Math.round(data[1].count / 60)}h · ${data[2].streamer} ${Math.round(data[2].count / 60)}h · ${data[3].streamer} ${Math.round(data[3].count / 60)}h · ${data[4].streamer} ${Math.round(data[4].count / 60)}h `;
                    client.say(msg.channelName, `@${msg.senderUsername}, TOP5 ${target2} -> ${message} PepoG`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych PoroSad`);
                }
            })();
            break;
        // case 'lastseen':
        //     let target3 = checkUsername(args[0]);
        //     if (target3 == null){
        //         client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}lastseen [nick] ppL`);
        //         return;
        //     };
        //     (async () => {
        //         try {
        //             const response = await got(`https://vislaud.com/api/chatters?logins=${target3}`, {
        //                 responseType: 'json',
        //                 http2: true
        //             });
        //             if (!response.body.length) {
        //                 client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych PoroSad`);
        //                 return;
        //             }
        //             let streamer = response.body[0].lastseen.streamer.displayName;
        //             let lastseen = response.body[0].lastseen.timestamp;
        //             lastseen = lastseen.split('T');
        //             let lastseenDate = String(lastseen[0]);
        //             let lastseenTime = new Date(lastseen).toLocaleTimeString('pl-PL');
        //             client.say(msg.channelName, `@${msg.senderUsername}, użytkownik ${target3} był ostatnio widziany na kanale: ${streamer} (${lastseenTime} ${lastseenDate})`);
        //         } catch (error) {
        //             client.say(msg.channelName, `@${msg.senderUsername}, nie ma podanego użytkownika w bazie danych PoroSad`);
        //         }
        //     })();  
        //     break;
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
                    const response = await got(`https://meme-api.herokuapp.com/gimme/cat`, {
                        http2: true
                    });
                    const responsejson = JSON.parse(response.body);
                    client.say(msg.channelName, `@${msg.senderUsername}, CoolCat 👉 ${responsejson.url}`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie znaleziono żadnego kotka PoroSad`);
                }
            })();
            break;
        case 'piesek':
            (async () => {
                try {
                    const response = await got(`https://meme-api.herokuapp.com/gimme/dog`, {
                        http2: true
                    });
                    const responsejson = JSON.parse(response.body);
                    client.say(msg.channelName, `@${msg.senderUsername}, CorgiDerp 👉 ${responsejson.url}`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie znaleziono żadnego pieska PoroSad`);
                }
            })();
            break;
        case 'isbanned':
            let target5 = checkUsername(args[0]);
            if (target5 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}isbanned [nick] ppL`);
                return;
            }
            (async () => {
                try {
                    const response = await got(`https://api.ivr.fi/v2/twitch/user/${target5}`, {
                        responseType: 'json',
                        http2: true
                    });
                    if (response.body.banned == false){
                        client.say(msg.channelName, `@${msg.senderUsername}, podany użytkownik nie ma bana EZ`);
                    } else if (response.body.banned == true){
                        client.say(msg.channelName, `@${msg.senderUsername}, ${response.body.displayName} -> Ban Reason: "${response.body.banReason}" · Id: ${response.body.id} · Affiliate: ${response.body.roles.isAffiliate} · Partner: ${response.body.roles.isPartner}`);
                    } else {
                        client.say(msg.channelName, `@${msg.senderUsername}, nie odnaleziono podanego użytkownika PoroSad`);
                        return;
                    }
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie odnaleziono podanego użytkownika PoroSad`);
                }
            })();
            break;
        case 'subinfo':           
            let usernameSub = checkUsername(args[0]);
            let channelSub = checkUsername(args[1]);
            if (usernameSub == null || channelSub == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}subinfo [nick] [channel] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://api.ivr.fi/twitch/subage/${usernameSub}/${channelSub}`,{
                        responseType: 'json',
                        http2: true
                    });
                    if (response.body.hidden == true){
                        client.say(msg.channelName, `@${msg.senderUsername}, podany użytkownik ma ustawione subskrypcje na prywatne BibleThump`);
                    } else if (response.body.subscribed == false){
                        if (response.body.cumulative.months > 0){
                            let endsub = response.body.cumulative.end;
                            endsub = endsub.split('T');
                            let endsubDate = String(endsub[0]);
                            let endsubTime = new Date(endsub).toLocaleTimeString('pl-PL');
                            client.say(msg.channelName, `Użytkownik: ${response.body.username} · Kanał: ${response.body.channel} · Czy aktualnie subuje: NIE · Ostatni sub: ${response.body.cumulative.months} miesiąc (Skończył się ${endsubDate} ${endsubTime})`);
                        } else {
                            client.say(msg.channelName, `@${msg.senderUsername}, podany użytkownik nie miał suba na kanale ${response.body.channel} PoroSad`);
                        }
                    } else if (response.body.subscribed == true){
                        let endsub = response.body.meta.endsAt;
                        endsub = endsub.split('T');
                        let endsubDate = String(endsub[0]);
                        let endsubTime = new Date(endsub).toLocaleTimeString('pl-PL');
                        if (response.body.meta.type == "gift"){
                            client.say(msg.channelName, `Użytkownik: ${response.body.username} · Kanał: ${response.body.channel} · Czy aktualnie subuje: TAK · Typ suba: ${response.body.meta.type} · Tier: ${response.body.meta.tier} · Kupiony przez: ${response.body.meta.gift.name} · ${response.body.cumulative.months} miesiąc, (Skończy się ${endsubDate} ${endsubTime})`);
                        } else {
                            client.say(msg.channelName, `Użytkownik: ${response.body.username} · Kanał: ${response.body.channel} · Czy aktualnie subuje: TAK · Typ suba: ${response.body.meta.type} · Tier: ${response.body.meta.tier} · ${response.body.cumulative.months} miesiąc, (Skończy się ${endsubDate} ${endsubTime})`);
                        };
                    }
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie odnaleziono podanego użytkownika lub kanału w bazie danych PoroSad`);
                    return;
                }
            })();
            break;
        case 'emote':
            let emotka = args[0];
            if (emotka == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}emotka [nazwa emotki] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://api.ivr.fi/twitch/emotes/${emotka}`, {
                        responseType: 'json',
                        http2: true
                    });
                        if (response.body.channelid == null){
                            client.say(msg.channelName, `@${msg.senderUsername}, Emotka: ${response.body.emotecode} · ID: ${response.body.emoteid} · Link: ${response.body.emoteurl_3x} PepoG`);
                        } else {
                            client.say(msg.channelName, `@${msg.senderUsername}, Emotka: ${response.body.emotecode} · Kanał: ${response.body.channel} · Tier: ${response.body.tier} · ID: ${response.body.emoteid} · Link: ${response.body.emoteurl_3x} PepoG`);
                        }
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie znaleziono podanej emotki PoroSad`);
                    return;
                }
            })();
            break;
        case 'chatters':
            let target6 = checkUsername(args[0]);
            if (target6 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}chatters [channel] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://tmi.twitch.tv/group/user/${target6}/chatters`, {
                        responseType: 'json',
                        http2: true
                    });
                    if (response.body.chatter_count == 0){
                        client.say(msg.channelName, `@${msg.senderUsername}, podany kanał nie istnieje lub nikogo na nim nie ma PoroSad`);
                    } else if (response.body.chatter_count > 0) {
                        client.say(msg.channelName, `@${msg.senderUsername}, na podanym kanale jest aktualnie ${response.body.chatter_count} chattersów!`);
                    }
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, nie odnaleziono podanego użytkownika lub kanału w bazie danych PoroSad`);
                    return;
                }
            })();
            break;
        case 'accage':
            let target7 = checkUsername(args[0]);
            if (target7 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}accage [nick] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://decapi.me/twitch/accountage/${target7}?precision=4`, {
                        http2: true
                    });
                    if (response.body.startsWith('User not found')){
                        client.say(msg.channelName, `@${msg.senderUsername}, na imGlitch nie ma takiego użytkownika PoroSad`);
                        return;
                    }
                    let data = response.body;
                    client.say(msg.channelName, `@${msg.senderUsername}, użytkownik ${target7} ma konto od ${data} PepoG`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, na imGlitch nie ma takiego użytkownika PoroSad`);
                    return;
                }
            })();
            break;
        case 'avatar':
            let target8 = checkUsername(args[0]);
            if (target8 == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}avatar [nick] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://decapi.me/twitch/avatar/${target8}`, {
                        http2: true
                    });
                    if (response.body.startsWith('User not found')){
                        client.say(msg.channelName, `@${msg.senderUsername}, na imGlitch nie ma takiego użytkownika PoroSad`);
                        return;
                    }
                    let data = response.body;
                    client.say(msg.channelName, `@${msg.senderUsername}, awatar ${target8} -> ${data}`);
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, na imGlitch nie ma takiego użytkownika PoroSad`);
                    return;
                }
            })();
            break;
        case 'firstmessage':
            let target9 = checkUsername(args[0]);
            let channelTarget = checkUsername(args[1]);
            if (target9 == null || channelTarget == null){
                client.say(msg.channelName, `@${msg.senderUsername}, ${config.prefix}firstmessage [nick] [channel] ppL`);
                return;
            };
            (async () => {
                try {
                    const response = await got(`https://api.ivr.fi/logs/firstmessage/${channelTarget}/${target9}`, {
                        responseType: 'json',
                        http2: true,
                        throwHttpErrors: false
                    });
                    if(!response.body.message){
                        const response2 = await got(`https://api.paauulli.me/logs/firstmessage/${channelTarget}/${target9}`, {
                            responseType: 'json',
                            http2: true,
                            throwHttpErrors: false
                        });
                        if(!response2.body.message){
                            client.say(msg.channelName, `@${msg.senderUsername}, błąd BroBalt`);
                            return;
                        } else if(response2.body.message){
                            client.say(msg.channelName, `#${channelTarget} ${response2.body.user}: ${response2.body.message} [${response2.body.time} temu]`);
                        };
                    } else if(response.body.message){
                        client.say(msg.channelName, `#${channelTarget} ${response.body.user}: ${response.body.message} [${response.body.time} temu]`);
                    }
                } catch (error) {
                    client.say(msg.channelName, `@${msg.senderUsername}, błąd BroBalt`);
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
