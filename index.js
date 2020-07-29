const fetch = require("node-fetch");
const moment = require("moment-timezone");

const USER_LOGIN = "b3u";
const COMMENT_BODY = `@${USER_LOGIN} is not available until <time> on Saturday evening.`;
const BUFFER_BEFORE = 180;

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

module.exports = app => {
  app.on('issue_comment.created', async context => {
    let resp = await (await fetch("https://www.hebcal.com/shabbat?cfg=json&zip=21208&m=50")).json();
    let shabbosTimeIn = moment(resp.items.filter(p => p.category==="candles")[0].date).tz("America/New_York").subtract(BUFFER_BEFORE, 'minutes');
    let shabbosTimeOut = moment(resp.items.filter(p => p.category==="havdalah")[0].date).tz("America/New_York");

    const mtime = moment(shabbosTimeOut).tz("America/New_York").format("h:mma z");
    
    const {comment} = context.payload;

    if(moment(comment.created_at).tz("America/New_York").isBetween(shabbosTimeIn, shabbosTimeOut)) {
      if(comment.body.includes("@"+USER_LOGIN) && comment.user.login !== "shabbot[bot]") {
        const issueComment = context.issue({
          body: COMMENT_BODY.replace("<time>", mtime)
        })
        return context.github.issues.createComment(issueComment)
      }      
    }
  })
}
