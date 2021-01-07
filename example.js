// const Zattoo = require("zattoo-unofficial-api");
const Zattoo = require("./index.js");

const main = async () => {

  const zattoo = new Zattoo({
    "user": "your@mail.com",
    "password": "xyz",
    "lang": "de" // optional
  });

  /* get stream url for srf1, then and catch used */
  zattoo.getStreamUrls("srf1").then((urls) => {
    console.log(urls[0]);
  }).catch((err) => {
    console.error(err);
  });

  /* get stream url for srf1, async await and
   * watch alias used */
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

  /* get guide information, async await used
   * start and stop timestamp in Unix Seconds */
  let recallItem;
  try {
    const now = parseInt(Date.now() / 1000, 10);
    const HALF_DAY = 12 * 3600; // Seconds
    const guide = await zattoo.getGuideInfo(now - HALF_DAY, now + HALF_DAY);
    recallItem = guide.channels["sf-1"][0];
    console.log(recallItem);
  } catch (err) {
    console.error(err);
  }

  /* get stream url for a recall item, async await used
   * pass object with cid and recall item id */
  try {
    const urls = await zattoo.getStreamUrls({
      "cid": "sf-1",
      "id": recallItem.id,
      "pre_padding": 0, // optional
      "post_padding": 0 // optional
    });
    console.log(urls[0]);
  } catch (err) {
    console.error(err);
  }

  zattoo.close();
};

main();
