// pages/order-detail/order-detail.js

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
		order: null,
    title: '订单详情'
	}),
	// 取消订单
	cancelOrder(e) {
		app.cancelOrder({
			id: this.data.order_id,
			success: data => {
				var toast = {};
				if (data.success == true) {
					toast.title = '取消成功';
				}
				else {
					toast.title = '取消失败，请稍后再试';
					toast.icon = 'none';
				}
				toast.success = () => {
					setTimeout(() => {
						this.onPullDownRefresh();
					}, 1500);
				}
				wx.showToast(toast);
			}
		});
	},
	// 发起支付
	makePayment() {
		app.requestPayment({
			id: this.data.order.id,
			success: res => {
				wx.showToast({
					title: '支付成功',
					success: () => {
						setTimeout(() => {
							this.onLoad({ id: this.data.order_id });
						}, 1500);
					}
				});
			},
			fail: res => {
				if (res.errMsg != 'requestPayment:fail cancel') {
					wx.showToast({
						title: res.errMsg,
						icon: 'none'
					});
				}
			}
		})
	},
	goProductDetail(e) {
		app.goProductDetail(e);
	},
	goShippingDetail() {
		wx.navigateTo({
			url: '/pages/shipping-detail/shipping-detail?order_id=' + this.data.order_id
		})
	},
	onLoad(options) {
		app.Util.network.GET({
			url: app.API('order_detail') + options.id,
			params: {
				w2w_session: app.data.w2w_session
			},
			success: data => {
				this.setData({
					order: data,
					order_id: data.id,
					order_status: app.Util.getOrderStatus(data.status),
					province: app.Util.getStateName(data.billing.state),
					currency: app.data.currency,
				});
			}
		});
    app.configureLanguage();
    app.configureThemeColor()
	},
	onShow() {

	},
	onPullDownRefresh() {
		this.onLoad({ id: this.data.order_id });
	},
	onReachBottom() {

	}
}))