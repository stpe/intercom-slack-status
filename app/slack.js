"use strict";

var Slack = require("slack-node");

var slack = new Slack();
slack.setWebhook(process.env.SLACK_WEBHOOK);

var slackMessenger = {};

slackMessenger.send = function(msg) {
  return new Promise(
    (resolve, reject) => {
      var slackMsg = {
          "channel": "#" + process.env.SLACK_CHANNEL,
          "icon_emoji": process.env.SLACK_ICON_URL,
          "username": process.env.SLACK_USERNAME
      };

      msg = Object.assign(slackMsg, msg);

      slack.webhook(msg, function(err, response) {  // eslint-disable-line no-unused-vars
        if (err) return reject(err);
        resolve(response);
      });
    }
  );
};

module.exports = slackMessenger;
