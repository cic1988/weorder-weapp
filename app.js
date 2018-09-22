// app.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const base = require('i18n/base.js');
const _ = base._;

var timeout = 600;

App({
  data: {
    version: '1.4',
    versionDate: '20180803',
    apiPath: 'wp-json/w2w/v1/',
    apiList: {
      login: 'customers/login/',
      scanqrcode: 'customers/scanqrcode/',
      coupon: 'customers/coupon/',
      favor: 'customers/favor',
      index: 'store/index/',
      about: 'store/about/',
      product: 'products/',
      product_list: 'products/',
      product_search: 'products/search/',
      products_filter_orderby: 'products/filter_orderby/',
      category: 'products/categories/',
      get_cart: 'cart/',
      add_to_cart: 'cart/add/',
      update_cart: 'cart/update_quantity/',
      delete_cart: 'cart/delete/',
      set_address: 'cart/address/',
      get_shipping_method: 'cart/shipping/',
      set_shipping_method: 'cart/shipping/',
      get_payment_method: 'cart/payment/',
      set_payment_method: 'cart/payment/',
      get_coupon: 'cart/coupon/',
      apply_coupon: 'cart/coupon/',
      remove_coupon: 'cart/remove_coupon/',
      order: 'orders/',
      cancel_order: 'orders/cancel/',
      order_detail: 'orders/',
      order_list: 'orders/',
      shipping_detail: 'orders/shipping_detail/',
      payment: 'payment/'
    },
    js_code: null,
    w2w_session: null,
    //currency: '¥',
    currency: '€ ',
    cart: null,
    cart_quantity: 0,
    country_id: 'CN',
    //country_id: 'DE',
    address: null,
    shipping: null,
    payment: null,
    coupons: [],
    userInfo: null,
    table: null,
  },
  Util: require('utils/util.js'),
  Methods: require('utils/methods.js'),
  Variables: require('utils/variables.js'),
  // 获取API地址
  API(apiName) {
    return this.data.siteURL + this.data.apiPath + this.data.apiList[apiName];
  },
  // 获取地址参数
  getAddressParam() {
    var address = this.data.address;
    var address_param = {};
    if (address != '') {
      address_param = {
        country_id: this.data.country_id,
        state: this.Util.getStateCode(address.provinceName),
        city: address.cityName,
        postcode: address.postalCode
      };
    }
    return address_param;
  },
  // 获取订单参数
  getOrderParam() {

    /*var address = this.data.address;
    return {
        billing_first_name: address.userName,
        billing_phone: address.telNumber,
        billing_country: this.data.country_id,
        billing_state: this.Util.getStateCode(address.provinceName),
        billing_city: address.cityName,
        billing_address_1: address.countyName + address.detailInfo,
        billing_postcode: address.postalCode,
        // 2018-03-16 添加同意服务条款参数
        terms: true,
        _wpnonce: this.data.cart._wpnonce
    }*/

    // virtual product no shipment address

    var wpnonce = '';

    if (this.data.cart && this.data.cart.hasOwnProperty('_wpnonce')) {
      wpnonce = this.data.cart._wpnonce;
    }
    return {

      billing_first_name: 'User',
      billing_phone: '01234',
      billing_country: '510000',
      billing_state: 'CN20',
      billing_city: '广州市',
      billing_address_1: 'Beijing Road 1',
      billing_postcode: '510000',
      // 2018-03-16 添加同意服务条款参数
      terms: true,
      _wpnonce: wpnonce
    }
  },
  // 刷新购物车
  refreshCart(callback = function() {}) {

    this.Util.network.GET({
      url: this.API('get_cart'),
      params: {
        w2w_session: this.data.w2w_session,
        check_cart_items: true
      },
      success: data => {
        this.updateCart(data);
        callback(data);
      }
    });
  },
  // 更新购物车
  updateCart(cart) {

    this.data.cart = cart;
    this.data.cart_quantity = cart == null ? 0 : cart.cart_contents_count;

    if (this.data.cart_quantity != 0) {
      wx.setTabBarBadge({
        index: 2,
        text: this.data.cart_quantity.toString()
      })
    } else {
      wx.removeTabBarBadge({
        index: 2
      });
    }

    if (cart.coupon_discount_amounts != undefined) {
      this.data.coupons = Object.keys(cart.coupon_discount_amounts);
    }
  },
  // 检查App是否登录
  isLoggedIn() {
    return !(this.data.userInfo == '' || this.data.userInfo == null || this.data.w2w_session == '' || this.data.w2w_session == null);
  },
  checkLogin(callback) {

    if (this.isLoggedIn()) {
      if (callback.success) callback.success();
    } else {
      if (callback.fail) {
        wx.login({
          success: res => {
            this.data.js_code = res.code;
            callback.fail();
          },
          fail: res => {
            console.error('wx.login失败', res);
          }
        });
      }
    }
  },
  // 登录
  login(userRes, callback = function() {}) {

    this.Util.network.POST({
      url: this.API('login'),
      params: {
        js_code: this.data.js_code,
        encryptedData: userRes.encryptedData,
        iv: encodeURIComponent(userRes.iv)
      },
      success: data => {
        if (data.w2w_session != undefined) {
          console.log('登录成功', data.w2w_session);
          // 存储Session
          this.data.w2w_session = data.w2w_session;
          wx.setStorageSync('w2w_session', data.w2w_session);
          callback(data.w2w_session);
        } else {
          console.error('登录失败', data.code + ': ' + data.message);
        }

        this.updateTabBarLanguage()
      },
      loadingTitle: '正在登录'
    });
  },
  // 按钮点击获取用户信息
  buttonGetUserInfo(e, callback) {

    var userRes = e.detail;

    if (userRes.errMsg == 'getUserInfo:ok') {
      console.log('获取用户信息成功', userRes);
      this.data.userInfo = userRes.userInfo;
      wx.setStorageSync('userInfo', userRes.userInfo);

      this.login(userRes, (w2w_session) => {
        this.refreshCart(cart => {
          if (callback.success) {
            callback.success({
              userInfo: userRes.userInfo,
              cart: cart
            });
          }
        });
      });
    } else {
      console.error('获取用户信息失败', userRes);
      if (callback.fail) callback.fail();
    }
  },
  // 登出
  logout() {
    this.data.w2w_session = null;
    this.data.userInfo = null;
    this.updateCart(null);
    wx.removeStorageSync('w2w_session');
    wx.removeStorageSync('userInfo');
    wx.reLaunch({
      url: '/pages/index/index'
    })
  },
  // 微信支付
  requestPayment(paymentData) {

    // 获取支付参数
    this.Util.network.GET({
      url: this.API('payment'),
      params: {
        id: paymentData.id,
        w2w_session: this.data.w2w_session
      },
      success: data => {
        console.log('支付参数', data);

        if (data.success) {

          // 发起微信支付
          wx.requestPayment({
            timeStamp: data.timeStamp,
            nonceStr: data.nonceStr,
            package: data.package,
            signType: 'MD5',
            paySign: data.paySign,
            success: res => {
              if (paymentData.success) paymentData.success(res);
            },
            fail: res => {
              if (paymentData.fail) paymentData.fail(res);
            },
            complete: res => {
              console.log('wx.requestPayment回调', res);
              if (paymentData.complete) paymentData.complete(res);
            }
          });
        } else {
          if (paymentData.fail) paymentData.fail({});
        }

      }
    });
  },
  // 取消订单
  cancelOrder(params) {
    wx.showModal({
      title: '请确认',
      content: '确定取消订单吗？此操作不可撤销',
      cancelColor: '#589684',
      confirmColor: '#589684',
      success: res => {
        if (res.confirm) {
          this.Util.network.POST({
            url: this.API('cancel_order'),
            params: {
              w2w_session: this.data.w2w_session,
              id: params.id
            },
            success: data => {
              if (params.success) {
                params.success(data);
              }
            }
          });
        }
      }
    })
  },
  // 跳转产品详情页
  goProductDetail(e, newPage = true) {
    var id = e.currentTarget.dataset.id,
      name = e.currentTarget.dataset.name,
      url = '/pages/product-detail/product-detail?id=' + id + '&name=' + name + '&popup=false';
    if (newPage) {
      wx.navigateTo({
        url: url
      })
    } else {
      wx.redirectTo({
        url: url
      })
    }

  },

  configureLanguagePrivate(page) {

    if (!page.data.hasOwnProperty('_t')) {
      // on load

      page.setData({
        _t: base._t(),
        lan: wx.getStorageSync('Language')
      });

      var title = base._t()[page.data.title];

      console.log('Page title: ' + title)

      if (title) {
        wx.setNavigationBarTitle({
          title: title
        })
      }
    } else {
      // on show

      if (page.data.lan != wx.getStorageSync('Language')) {
        console.log('更新语言：' + wx.getStorageSync('Language'))

        page.setData({
          _t: base._t(),
          lan: wx.getStorageSync('Language')
        })

        var title = base._t()[page.data.title];

        console.log('Page title: ' + title)

        if (title) {
          wx.setNavigationBarTitle({
            title: title
          })
        }
      }
    }

  },

  configureThemeColor() {

    // set global color

    var globalColor = '#589684'

    this.Util.network.GET({
      url: this.API('index'),
      success: data => {

        globalColor = data.themecolor;

        if (globalColor) {
          wx.setBackgroundColor({
            backgroundColor: globalColor
          })
          wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: globalColor
          })

          wx.setTabBarStyle({
            selectedColor: globalColor
          })

          var pages = getCurrentPages();
          var page = pages[pages.length - 1];
          page.setData({
            globalColor: globalColor
          })
        }

        var time = data.table_timeout;

        if (time) {
          timeout = time
        }
      }
    });
  },


  configureLanguage() {

    var pages = getCurrentPages();

    var page = pages[pages.length - 1];

    this.configureLanguagePrivate(page)

    // TODO: move it out of this function
    page.setData({
      viewOnly: !this.data.table
    })
  },

  updateTabBarLanguage() {
    wx.setTabBarItem({
      index: 0,
      text: base._t()['首页']
    })
    wx.setTabBarItem({
      index: 1,
      text: base._t()['分类']
    })
    wx.setTabBarItem({
      index: 2,
      text: base._t()['购物车']
    })
    wx.setTabBarItem({
      index: 3,
      text: base._t()['我的']
    })
  },

  initialize(options) {

    // scene format:
    // {shopname}/{table number}/{authentication string}

    if (options.query.scene) {

      var parameters = decodeURIComponent(options.query.scene).split("/")

      if (parameters.length > 0) {
        // get shopname
        this.data.siteURL = this.data.siteBaseURL + "/" + parameters[0]

        if (parameters[0]) {
          this.data.siteURL = this.data.siteURL + "/"
        }
      }

      if (parameters.length > 1) {
        // get table number
        this.data.table = parameters[1]
      }

      if (parameters.length > 2) {
        // TODO: authentication code for the future
        var authentication = parameters[2]
      }
    }
  },

  onLaunch(options) {
    console.log('App onLaunch:');

    // 取出Session 收货地址 用户信息
    this.data.w2w_session = wx.getStorageSync('w2w_session');
    //this.data.address = wx.getStorageSync('address');
    this.data.address = this.getOrderParam()
    this.data.userInfo = wx.getStorageSync('userInfo');

    this.updateTabBarLanguage()
  },

  onShow(options) {

    // only allow 1011 - scan qr code to access table number

    if (options.scene == 1011) {
      this.initialize(options)
    }
  }
})