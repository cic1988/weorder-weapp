// pages/shipping-detail/shipping-detail.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const app = getApp();

Page(Object.assign({}, app.Methods, {
	data: Object.assign({}, app.Variables, {
		order_id: null,
		order: null
	}),
	onLoad(options) {
    app.configureThemeColor()
    
		app.Util.network.GET({
			url: app.API('order_detail') + options.order_id,
			params: {
				w2w_session: app.data.w2w_session
			},
			success: data => {
				this.setData({ order_id: options.order_id, order: data });
			}
		});
	},
	onShow() {

	},
	onPullDownRefresh() {
		this.onLoad({ order_id: this.data.order_id });
	},
	onReachBottom() {

	}
}))