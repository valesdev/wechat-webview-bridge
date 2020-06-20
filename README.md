# wechat-webview-bridge

[![Version](https://img.shields.io/npm/v/wechat-webview-bridge.svg)](https://www.npmjs.com/package/wechat-webview-bridge)
[![Downloads](https://img.shields.io/npm/dm/wechat-webview-bridge.svg)](https://npmcharts.com/compare/wechat-webview-bridge?minimal=true)
[![License](https://img.shields.io/npm/l/wechat-webview-bridge.svg)](https://www.npmjs.com/package/wechat-webview-bridge)

A substitute for the official WeChat JS-SDK library, rewritten from `https://res.wx.qq.com/open/js/jweixin-1.6.0.js`.

## Quick Start

```js
import axios from 'axios'
import WeChatWebViewBridge from 'wechat-webview-bridge'

/**
 * Function to request WeChat JS-SDK configuration parameters.
 *
 * @var Function
 */
const configHandler = async function ({ url }) {
  return axios.post('/wechat-jssdk-config', { url })
    .then(res => {
      return {
        appId: res.appId,
        timestamp: res.timestamp,
        nonceStr: res.nonceStr,
        signature: res.signature
      }
    })
}

/**
 * List of WeChat JS-SDK API you want to grant.
 *
 * @var Array
 */
const apiList = [
  'menu:share:timeline',
  'menu:share:appmessage',
  'imagePreview',
  'hideMenuItems',
  'showMenuItems',
  'scanQRCode',
  'getBrandWCPayRequest'
]

/**
 * The bridge instance.
 *
 * @var WeChatWebViewBridge
 */
const bridge = new WeChatWebViewBridge({
  configHandler,
  apiList,
  debug: true
})

// wait for WebView bridge initialized
await bridge.load()
  .then(() => {
    // listen on WeChat Timeline Share event
    return bridge.on({
      handlerName: 'menu:share:timeline',
      listener () {
        // invoke registration of sharing
        bridge.invoke({
          handlerName: 'shareTimeline',
          params: {
            title: 'The Title Goes Here',
            desc: 'The description goes here',
            img_url: 'https://www.example.com/image.jpeg',
            link: window.location.href,
            type: 'link',
            data_url: ''
          }
        })
          .then(data => {
            // successfully shared
          })
          .catch(error => {
            if (error.message === 'cancel') {
              // user cancelled
              return
            }
            // any other reasons
          })
      }
    })
  })
  .then(() => {
    // invoke hiding custom menu items
    return bridge.invoke({
      handlerName: 'hideMenuItems',
      params: {
        menuList: [
          'menuItem:share:facebook'
        ]
      }
    })
  })
```

## API

### `new WeChatWebViewBridge(<options>)`

| Parameter | Type | Description | Default |
| --- | --- | --- | --- |
| `options` | object | | |
| `options.configHandler` | function | Function to request WeChat JS-SDK configuration parameters. It should return a Promise and resolves with an object contains WeChat configuration parameters (`appId`, `timestamp`, `nonceStr` and `signature`). | (required) |
| `options.apiList` | array | List of WeChat JS-SDK API names you want to grant. | `[]` |
| `options.debug` | bool | Enable console debug output. | `false` |

### `bridge.load()`

Asynchronously wait for WebView bridge initialized. The returned Promise will be resolved once the bridge is ready to config.

- Parameters: (none)
- Returns: `Promise<void>`

### `bridge.config()`

Get configuration parameters from provided `configHandler` function and then pass to `preVerifyJSAPI` handler immediately. The returned Promise will be resolved once the bridge is ready to use.

- Parameters: (none)
- Returns: `Promise<any>`

### `bridge.invoke(<handerName>, [params])`

Invoke WebView bridge handler. (see below for the complete handler list)

| Parameter | Type | Description | Default |
| --- | --- | --- | --- |
| `handerName` | string | The name of handler to be called. | (required) |
| `params` | object | Parameters passed to WeChat WebView bridge. | `{}` |

- Returns: `Promise<any>`

### `bridge.on(<handlerName>, <listener>)`

Listen on WebView bridge event. (see below for the complete handler list)

| Parameter | Type | Description | Default |
| --- | --- | --- | --- |
| `handlerName` | string | The name of event to be listened on. | (required) |
| `listener` | function | The callback for WeChat WebView bridge response. | (required) |

- Returns: `Promise<void>`

### `bridge.urlToConfig`

Get the trimmed URL at the moment for WeChat WebView to configure.

- Returns: `string`

### `bridge.configData`

Get WeChat WebView bridge configuration data. The data will be fulfilled after a successful `configHandler` call.

- Returns: `object`

### `bridge.ready`

Get whether WeChat WebView bridge was successfully configured before.

- Returns: `boolean`

### `bridge.isIOS`

Whether we are in an iOS device.

- Returns: `boolean`

### `bridge.isAndroid`

Whether we are in an Android device.

- Returns: `boolean`

### `bridge.isWeChat`

Whether we are in a WeChat WebView.

- Returns: `boolean`

### `bridge.isWeChatBrowser`

Whether we are in a WeChat Browser.

- Returns: `boolean`

### `bridge.isWeChatMiniProgram`

Whether we are in a WeChat Mini Program.

- Returns: `boolean`

### `bridge.isWeChatDevTools`

Whether we are in a WeChat Dev Tools.

- Returns: `boolean`

### Handlers for JS calling WebView Bridge

| Handler Name                  | Parameters | Official Description |
| ----------------------------- | --- | --- |
| `preVerifyJSAPI`              | `verifyJsApiList`, `verifyOpenTagList` | 注入权限验证配置 |
| `checkJsApi`                  | `jsApiList` | 判断当前客户端版本是否支持指定 JS 接口 |
| `shareTimeline`               | `title`, `desc`, `img_url`, `link`, `type`, `data_url` | (unknown) |
| `sendAppMessage`              | `title`, `desc`, `link`, `img_url`, `type`, `data_url` | (unknown) |
| `shareQQ`                     | `title`, `desc`, `img_url`, `link` | (unknown) |
| `shareWeiboApp`               | `title`, `desc`, `img_url`, `link` | (unknown) |
| `shareQZone`                  | `title`, `desc`, `img_url`, `link` | (unknown) |
| `updateTimelineShareData`     | `title`, `link`, `imgUrl` | 自定义“分享到朋友圈”及“分享到QQ空间”按钮的分享内容 |
| `updateAppMessageShareData`   | `title`, `desc`, `link`, `imgUrl` | 自定义“分享给朋友”及“分享到QQ”按钮的分享内容 |
| `startRecord`                 | (none) | 开始录音接口 |
| `stopRecord`                  | (none) | 停止录音接口 |
| `playVoice`                   | `localId` | 播放语音接口 |
| `pauseVoice`                  | `localId` | 暂停播放接口 |
| `stopVoice`                   | `localId` | 停止播放接口 |
| `uploadVoice`                 | `localId`, `isShowProgressTips` | 上传语音接口 |
| `downloadVoice`               | `serverId`, `isShowProgressTips` | 下载语音接口 |
| `translateVoice`              | `localId`, `isShowProgressTips` | 识别音频并返回识别结果接口 |
| `chooseImage`                 | `count`, `sizeType`, `sourceType` | 拍照或从手机相册中选图接口 |
| `imagePreview`                | `current`, `urls` | 预览图片接口 |
| `uploadImage`                 | `localId`, `isShowProgressTips` | 上传图片接口 |
| `downloadImage`               | `serverId`, `isShowProgressTips` | 下载图片接口 |
| `getLocalImgData`             | `localId` | 获取本地图片接口 |
| `getNetworkType`              | (none) | 获取网络状态接口 |
| `openLocation`                | `latitude`, `longitude`, `name`, `address`, `scale`, `infoUrl` | 使用微信内置地图查看位置接口 |
| `geoLocation`                 | (none) | 获取地理位置接口 |
| `hideOptionMenu`              | (none) | (unknown) |
| `showOptionMenu`              | (none) | (unknown) |
| `closeWindow`                 | (none) | 关闭当前网页窗口接口 |
| `hideMenuItems`               | `menuList` | 批量隐藏功能按钮接口 |
| `showMenuItems`               | `menuList` | 批量显示功能按钮接口 |
| `hideAllNonBaseMenuItem`      | (none) | 隐藏所有非基础按钮接口 |
| `showAllNonBaseMenuItem`      | (none) | 显示所有功能按钮接口 |
| `scanQRCode`                  | `needResult`, `scanType` | 调起微信扫一扫接口 |
| `editAddress`                 | (none) | 共享收货地址接口 |
| `openProductViewWithPid`      | `pid`, `view_type`, `ext_info` | 跳转微信商品页接口 |
| `batchAddCard`                | `card_list` | 批量添加卡券接口 |
| `chooseCard`                  | `app_id`, `location_id`, `sign_type`, `card_id`, `card_type`, `card_sign`, `time_stamp`, `nonce_str` | 拉取适用卡券列表并获取用户选择信息 |
| `batchViewCard`               | `card_list` | 查看微信卡包中的卡券接口 |
| `consumedShareCard`           | `consumedCardId`, `consumedCode` | (unknown) |
| `getBrandWCPayRequest`        | `timestamp`, `nonceStr`, `package`, `paySign`, `signType` | 发起一个微信支付请求 |
| `getRecevieBizHongBaoRequest` | `timestamp`, `nonceStr`, `package`, `paySign`, `signType` | (unknown) |
| `startMonitoringBeacons`      | `ticket` | 开启查找周边 ibeacon 设备接口 |
| `stopMonitoringBeacons`       | (none) | 关闭查找周边 ibeacon 设备接口 |
| `openEnterpriseChat`          | `useridlist`, `chatname` | (unknown) |
| `launchMiniProgram`           | `targetAppId`, `path`, `envVersion` | 打开小程序 |
| `openBusinessView`            | `businessType`, `queryString`, `envVersion` | (unknown) |
| `invokeMiniProgramAPI`        | `name`, `arg` | (unknown) |

### Handlers for JS listening on WebView Bridge

| Handler Name            | Official Description |
| ----------------------- | --- |
| `menu:share:timeline`   | 监听“分享到朋友圈”按钮点击 |
| `menu:share:appmessage` | 监听“分享给朋友”按钮点击 |
| `menu:share:qq`         | 监听“分享到 QQ”按钮点击 |
| `menu:share:weiboApp`   | 监听“分享到腾讯微博”按钮点击 |
| `menu:share:QZone`      | 监听“分享到 QQ 空间”按钮点击 |
| `onVoiceRecordEnd`      | 监听录音自动停止接口 |
| `onVoicePlayEnd`        | 监听语音播放完毕接口 |
| `onBeaconsInRange`      | 监听周边 ibeacon 设备接口 |

## License

[MIT](http://opensource.org/licenses/MIT)
