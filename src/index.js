export default class WeChatWebViewBridge {

  constructor ({ configHandler, apiList = [], debug = false }) {
    this._options = { configHandler, apiList, debug }

    this._landedURL = this.urlToConfig
    this._configData = {}
  }

  load () {
    return new Promise((resolve) => {
      if (window.WeixinJSBridge) {
        resolve()
      } else {
        window.document.addEventListener('WeixinJSBridgeReady', function () {
          resolve()
        }, false)
      }
    })
  }

  config () {
    // get configuration data from custom handler
    return this._options.configHandler({
      url: (this.isIOS && !this.isWeChatDevTools ? this._landedURL : this.urlToConfig)
    })
      .then(({ appId, timestamp, nonceStr, signature }) => {

        // keep them in the instance
        this._configData = { appId, timestamp, nonceStr, signature }

      })
      .then(() => {

        // wait for native bridge initialization
        return this.load()

      })
      .then(() => {

        // request grant for APIs
        return this.invoke('preVerifyJSAPI', {
          verifyJsApiList: this._options.apiList
        })

      })
  }

  invoke (handlerName, params = {}) {
    return new Promise((resolve, reject) => {
      // if not initialized
      if (!window.WeixinJSBridge) {
        reject(new Error('WeChat JS Bridge is not initialized.'))
      }

      // debug info
      this.log('invoke() begin:', handlerName)

      // perform on bridge
      window.WeixinJSBridge.invoke(handlerName, Object.assign({}, params, {
        appId: this.configData.appId,
        verifyAppId: this.configData.appId,
        verifySignType: 'sha1',
        verifyTimestamp: this.configData.timestamp + '',
        verifyNonceStr: this.configData.nonceStr,
        verifySignature: this.configData.signature
      }), res => {
        // debug info
        this.log('invoke() end:', handlerName, JSON.stringify(res))

        if (!('errMsg' in res)) {
          res.errMsg = res.err_msg
          delete res.err_msg
        }

        if (!res.errMsg) {
          return resolve()
        }

        const message = res.errMsg.substring(res.errMsg.indexOf(':') + 1)

        switch (message) {
          case 'ok':
          case 'confirm':
            resolve(res)
            break
          default:
            reject(new Error(message))
        }
      })
    })
  }

  on (handlerName, listener) {
    return new Promise((resolve, reject) => {
      // if not initialized
      if (!window.WeixinJSBridge) {
        reject(new Error('WeChat JS Bridge is not initialized.'))
      }

      // debug info
      this.log('on() listened on:', handlerName)

      // perform on bridge
      window.WeixinJSBridge.on(handlerName, res => {

        // debug info
        this.log('on() triggered:', handlerName, JSON.stringify(res))

        if (!('errMsg' in res)) {
          res.errMsg = res.err_msg
          delete res.err_msg
        }

        listener(res)
      })

      resolve()
    })
  }

  log () {
    this._options.debug && window.console.debug('[WeChat WebView Bridge]', ...arguments)
  }

  /**
   * @readonly
   */
  get urlToConfig () {
    return window.location.href.split('#')[0]
  }

  /**
   * @readonly
   */
  get configData () {
    return this._configData
  }

  /**
   * @readonly
   */
  get ready () {
    return !!this._configData.appId
  }

  /**
   * @readonly
   */
  get isIOS () {
    return (/iPhone|iPad|iPod/i.test(window.navigator.userAgent))
  }

  /**
   * @readonly
   */
  get isAndroid () {
    return (/Android/i.test(window.navigator.userAgent))
  }

  /**
   * @readonly
   */
  get isWeChat () {
    return (/micromessenger/i.test(window.navigator.userAgent))
  }

  /**
   * @readonly
   */
  get isWeChatBrowser () {
    return ((/micromessenger/i.test(window.navigator.userAgent)) && window.__wxjs_environment !== 'miniprogram')
  }

  /**
   * @readonly
   */
  get isWeChatMiniProgram () {
    return ((/micromessenger/i.test(window.navigator.userAgent)) && window.__wxjs_environment === 'miniprogram')
  }

  /**
   * @readonly
   */
  get isWeChatDevTools () {
    return (/wechatdevtools/i.test(window.navigator.userAgent))
  }
}
