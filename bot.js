/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


var Botkit = require('./lib/Botkit.js')
var os = require('os');

var controller = Botkit.slackbot({
  debug: false,
});

var bot = controller.spawn(
  {
    token:process.env.token
  }
).startRTM(); /* Start the connection... */

/* When shotbot hears these phrases, it will respond with
   the amount of shots the user has. */
controller.hears(['how many shots', 'how many shots do I have?'], 'ambient', function(bot, message) {
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    if(!user.shots) {
      bot.reply(message, 'You do not have any shots.');
    }
    if (user.shots === 1) {
      bot.reply(message, 'You only have ' + user.shots + ' shot...');
    }
    if(user.shots > 1) {
      bot.reply(message, 'You have to take ' + user.shots + ' shots.  Hurry up!!!');
    }
  })
});

/* When shotbot hears these phrases, it's going to respond
   with a greeting */
controller.hears(['hello','hi','howdy','hey'],'direct_message,direct_mention,mention',function(bot,message) {
    bot.api.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name: 'robot_face',
    },function(err,res) {
      if (err) {
        bot.log("Failed to add emoji reaction :(",err);
      }
    });

    controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }

    controller.storage.users.save(user,function(err,id) {
    if (user && user.name) {
      bot.reply(message,"Hello " + user.name+ "!");
    } else {
      bot.reply(message,"Hello!");
    }
    });
  });
});

/* When shotbot hears this phrase, it's going to
   deduct the number of shots from the user */
controller.hears(['i took (.*) shots'],'direct_message,direct_mention,mention',function(bot,message) {
    //Not sure about the "(.*)" for getting just the number
});

/* When shotbot hears this phrase, it's going to
   give a shot to the specified user */
controller.hears(['take a shot (.*)'],'ambient', function(bot, message) {
    //Get the users name and add a shot for that user
});

/* Have the user create their own customized rule
   which will be stored on the channel it was declared.
   Whoever mentions any of the phrases provided in the rule,
   will receive a shot. */
controller.hears(['makearule (.*)'], 'ambient', function(bot, message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'cop',
  },function(err,res) {
    if (err) {
      bot.log("Failed to add emoji reaction :(",err);
    }
  });

  if(!message.channel) return;

  var parts = message.text.split(' - ');

  if(parts.length < 3) return;

  var reply = parts[1];
  var rules = parts.slice(2);

  controller.storage.channels.get(message.channel, function(err, channel) {
    if(!channel) {
      channel = {
        id: message.channel
      }
    }
    if(!channel.rules) {
      channel.rules = [];
    }

    channel.rules.push(rules);

    controller.hears(rules, 'ambient', function(bot, message) {

      bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'beer',
      },function(err,res) {
        if (err) {
          bot.log("Failed to add emoji reaction :(",err);
        }
      });

      controller.storage.users.get(message.user,function(err,user) {
        if (!user) {
          user = {
            id: message.user,
          }
        }

        if(!user.shots) {
          user.shots = 1;
        } else {
          user.shots++;
        }

        controller.storage.users.save(user,function(err,id) {
          if (user.name) {
            bot.reply(message, reply + " Take a shot " + user.name + "!!\n  You have now " + user.shots + " to go...");
          } else {
            bot.reply(message, reply + " Take a shot!!! \n You have now " + user.shots + " to go...");
          }
        })
      });
    });
  });
});

/* When shotbot hears call me ..., anything
after that, it will refer to that user as that
name. */
controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function(bot,message) {
  var matches = message.text.match(/call me (.*)/i);
  var name = matches[1];
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    user.name = name;
    controller.storage.users.save(user,function(err,id) {
      bot.reply(message,"Got it. I will call you " + user.name + " from now on.");
    })
  })
});

/* When shotbot hears this phrase,
   it's going to reply with the person's name,
   if they were told to call that person
   something. */
controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention',function(bot,message) {
  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Your name is " + user.name);
    } else {
      bot.reply(message,"I don't know yet!");
    }
  })
});

/* This phrase will shutdown the server and
   shotbot will appear offline. */
controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot,message) {
  bot.startConversation(message,function(err,convo) {
    convo.ask("Are you sure you want me to shutdown?",[
      {
        pattern: bot.utterances.yes,
        callback: function(response,convo) {
          convo.say("Bye!");
          convo.next();
          setTimeout(function() {
            process.exit();
          },3000);
        }
      },
      {
        pattern: bot.utterances.no,
        default:true,
        callback: function(response,convo) {
          convo.say("*Phew!*");
          convo.next();
        }
      }
    ])
  })
});

controller.hears(['question me','lets talk'],'direct_message,direct_mention,mention',function(bot,message) {
  // start a conversation to handle this response.
   bot.startConversation(message,function(err,convo) {

     convo.ask('How are you?',function(response,convo) {

       convo.say('Cool, you said: ' + response.text);
       convo.next();

     });
   })
})

/* When shotbot hears these phrases, it's going
   to respond with what it can do and how to
   use shotbot.*/
controller.hears(['identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name +'>. I have been running for ' + uptime + ' on ' + hostname + ".");

})

function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit +'s';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}
