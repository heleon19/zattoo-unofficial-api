const assert = require("assert");
const axios = require("axios");
const axiosCookieJarSupport = require("axios-cookiejar-support").default;
const CookieJar = require("tough-cookie").CookieJar;
const uuid = require("uuid");
const queue = require("queue");

function Zattoo(config) {

  /* assert*/
  assert(typeof config !== "undefined", "config must be an none-empty object");
  assert(typeof config.user === "string" && config.user.length > 0, "config.user must be an none-empty string");
  assert(typeof config.password === "string" && config.password.length > 0, "config.password must be an none-empty string");

  const lang = config.lang || "en";
  const domain = config.domain || "zattoo.com";
  assert(typeof lang === "string" && lang.length > 0, "config.lang not valid");
  assert(typeof domain === "string" && domain.length > 0, "config.domain not valid");

  /* make axios support cookies */
  axiosCookieJarSupport(axios);

  /* init http axios with default parameters */
  const initHttp = () => {
    this.jar = new CookieJar();
    this.http = axios.create({
      "baseURL": `https://${domain}/`,
      "timeout": 5000,
      "headers": {
        "Accept": "application/json",
        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": `https://${domain}/client`,
        "Origin": `https://${domain}`,
        "Host": domain
      },
      "withCredentials": true,
      "jar": this.jar
    });
  };

  /* request the app token */
  const requestAppToken = async () => {
    const res = await this.http.get("token.json");
    this.app_token = res.data.session_token;
  };

  /* request a new session */
  const requestSession = async () => {
    const uid = uuid.v4();
    this.jar.setCookieSync(`uuid=${uid};domain=${domain}`, `https://${domain}`);

    const params = new URLSearchParams();
    params.append("uuid", uid);
    params.append("lang", lang);
    params.append("format", "json");
    params.append("app_version", "3.2120.1");
    params.append("client_app_token", this.app_token);
    this.session = (await this.http.post("zapi/v3/session/hello", params)).data;
    if (!(this.session.active || this.session.success)) {
      throw new Error("hello failed");
    }
  };

  /* request login and update session */
  const requestLogin = async () => {
    const params = new URLSearchParams();
    params.append("login", config.user);
    params.append("password", config.password);
    params.append("remember", "true");
    params.append("format", "json");
    const res = await this.http.post("zapi/v3/account/login", params, {
      "validateStatus": (status) => [200, 400].includes(status)
    });
    if (!res.data.active) {
      throw new Error("login failed");
    }
  };

  /* request channel list */
  const requestChannelList = async () => {
    const hash = this.session.power_guide_hash;
    this.channels = (await this.http.get(`zapi/v2/cached/channels/${hash}?details=False`)).data;
    return this.channels;
  }

  /* request guide information */
  const requestGuideInfo = async (start, end) => {
    const hash = this.session.power_guide_hash;
    return (await this.http.get(`zapi/v3/cached/${hash}/guide?start=${start}&end=${end}`)).data;
  }

  /* find cid by display alias */
  const findCidByAlias = (alias) => {
    let channel;
    this.channels.channel_groups.forEach((chg) => chg.channels.forEach((c) => {
      if (c.display_alias === alias) {
        channel = c;
      }
    }));
    if (!channel) {
      throw new Error(`channel with display alias '${alias}' not found`);
    }
    return channel.cid;
  };

  /* perform all required steps for login */
  const login = async () => {
    await initHttp();
    await requestAppToken();
    await requestSession();
    await requestLogin();
  };

  /* request watch ursl */
  const requestWatchUrls = async (alias, streamType) => {
    let url = "zapi/watch";

    const params = new URLSearchParams();
    params.append("https_watch_urls", true);
    params.append("stream_type", streamType);

    if (typeof alias === "string") {
      await requestChannelList();
      const cid = findCidByAlias(alias);
      params.append("cid", cid);

    } else if (typeof alias === "object" && alias.cid && alias.id) {
      params.append("pre_padding", alias.pre_padding || 0);
      params.append("post_padding", alias.post_padding || 0);
      url += `/recall/${alias.cid}/${alias.id}`

    } else {
      throw new Error("parameters not supported");
    }

    const res = await this.http.post(url, params, {
      "validateStatus": (status) => [200, 402, 403, 404].includes(status)
    });
    return res.data.stream.watch_urls;
  }

  /* if no cb is passed, return promise */
  const promiseOrCallback = (p, cb) => {
    if (cb) {
      (async () => {
        try {
          cb(null, await p);
        } catch (err) {
          cb(err);
        }
      })();
      return;
    }
    return p;
  };

  /* execute cmd, use queue to serialize the requests */
  const execute = (cmd, cb) => {
    return promiseOrCallback(new Promise((res, rej) => {
      _queue.push(async (qcb) => {
        try {
          res(await cmd());
        } catch (err) {
          rej(err);
        } finally {
          qcb();
        }
      });
    }), cb);
  };

  const _queue = queue({
    "autostart": true,
    "concurrency": 1
  });

  /* user session info */
  this.getSessionInfo = (cb) => execute(async () => {
    await login();
    return this.session;
  }, cb);

  /* channel list */
  this.getChannelList = (cb) => execute(async () => {
    await login();
    return await requestChannelList();
  }, cb);

  /* guide informationt */
  this.getGuideInfo = (start, end, cb) => execute(async () => {
    await login();
    return await requestGuideInfo(start, end);
  }, cb);

  /* get stream urls by display alias */
  this.getStreamUrls = (alias, streamType, cb) => {
    const _streamType = typeof streamType === "string" ? streamType : "hls7";
    const _cb = cb || (typeof streamType === "function" ? streamType : undefined);

    return execute(async () => {
      await login();
      return await requestWatchUrls(alias, _streamType);
    }, _cb);
  };

  this.close = () => {
    _queue.end();
  }
}

module.exports = Zattoo;
