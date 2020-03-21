# zattoo-unofficial-api
Unofficial Zattoo Streaming API

## Installation 

```
npm install zattoo-unofficial-api
```

## Configuration

Create a Zattoo instance with the following configuration parameters:

```js
const Zattoo = require("zattoo-unofficial-api");

const zattoo = new Zattoo({
  "user": "your@mail.com",
  "password": "xyz",
  "lang": "de", // optional
  "domain": "zattoo.com" // optional
});

```
## Usage

Use callback or promise for all API functions.


## Session Information
Get session info, callback used:
```js
zattoo.getSessionInfo((err, session) => {
  if (err) {
    console.error(err);
  } else {
    console.log(session);
  }
});
```

### Channel list

Get channel list, async await used:

```js
try {
  const channels = await zattoo.getChannelList();
  console.log(channels);
} catch (err) {
  console.error(err);
}
```

### Stream URLs

Get stream URLs for srf1 (Swiss TV), then and catch used:

```js
zattoo.getStreamUrls("srf1").then((urls) => {
  console.log(urls[0]);
}).catch((err) => {
  console.error(err);
});
```

## Disclaimer, legalese and everything else.

This is not affiliated or endorset by Zattoo, or any other party. This software available on the site is provided "as is" and any expressed or implied warranties, including, but not limited to, the implied warranties of merchantability and fitness for a particular purpose are disclaimed. In no event shall the user under the pseudonym heleon19, or any of their contributors be liable for any direct, indirect, incidental, special, exemplary, or consequential damages (including, but not limited to, procurement of substitute goods or services; loss of use, data, or profits; or business interruption) however caused and on any theory of liability, whether in contract, strict liability, or tort (including negligence or otherwise) arising in any way out of the use of this software, even if advised of the possibility of such damage.

## License

Apache License 2.0
