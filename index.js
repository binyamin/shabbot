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
    const {comment} = context.payload;

    if(comment.body.includes("@"+USER_LOGIN) && comment.user.login !== "shabbot[bot]") {
      let resp = await (await fetch("https://www.hebcal.com/shabbat?cfg=json&zip=21208&m=50")).json();
      let shabbosTimeIn = moment(resp.items.filter(p => p.category==="candles")[0].date).tz("America/New_York").subtract(BUFFER_BEFORE, 'minutes');
      let shabbosTimeOut = moment(resp.items.filter(p => p.category==="havdalah")[0].date).tz("America/New_York");      

      if(moment(comment.created_at).tz("America/New_York").isBetween(shabbosTimeIn, shabbosTimeOut)) {
        const issueComment = context.issue({
          body: COMMENT_BODY.replace("<time>", moment(shabbosTimeOut).tz("America/New_York").format("h:mma z"))
        })
        return context.github.issues.createComment(issueComment)
      }
    }
  })
}
