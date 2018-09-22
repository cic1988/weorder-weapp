// pages/coupon/coupon.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const app = getApp();

Page(Object.assign({}, app.Methods, {
	data: Object.assign({}, app.Variables, {
		btnEnabled: false,
		coupons: null,
		coupon_input: ''
	}),
	couponInput(e) {
		this.setData({ btnEnabled: e.detail.value.length > 0 });
	},
	// 应用优惠券
	couponSubmit(e) {
		var coupon = '';
		// 表单提交
		if (typeof e.detail.value == 'object') {
			coupon = e.detail.value.coupon;
		}
		// 输入框完成提交
		else {
			coupon = e.detail.value;
		}

		if (coupon == '') return;

		app.Util.network.POST({
			url: app.API('apply_coupon'),
			params: {
				w2w_session: app.data.w2w_session,
				coupon_code: coupon
			},
			success: data => {
				var toast = {};
				toast.title = data.success ? data.success : data.error;
				toast.icon = 'none';
				wx.showToast(toast);

				app.updateCart(data.cart);
				app.data.shipping = data.shipping;

				this.setData({
					coupons: data.coupons,
					btnEnabled: false,
					coupon_input: ''
				});
			}
		});
	},
	// 移除优惠券
	removeCoupon(e) {
		var coupon = e.currentTarget.dataset.id;
		app.Util.network.POST({
			url: app.API('remove_coupon'),
			params: {
				w2w_session: app.data.w2w_session,
				coupon_code: coupon
			},
			success: data => {
				var toast = {};
				toast.title = data.success ? data.success : data.error;
				toast.icon = 'none';
				wx.showToast(toast);

				app.updateCart(data.cart);
				app.data.shipping = data.shipping;

				this.setData({ coupons: data.coupons });
			}
		});
	},
	onLoad(options) {
    app.configureThemeColor()

		this.setData({ currency: app.data.currency });

		app.Util.network.GET({
			url: app.API('get_coupon'),
			params: {
				w2w_session: app.data.w2w_session
			},
			success: data => {
				this.setData({ coupons: data });
			}
		});
	},
	onShow() {

	},
	onPullDownRefresh() {
		this.onLoad();
	},
	onReachBottom() {

	}
}))