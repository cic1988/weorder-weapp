// pages/about/about.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const app = getApp();

Page(Object.assign({}, app.Methods, {
    data: Object.assign({}, app.Variables, {
        padding: 40
    }),
    onLoad(options) {
      app.configureThemeColor()
    },
    onShow() {
        app.Util.network.GET({
            url: app.API('about'),
            success: data => {
                this.setData({
                    custom: data.length > 0,
                    content: data,
                    version: app.data.version
                });
            }
        });
    },
    onPullDownRefresh() {
		this.onShow();
    },
    onReachBottom() {

    },
    onShareAppMessage() {

    }
}))