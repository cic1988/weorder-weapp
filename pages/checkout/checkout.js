// pages/checkout/checkout.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const Zan = require('../../vendor/ZanUI/index');
const app = getApp();

Page(Object.assign({}, Zan.TopTips, app.Methods, {
    data: Object.assign({}, app.Variables, {
        address: null,
        cart: null,
        isShippingPopup: false,
        shipping: null,
        coupons: null,
        address_auth: true, // 是否授权收货地址
        title: '结算'
    }),
    // 检查配送方式
    checkShipping() {
        if (app.data.address == '') {
            wx.showToast({
                title: '请先选择收货地址',
                icon: 'none'
            })
            return false;
        } else if (app.data.cart.needs_shipping === true && app.data.shipping.methods.length == 0) {
            wx.showToast({
                title: '当前地址暂无可用配送方式',
                icon: 'none'
            })
            return false;
        }

        return true;
    },
    // 打开配送方式弹窗
    openShippingPopup() {
        if (this.data.cart.errors.length > 0) {
            this.showZanTopTips(this.data.cart.errors);
            return;
        }

        if (app.data.cart.needs_shipping === false) {
            wx.showToast({
                title: '当前订单无需物流',
                icon: 'none'
            })
        } else {
            if (this.checkShipping()) {
                this.setData({
                    isShippingPopup: true
                });
            }
        }
    },
    // 关闭配送方式弹窗
    closeShippingPopup() {
        this.setData({
            isShippingPopup: false
        });
    },
    // 新版 - 按钮打开设置页回调
    openSetting(e) {
        console.log(e);
        if (e.detail.authSetting['scope.address'] == true) {
            this.setData({
                address_auth: true
            });
            this.selectAddressSuccess();
        }
    },
    // 选择收货地址
    selectAddress() {
        wx.authorize({
            scope: 'scope.address',
            success: () => {
                this.selectAddressSuccess();
            },
            fail: () => {
                //this.setData({ address_auth: false }); // 为新版做准备
                wx.showModal({
                    title: '未授权',
                    content: '提交订单需要获取通讯地址，请在下一个页面中打开通讯地址授权',
                    cancelColor: '#589684',
                    confirmColor: '#589684',
                    confirmText: '设置授权',
                    success: res => {
                        if (res.confirm) {
                            wx.openSetting({
                                success: res => {
                                    if (res.authSetting['scope.address'] == true) {
                                        this.selectAddressSuccess();
                                    }
                                }
                            })
                        }
                    }
                })
            }
        })
    },
    // 选择收货地址成功
    selectAddressSuccess() {
        wx.chooseAddress({
            success: res => {
                console.log('获取收货地址成功', res);
                app.data.address = res;
                this.setData({
                    address: res
                });
                wx.setStorage({
                    key: 'address',
                    data: res
                })

                this.getShippingMethods();
            }
        })
    },
    // 获取配送方式
    getShippingMethods() {

        var address_param = app.getAddressParam();

        app.Util.network.GET({
            url: app.API('get_shipping_method'),
            params: Object.assign({},
                address_param, {
                    w2w_session: app.data.w2w_session,
                }
            ),
            success: data => {
                app.updateCart(data.cart);
                app.data.shipping = data.shipping;
                app.data.payment = data.payment;
                this.setData(data);
                if (data.cart.errors.length > 0) {
                    this.showZanTopTips(data.cart.errors);
                }
            }
        });
    },
    // 选择配送方式
    shippingChange(e) {
        var method = e.currentTarget.dataset.id;
        this.closeShippingPopup();

        app.Util.network.POST({
            url: app.API('set_shipping_method'),
            params: {
                w2w_session: app.data.w2w_session,
                shipping_method: method
            },
            success: data => {
                app.updateCart(data.cart);
                app.data.shipping = data.shipping;
                app.data.payment = data.payment;
                this.setData(data);
            }
        });
    },
    // 选择支付方式
    paymentChange(e) {
        if (this.data.cart.errors.length > 0) {
            this.showZanTopTips(this.data.cart.errors);
            return;
        }

        var payment = e.currentTarget.dataset.id;
        app.Util.network.POST({
            url: app.API('set_payment_method'),
            params: {
                w2w_session: app.data.w2w_session,
                payment_method: payment
            },
            success: data => {
                app.data.payment = data.payment;
                this.setData(data);
            }
        });
    },
    goCoupon() {
        if (this.data.cart.errors.length > 0) {
            this.showZanTopTips(this.data.cart.errors);
            return;
        }

        if (this.data.cart.coupons_enabled) {
            wx.navigateTo({
                url: '/pages/coupon/coupon'
            })
        } else {
            wx.showToast({
                icon: 'none',
                title: '暂不支持优惠券'
            })
        }
    },
    // 提交订单
    goSubmitOrder(e) {
        if (this.data.cart.errors.length > 0) {
            this.showZanTopTips(this.data.cart.errors);
            return;
        }
        if (!this.checkShipping()) return;
        if (this.data.payment.chosen_method === false) {
            wx.showToast({
                icon: 'none',
                title: '暂无可用支付方式'
            })
            return;
        }
        if (app.data.cart.cart_contents_count == 0) return;

        var order_param = app.getOrderParam(),
            params = Object.assign({},
                order_param, {
                    w2w_session: app.data.w2w_session,
                    order_comments: e.detail.value.comment,
                    formId: e.detail.formId
                }
            );

        if (this.data.shipping.chosen_method != '') {
            params.shipping_method = this.data.shipping.chosen_method;
        }
        if (this.data.payment.chosen_method != '') {
            params.payment_method = this.data.payment.chosen_method;
        }

        app.Util.network.POST({
            url: app.API('order'),
            params: params,
            success: data => {
                console.log(data);

                // 订单提交成功
                if (data.result == 'success') {

                    // 需要付费
                    if (data.order != undefined) {
                        var order_id = data.order.id;

                        // 发起支付
                        app.requestPayment({
                            id: order_id,
                            success: res => {
                                wx.showToast({
                                    title: '支付成功',
                                    success: () => {
                                        setTimeout(() => {
                                            wx.redirectTo({
                                                url: '/pages/order-detail/order-detail?id=' + order_id + '&status=success',
                                            })
                                        }, 1500);
                                    }
                                });
                            },
                            fail: res => {
                                if (res.errMsg == 'requestPayment:fail cancel') {
                                    wx.redirectTo({
                                        url: '/pages/order-detail/order-detail?id=' + order_id + '&status=cancel',
                                    })
                                } else {
                                    wx.showToast({
                                        title: '支付暂时出现问题，请稍候再试',
                                        icon: 'none',
                                        success: () => {
                                            setTimeout(() => {
                                                wx.redirectTo({
                                                    url: '/pages/order-detail/order-detail?id=' + order_id + '&status=fail',
                                                })
                                            }, 1500);
                                        }
                                    });
                                }
                            },
                            complete: res => {
                                console.log(res);
                                this.emptyCheckoutData();
                            }
                        });
                    }
                    // 不需付费
                    else {
                        var redirect = data.redirect,
                            exp = /order\-received\/(\d+)\/\?key\=/g,
                            result = exp.exec(redirect);
                        if (result != null) {
                            wx.showToast({
                                title: '订单提交成功',
                                success: () => {
                                    setTimeout(() => {
                                        wx.redirectTo({
                                            url: '/pages/order-detail/order-detail?id=' + result[1] + '&status=success',
                                        })
                                    }, 1500);
                                }
                            });
                        }
                    }
                }
                // 订单提交失败
                else if (data.result == 'failure') {

                    if (data.messages) {
                        var exp = /\<li\>(.*?)\<\/li\>/ig,
                            result,
                            errors = [];
                        while ((result = exp.exec(data.messages)) != null) {
                            errors.push(result[1]);
                        }
                        this.showZanTopTips(errors);
                    } else {
                        this.showZanTopTips(['提交失败，请稍候再试']);
                    }
                }
            }
        });
    },
    // 清空结算数据
    emptyCheckoutData() {
        app.updateCart({
            cart: null,
            cart_contents_count: 0
        });
        //app.shipping = null;
        app.data.coupons = [];

        this.load();
    },
    load() {
        var data = {
            currency: app.data.currency,
            cart: app.data.cart,
            coupons: app.data.coupons
        };
        if (app.data.address != null) {
            data.address = app.data.address;
        }
        if (app.data.shipping != null) {
            data.shipping = app.data.shipping;
        }
        if (app.data.payment != null) {
            data.payment = app.data.payment;
        }
        this.setData(data);
    },
    onLoad(options) {
        this.load();
        this.getShippingMethods();
        app.configureLanguage();
        app.configureThemeColor()
    },
    onShow() {
        this.load();
        app.configureLanguage()
    },
    onPullDownRefresh() {
        this.onLoad();
    },
    onReachBottom() {

    }
}))