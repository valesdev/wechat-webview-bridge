# wechat-webview-bridge

[![Version](https://img.shields.io/npm/v/wechat-webview-bridge.svg)](https://www.npmjs.com/package/wechat-webview-bridge)
[![Downloads](https://img.shields.io/npm/dm/wechat-webview-bridge.svg)](https://npmcharts.com/compare/wechat-webview-bridge?minimal=true)
[![License](https://img.shields.io/npm/l/wechat-webview-bridge.svg)](https://www.npmjs.com/package/wechat-webview-bridge)

A substitute for the official WeChat JS-SDK library, rewritten from `https://res.wx.qq.com/open/js/jweixin-1.4.0.js`.

## Quick Start

```js
import axios from 'axios'
import WeChatWebViewBridge from 'wechat-webview-bridge'

/**
 * function to request WeChat JS-SDK configuration parameters
 *
 * @var function
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
 * list of WeChat JS-SDK API you want to grant
 *
 * @var array
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
 * bridge instance
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

### `new WeChatWebViewBridge()`

| Parameter | Type | Description | Default |
| --- | --- | --- | --- |
| `options` | objecct | | |
| `options.configHandler` | function | Function to request WeChat JS-SDK configuration parameters. It should return a Promise and resolves with an object contains WeChat configuration parameters (`appId`, `timestamp`, `nonceStr` and `signature`). | (required) |
| `options.apiList` | array | List of WeChat JS-SDK API names you want to grant. | `[]` |
| `options.debug` | bool | Enable console debug output. | `false` |

### `bridge.load()`

Asynchronously wait for WebView bridge initialized. The returned Promise will be resolved once the bridge is ready to config.

- Parameters: (none)
- Returns: `Promise<void>`

### `bridge.config()`

Get configuration parameters from provided function and then pass to `preVerifyJSAPI` handler immediately. The returned Promise will be resolved once the bridge is ready to use.

- Parameters: (none)
- Returns: `Promise<any>`

### `bridge.invoke()`

Invoke WebView bridge handler. (see below for the complete handler list)

| Parameter | Type | Description | Default |
| --- | --- | --- | --- |
| `handerName` | string | The name of handler to be called. | (required) |
| `params` | object | Parameters passed to WeChat WebView bridge. | `{}` |

- Returns: `Promise<any>`

### `bridge.on()`

Listen on WebView bridge event. (see below for the complete handler list)

| Parameter | Type | Description | Default |
| --- | --- | --- | --- |
| `handlerName` | string | The name of event to be listened on. | (required) |
| `listener` | function | The callback for WeChat WebView bridge response. | (required) |

- Returns: `Promise<void>`

### `bridge.urlToConfig`

Get trimmed URL at the moment for WeChat WebView to configure.

- Returns: `string`

### `bridge.configData`

Get WeChat WebView bridge configuration data.

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

### Handlers (JS calls WebView Bridge)

| Handler Name | Official Description | Parameters |
| --- | --- | --- |
| `preVerifyJSAPI` | 注入权限验证配置 | `verifyJsApiList` |
| `checkJsApi` | 判断当前客户端版本是否支持指定 JS 接口 | `jsApiList` |
| `imagePreview` | 预览图片接口 | `current`, `urls` |
| `uploadImage` | 上传图片接口 | `localId`, `isShowProgressTips` |
| `downloadImage` | 下载图片接口 | `serverId`, `isShowProgressTips` |
| `getLocalImgData` | 获取本地图片接口 | `localId` |
| `startRecord` | 开始录音接口 | (none) |
| `stopRecord` | 停止录音接口 | (none) |
| `playVoice` | 播放语音接口 | `localId` |
| `pauseVoice` | 暂停播放接口 | `localId` |
| `stopVoice` | 停止播放接口 | `localId` |
| `uploadVoice` | 上传语音接口 | `localId`, `isShowProgressTips` |
| `downloadVoice` | 下载语音接口 | `serverId`, `isShowProgressTips` |
| `translateVoice` | 识别音频并返回识别结果接口 | `localId`, `isShowProgressTips` |
| `getNetworkType` | 获取网络状态接口 | (none) |
| `openLocation` | 使用微信内置地图查看位置接口 | `latitude`, `longitude`, `name`, `address`, `scale`, `infoUrl` |
| `geoLocation` | 获取地理位置接口 | (none) |
| `hideOptionMenu` | (unknown) | (none) |
| `showOptionMenu` | (unknown) | (none) |
| `startMonitoringBeacons` | 开启查找周边 ibeacon 设备接口 | `ticket` |
| `stopMonitoringBeacons` | 关闭查找周边 ibeacon 设备接口 | (none) |
| `closeWindow` | 关闭当前网页窗口接口 | (none) |
| `hideMenuItems` | 批量隐藏功能按钮接口 | `menuList` |
| `showMenuItems` | 批量显示功能按钮接口 | `menuList` |
| `hideAllNonBaseMenuItem` | 隐藏所有非基础按钮接口 | (none) |
| `showAllNonBaseMenuItem` | 显示所有功能按钮接口 | (none) |
| `scanQRCode` | 调起微信扫一扫接口 | `needResult`, `scanType` |
| `openProductViewWithPid` | 跳转微信商品页接口 | `pid`, `view_type`, `ext_info` |
| `batchAddCard` | 批量添加卡券接口 | `card_list` |
| `chooseCard` | 拉取适用卡券列表并获取用户选择信息 | `app_id`, `location_id`, `sign_type`, `card_id`, `card_type`, `card_sign`, `time_stamp`, `nonce_str` |
| `batchViewCard` | 查看微信卡包中的卡券接口 | `card_list` |
| `consumedShareCard` | (unknown) | `consumedCardId`, `consumedCode` |
| `getBrandWCPayRequest` | 发起一个微信支付请求 | `timeStamp`, `nonceStr`, `package`, `signType`, `paySign` |
| `editAddress` | 共享收货地址接口 | (none) |
| `getRecevieBizHongBaoRequest` | (unknown) | (none) |

### Handlers (JS listens on WebView Bridge)

| Handler Name | Official Description |
| --- | --- |
| `menu:share:timeline` | 分享到朋友圈 |
| `menu:share:appmessage` | 分享给朋友 |
| `menu:share:qq` | 分享到 QQ |
| `menu:share:weiboApp` | 分享到腾讯微博 |
| `menu:share:QZone` | 分享到 QQ 空间 |
| `onVoiceRecordEnd` | 监听录音自动停止接口 |
| `onVoicePlayEnd` | 监听语音播放完毕接口 |
| `onBeaconsInRange` | 监听周边 ibeacon 设备接口 |

## License

[MIT](http://opensource.org/licenses/MIT)
