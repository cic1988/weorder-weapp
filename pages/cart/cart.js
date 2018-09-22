// pages/cart/cart.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const Zan = require('../../vendor/ZanUI/index');
const app = getApp();

Page(Object.assign({}, Zan.Stepper, Zan.TopTips, app.Methods, {
	data: Object.assign({}, app.Variables, {
		currency: null,
		cart: null,
		_isLoginPopup: false,
    title: '购物车'
	}),
	// 数量选择 更新购物车
	handleZanStepperChange(e) {
		var componentId = e.componentId,
			stepper = e.stepper,
			params = {
				w2w_session: app.data.w2w_session,
				cart_key: componentId,
			},
			url;

		if (stepper == 0) {
			url = app.API('delete_cart');
		}
		else {
			url = app.API('update_cart');
			params.quantity = stepper;
		}

		app.Util.network.POST({
			url: url,
			params: params,
			success: data => {
				app.updateCart(data);
				this.setData({ cart: data });
				if (data.errors.length > 0) {
					this.showZanTopTips(data.errors);
				}
			}
		});
	},
	// 删除购物车项
	deleteCartItem(e) {

		var cart_key = e.currentTarget.dataset.cartKey;

		app.Util.network.POST({
			url: app.API('delete_cart'),
			params: {
				w2w_session: app.data.w2w_session,
				cart_key: cart_key
			},
			success: data => {
				wx.showToast({
					title: '删除成功',
					duration: 1500
				});
				app.updateCart(data);
				this.setData({ cart: data });
				if (data.errors.length > 0) {
					this.showZanTopTips(data.errors);
				}
			}
		});
	},
	// 登录成功
	loginSuccess({ userInfo, cart }) {
		this.setData({ cart: cart, _isLoginPopup: false });
		if (cart.errors.length > 0) {
			this.showZanTopTips(cart.errors);
		}
	},
	// 结算
	goCheckout() {
		/*
		if (this.data.cart.errors.length > 0) {
			this.showZanTopTips(this.data.cart.errors);
		}
		else {*/
			wx.navigateTo({
				url: '/pages/checkout/checkout'
			})
		//}
	},
	// 随便逛逛
	goShopping() {
		wx.navigateTo({
			url: '/pages/product-list/product-list?mode=all'
		})
	},
	onLoad(options) {
		this.setData({ currency: app.data.currency });
		app.checkLogin({
			fail: () => {
				this.setData({ _isLoginPopup: true });
				wx.login({
					success: (res) => {
						app.data.js_code = res.code
					}
				})
			}
		});
    app.configureLanguage();
    app.configureThemeColor()
	},
	onShow() {
		/*if (app.data.cart != null) {
			wx.showLoading({
				title: '正在加载',
				mask: true
			})
			this.setData({
				cart: app.data.cart
			}, () => {
				wx.hideLoading();
			});
			app.updateCart(app.data.cart);
			if (app.data.cart.errors.length > 0) {
				this.showZanTopTips(app.data.cart.errors);
			}
		}
		else {
			this.onPullDownRefresh();
		}*/
		this.onPullDownRefresh();
    app.configureLanguage();
	},
	onPullDownRefresh() {
		this.checkLogin(() => {
			app.refreshCart((cart) => {
				this.setData({ cart: cart, _isLoginPopup: false });
				if (cart.errors.length > 0) {
					this.showZanTopTips(cart.errors);
				}
			});
		});
	},
	onReachBottom() {

	}
}))