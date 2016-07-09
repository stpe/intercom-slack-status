"use strict";

require("dotenv").config({ silent: true });
var slack = require("./slack");

var Intercom = require("intercom-client");
var client = new Intercom.Client({
  appId: process.env.INTERCOM_APP_ID,
  appApiKey: process.env.INTERCOM_API_KEY
}).usePromises();

const UNASSIGNED_ADMIN_ID = 1;

function getConversations(conversations, paginationObject) {
  let getConversationsList = paginationObject ?
    client.nextPage(paginationObject) :
    client
      .conversations.list({
        display_as: "plaintext",
        open: true
      });

  return getConversationsList
    .then(data => {
      conversations = (conversations || []).concat(data.body.conversations);

      if (data.body.pages.next) {
        return getConversations(conversations, data.body.pages);
      }

      return conversations;
    });
}

Promise.all([
  client.admins.list(),
  getConversations()
])
.then(data => {
  let [admins, conversations] = data;
  admins = admins.body.admins;

  admins.push({
    id: UNASSIGNED_ADMIN_ID,
    name: "Unassigned"
  });

  let adminLookup = {};
  admins.forEach(admin => {
    admin.openCount = 0;
    adminLookup[admin.id] = admin;
  });

  conversations.forEach(c => {
    adminLookup[c.assignee.id || UNASSIGNED_ADMIN_ID].openCount++;
  });

  let fields = Object
    .keys(adminLookup)
    .filter(id => adminLookup[id].openCount > 0)
    .sort((a, b) => adminLookup[b].openCount - adminLookup[a].openCount)
    .map(id => {
      return {
        title: adminLookup[id].name,
        value: adminLookup[id].openCount,
        short: true
      };
    });

  slack.send({
    text: `A total of *${conversations.length}* conversations are open right now.`,
    attachments: [{
      fields: fields
    }]
  });
})
.catch(err => console.error(err.stack || err));
