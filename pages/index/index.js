// pages/index/index.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const Zan = require('../../vendor/ZanUI/index');
const app = getApp();

Page(Object.assign({}, Zan.TopTips, Zan.NoticeBar, app.Methods, {

  data: Object.assign({}, app.Variables, {
    currency: null,
    banner: null,
    imgHeights: [],
    imgWidth: 750,
    current: 0,
    lastest_products: null,
    clearSearchShow: false
  }),

  addToCart(e) {
    this.doAddToCart(e);
  },

  // 跳转搜索页
  searchSubmit(e) {

    var search = '';
    // 表单提交
    if (typeof e.detail.value == 'object') {
      search = e.detail.value.search;
    }
    // 输入框完成提交
    else {
      search = e.detail.value;
    }

    if (search == '') {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      })
    } else {
      wx.navigateTo({
        url: '/pages/product-list/product-list?mode=search&search=' + search
      })
      this.clearSearch();
    }

  },

  // 清空搜索
  clearSearch() {
    this.setData({
      search: '',
      clearSearchShow: false
    });
  },

  // 搜索输入框输入
  searchInput(e) {
    this.setData({
      clearSearchShow: e.detail.value != ''
    })
  },

  imageLoad(e) {

    // 获取图片下标
    var index = e.currentTarget.dataset.index;
    // 获取图片真实宽度  
    var imgWidth = e.detail.width,
      imgHeight = e.detail.height,
      // 宽高比  
      ratio = imgWidth / imgHeight;
    // 计算的高度值  
    var viewHeight = 750 / ratio;
    var imgHeight = viewHeight;
    var imgHeights = this.data.imgHeights;
    // 把每一张图片的高度记录到数组里  
    imgHeights[index] = imgHeight;
    this.setData({
      imgHeights: imgHeights
    })
  },

  imageChange(e) {
    this.setData({
      current: e.detail.current
    });
  },

  // 轮播图点击
  bannerTap(e) {
    var url = e.currentTarget.dataset.url;
    if (url != '') {
      wx.navigateTo({
        url: url
      })
    }
  },

  // 跳转产品详情页
  goProductDetail(e) {
    app.goProductDetail(e);
  },

  // 跳转所有产品页
  goViewAll() {
    wx.navigateTo({
      url: '/pages/product-list/product-list?mode=all'
    })
  },

  onLoad() {
    app.configureThemeColor()
    /*
		app.Util.network.GET({
			url: app.API('coupon'),
			params: {
				w2w_session: app.data.w2w_session,
			},
			success: data => {
				console.log(data);
			}
		});
        app.Util.network.POST({
            url: app.API('coupon'),
            params: {
				w2w_session: app.data.w2w_session,
                code: 'qo20186'
            },
            success: data => {
                console.log(data);
            }
        });
        console.log('index onLoad');
        //app.Util.getVideoInfo(this, 'i06464fu5ab');*/

    this.setData({
      currency: app.data.currency
    });

    app.configureLanguage();

    app.Util.network.GET({
      url: app.API('index'),
      success: data => {
        this.setData(data);
        this.initZanNoticeBarScroll('noticebar');
      }
    });

    if (app.data.cart == null) {
      app.checkLogin({
        success: () => {
          app.refreshCart();
        }
      });
    }
  },

  onPullDownRefresh() {
    this.onLoad();
  },

  onShow() {
    if (app.data.cart != null) {
      app.updateCart(app.data.cart);
    }
    app.configureLanguage();
  },
  
  onShareAppMessage() {

  }
}))