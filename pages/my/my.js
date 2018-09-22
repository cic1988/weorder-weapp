// pages/my.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const app = getApp();

Page(Object.assign({}, app.Methods, {
    data: Object.assign({}, app.Variables, {
        userInfo: null,
        showLanguagePopup: false,
        title: '我的' 
    }),
    goOrderList() {
        wx.navigateTo({
            url: '/pages/order-list/order-list?status=all',
        })
    },
    goMyFavour() {
        wx.navigateTo({
            url: '/pages/product-list/product-list?mode=favor',
        })
    },
    goAbout() {
        wx.navigateTo({
            url: '/pages/about/about',
        })
    },
    scanQR() {
      wx.showLoading({
        title: this.data._t['正在加载'],
      })

      wx.scanCode({
        onlyFromCamera: true,
        scanType: 'qrCode',

        success: (res) => {
          wx.hideLoading()

          var scene = res.path.substr(res.path.indexOf('?scene=') + 7);
          app.initialize(scene);
        },

        fail: (res) => {
          wx.hideLoading()
        }

      })
    },
    chooseLanguage(e) {

      this.setData({
        showLanguagePopup: !this.data.showLanguagePopup
      });

      console.log('语言：' + e.target.id)

      if (e.target.id && wx.getStorageSync('Language') != e.target.id) {
        wx.setStorageSync('Language', e.target.id);
        this.onShow();

        // update navigation and tab title
        app.updateTabBarLanguage();
      }
    },
    /* W2W Extension, Name: w2w-scan-to-login, Code: scanQRCode */

/* W2W Extension, Name: w2w-scan-to-login, Code: scanQRCode */
    onLoad(options) {
      app.configureThemeColor()
    },
    onShow() {
        this.setData({
            userInfo: app.data.userInfo
        });
        app.checkLogin({
            fail: () => {
                wx.login({
                    success: (res) => {
                        app.data.js_code = res.code
                    }
                })
            }
        });
        app.configureLanguage();
    },
    /*
    onPullDownRefresh() {

    },
	*/
    onReachBottom() {

    }
}))