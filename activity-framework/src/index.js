const ActivitySDK = require('activitysdk');
const uuid = require('uuid');
const { DEFAULT_AUTH_SCOPES } = require('./constants');

const { areWeInFrame } = require('./utils');

class ActivityInstance {
  constructor(id, backendHost) {
    this.appid = id;
    this.apiHost = backendHost || "https://localhost:3000";
    this.nonces = new Map();
    this.promiseCache = new Map();
  };

  closeEmbeddedActivity(message, code){
    this.EmbeddedActivity?.close({
      code: code || 1006,
      message
    })
  }

  async run(){
    console.log('Running activity instance...')
    const nonce = uuid.v4();
    this.nonces['init'] = nonce;
    const response = new Promise((resolve, reject) => this.promiseCache.set(nonce, { resolve, reject }));
    
    // Launch
    if(areWeInFrame()){
      this.EmbeddedActivity = new ActivitySDK(this.appid);
      this.EmbeddedActivity.on("READY", this._ready.bind(this));
    } else {
      console.warn('Cannot start ActivityInstance outside of discord iframe.')
    }
    return response;
  }

  async _ready(e){
    console.log(e)
    if(!this.nonces['init']) throw "Init nonce not available"
    let cachedPromise = this.promiseCache.get(this.nonces['init'])
    let code;
    try{
      // Authorize via the Discord client
      const result = await this.EmbeddedActivity.commands.authorize({
        client_id: this.appid,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: DEFAULT_AUTH_SCOPES,
      });

      code = result.code;

      // Authenticate via the activity-server backend
      const response = await fetch(this.apiHost + `/embedded/_a/` + code);

      const { access_token: accessToken, token: activity_token } = await response.json();

      // Authenticate via the Discord client
      const authenticateResult = await this.EmbeddedActivity.commands.authenticate({
        access_token: accessToken,
      });

      // Cache current user
      this.currentUser = Object.freeze(authenticateResult.user)

      await this.EmbeddedActivity.commands.setConfig({
        use_interactive_pip: false
      })

      cachedPromise.resolve(authenticateResult);
    }catch(e){
      if(process.env.NODE_ENV !== 'production'){
        console.log(e)
        return;
      }
      cachedPromise.reject();
      this.closeEmbeddedActivity("Authorization Failed.")
    }
  }

  // Helper functions so we dont need to manually query EmbeddedActivity.commands.etc
  async setActivity(presence) {
    //Party is required in order for the activity to not get auto-closed.
    if (!presence.activity.party) {
      presence.activity.party = { id: uuid.v4(), size: [1, 1], privacy: 1 }
    }
    if (!presence.activity.party.id) { presence.activity.party.id = uuid.v4() }
    if (!presence.activity.party.size) { presence.activity.party.size = [1, 1] }
    return await this.EmbeddedActivity.commands.setActivity(presence);
  }

  async getCurrentUser() {
    return this.currentUser;
  }
}

module.exports = ActivityInstance;