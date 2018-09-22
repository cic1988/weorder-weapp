// pages/utils/methods.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

var Methods = {
	// 检查登录
	checkLogin(callback = function () { }) {
		var app = getApp();
		app.checkLogin({
			success: () => {
				callback();
			},
			fail: () => {
				this.openLoginPopup();
				this._loginSuccess = callback;
			}
		});
	},
	// 获取用户信息
	getUserInfo(e) {
		var app = getApp();
		app.buttonGetUserInfo(e, {
			success: ({ userInfo, cart }) => {
				this.setData({ userInfo: userInfo });
				setTimeout(() => {
					this.closeLoginPopup();
					if (typeof (this.loginSuccess) == 'function') {
						this.loginSuccess({
							userInfo: userInfo,
							cart: cart
						});
					}
					if (typeof (this._loginSuccess) == 'function') {
						this._loginSuccess();
						delete this._loginSuccess;
					}
				}, 1500);
			},
			fail: () => {
				this.closeLoginPopup();
				delete this._loginSuccess;
			}
		});
	},
	closeLoginPopup() {
		this.setData({ isLoginPopup: false });
	},
	openLoginPopup() {
		this.setData({ isLoginPopup: true });
	},
	// 添加购物车
	doAddToCart (e, callback = function () { }, newPage = true) {

		var app = getApp(),
			dataset = e.currentTarget.dataset,
			product_id = dataset.id,
			product_type = dataset.type,
			product_name = dataset.name,
			in_stock = dataset.inStock,
			url = '/pages/product-detail/product-detail?id=' + product_id + '&name=' + product_name + '&popup=true';

		if (product_type == 'variable') {
			if (newPage) {
				wx.navigateTo({
					url: url
				})
			}
			else {
				wx.redirectTo({
					url: url
				})
			}
		}
		else {
			this.checkLogin(() => {
				app.Util.network.POST({
					url: app.API('add_to_cart'),
					params: {
						product_id: product_id,
						quantity: 1,
						w2w_session: app.data.w2w_session
					},
					success: data => {
						if (data.errors.length > 0) {
							this.showZanTopTips(data.errors);
						}
						else {
							wx.showToast({
								title: '添加成功'
							})
						}

						app.updateCart(data);
						callback(data);
					}
				});
			});
		}
	},
	// 跳转首页
	goIndex(){
		wx.switchTab({
			url: '/pages/index/index'
		})
	},
	// 复制文字
	copyText(e) {
		var app = getApp();
		var copy = e.currentTarget.dataset.copy;
		app.Util.setClipboard(copy);
	},
}

module.exports = Methods;