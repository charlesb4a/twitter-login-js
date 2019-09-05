const session = require('express-session');
const OAuth = require('oauth');
const back4appWebhostDomain = 'YOUR_BACK4APP_WEBHOST_DOMAIN';

const requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
const accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
const consumer_key = 'YOUR_CONSUMER_KEY';
const consumer_secret = 'YOUR_CONSUMER_SECRET';
const oauth_callback = `${back4appWebhostDomain}/twitter-callback`;

app.use(session({
  secret: 'parse twitter auth example'
}));

const oauth = new OAuth.OAuth(
  requestTokenUrl,
  accessTokenUrl,
  consumer_key,
  consumer_secret,
  '1.0A',
  null,
  'HMAC-SHA1'
);

app.post('/twitter-auth', async (req, res) => {
  oauth.getOAuthRequestToken({ oauth_callback }, (error, oauthToken, oauthTokenSecret, results) => {
    if (error) {
      console.log(error)
      res.status(500).send("Error getting OAuth request token : " + error);
    } else {
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      return res.json({ redirectURL: "https://twitter.com/oauth/authorize?oauth_token=" + req.session.oauthRequestToken }).end(200);
    }
  });
});

app.get('/twitter-callback', async (req, res) => {
  oauth.getOAuthAccessToken(
    req.session.oauthRequestToken,
    req.session.oauthRequestTokenSecret,
    req.query.oauth_verifier,
    async (error, oauthAccessToken, oauthAccessTokenSecret, twitterUser) => {
      if (error) {
        console.error(error)
        res.status(500).send("Error getting OAuth access token : " + error);
      } else {
        req.session.oauthAccessToken = oauthAccessToken;
        req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;

        const authData = {
          id: twitterUser.user_id,
          consumer_key,
          consumer_secret,
          auth_token: oauthAccessToken,
          auth_token_secret: oauthAccessTokenSecret
        }

        try {
          const user = new Parse.User();
          await user._linkWith('twitter', { authData });
          res.send(`Welcome ${twitterUser.screen_name}`);
        } catch (err) {
          console.error(err);
          res.status(500).send(err);
        }
      }
    }
  );
});