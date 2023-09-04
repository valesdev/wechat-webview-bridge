declare global {
  interface Window {
    WeixinJSBridge?: {
      on: (handlerName: string, listener: (response: any) => void) => void
      invoke: (handlerName: string, params: { [key: string]: any }, listener: (response: any) => void) => void
    }
    __wxjs_environment?: string
  }
}

export interface ConfigData {
  appId: string
  timestamp: number
  nonceStr: string
  signature: string
}

export default class WeChatWebViewBridge {
  private configHandler: (({ url }: { url: string }) => Promise<ConfigData>) | null = null
  private jsApiList: Array<string> = []
  private openTagList: Array<string> = []
  private debug: boolean = false

  private _landedUrl: string = this.urlToConfig

  private _configData: ConfigData | null = null

  constructor({
    configHandler,
    jsApiList = [],
    openTagList = [],
    debug = false
  }: {
    configHandler: ({ url }: { url: string }) => Promise<ConfigData>
    jsApiList?: Array<string>
    openTagList?: Array<string>
    debug?: boolean
  }) {
    this.configHandler = configHandler
    this.jsApiList = jsApiList
    this.openTagList = openTagList
    this.debug = debug
  }

  load (): Promise<void> {
    return new Promise<void>((resolve) => {
      if (window.WeixinJSBridge !== undefined) {
        resolve()
      } else {
        window.document.addEventListener('WeixinJSBridgeReady', function () {
          resolve()
        }, false)
      }
    })
  }

  config (): Promise<void> {
    // get configuration data from custom handler
    return Promise.resolve()
      .then(() => {
        if (this.configHandler === null) {
          throw new Error('configHandler cannot be null')
        }

        return this.configHandler({
          url: (WeChatWebViewBridge.isIOS && !WeChatWebViewBridge.isWeChatDevTools ? this._landedUrl : this.urlToConfig)
        })
          .then(res => {
            // keep them in the instance
            this._configData = res
          })
      })
      .then(() => {
        // wait for native bridge initialization
        return this.load()
      })
      .then(() => {
        // request grant for APIs
        return this.invoke('preVerifyJSAPI', {
          verifyJsApiList: this.jsApiList,
          verifyOpenTagList: this.openTagList
        })
      })
      .then(() => { })
  }

  invoke (
    handlerName: string,
    params: { [key: string]: any } = {}
  ) {
    return new Promise<any>((resolve, reject) => {
      // if not initialized
      if (window.WeixinJSBridge === undefined) {
        reject(new Error('WeChat JS Bridge is not initialized.'))
        return
      }

      // if not configured
      if (this._configData === null) {
        reject(new Error('WeChat JS Bridge is not configured.'))
        return
      }

      // debug info
      this.log('invoke() begin:', handlerName)

      // perform on bridge
      window.WeixinJSBridge.invoke(handlerName, Object.assign({}, params, {
        appId: this._configData.appId,
        verifyAppId: this._configData.appId,
        verifySignType: 'sha1',
        verifyTimestamp: this._configData.timestamp + '',
        verifyNonceStr: this._configData.nonceStr,
        verifySignature: this._configData.signature
      }), res => {
        // debug info
        this.log('invoke() end:', handlerName, JSON.stringify(res))

        if (!('errMsg' in res)) {
          res.errMsg = res.err_msg
          delete res.err_msg
        }

        if (!('errMsg' in res)) {
          resolve(null)
          return
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

  on (
    handlerName: string,
    listener: (response: any) => void
  ) {
    return new Promise<void>((resolve, reject) => {
      // if not initialized
      if (window.WeixinJSBridge === undefined) {
        reject(new Error('WeChat JS Bridge is not initialized.'))
        return
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

  log (...args: Array<any>) {
    this.debug && window.console.debug('[WeChat WebView Bridge]', ...args)
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
    return this._configData !== null
  }

  /**
   * @readonly
   */
  static get isIOS () {
    return (/iPhone|iPad|iPod/i.test(window.navigator.userAgent))
  }

  /**
   * @readonly
   */
  static get isAndroid () {
    return (/Android/i.test(window.navigator.userAgent))
  }

  /**
   * @readonly
   */
  static get isWeChat () {
    return (/micromessenger/i.test(window.navigator.userAgent))
  }

  /**
   * @readonly
   */
  static get isWeChatBrowser () {
    return ((/micromessenger/i.test(window.navigator.userAgent)) && window.__wxjs_environment !== 'miniprogram')
  }

  /**
   * @readonly
   */
  static get isWeChatMiniProgram () {
    return ((/micromessenger/i.test(window.navigator.userAgent)) && window.__wxjs_environment === 'miniprogram')
  }

  /**
   * @readonly
   */
  static get isWeChatDevTools () {
    return (/wechatdevtools/i.test(window.navigator.userAgent))
  }
}
