// const Zattoo = require("zattoo-unofficial-api");
const Zattoo = require("./index.js");

const main = async () => {

  const zattoo = new Zattoo({
    "user": "your@mail.com",
    "password": "xyz",
    "lang": "de", // optional
    "domain": "zattoo.com" // optional
  });

  /* get stream url for srf1, then and catch used */
  zattoo.getStreamUrls("srf1").then((urls) => {
    console.log(urls[0]);
  }).catch((err) => {
    console.error(err);
  });

  /* get stream url for srf1, async await used */
  try {
    const urls = await zattoo.getStreamUrls("srf1");
    console.log(urls[0]);
  } catch (err) {
    console.error(err);
  }

  /* get channel list, async await used */
  try {
    const channels = await zattoo.getChannelList();
    console.log(channels);
  } catch (err) {
    console.error(err);
  }

  /* get session info, callback used */
  zattoo.getSessionInfo((err, session) => {
    if (err) {
      console.error(err);
    } else {
      console.log(session);
    }
  });

  zattoo.close();
};

main();
