// pages/product-list/product-list.js

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
        products: null,
        bottomStyle: null
    }),
    page: 1,
    options: null,
    goProductDetail(e) {
        app.goProductDetail(e);
    },
    addToCart(e) {
        this.doAddToCart(e, () => {
            this.setData({
                cart_quantity: app.data.cart_quantity
            });
        });
    },
    goCart: () => {
        wx.switchTab({
            url: '/pages/cart/cart'
        })
    },
    goTop() {
        wx.pageScrollTo({
            scrollTop: 0
        })
    },
    loadData() {

        if (this.data.bottomStyle == 'nomore' || this.data.bottomStyle == 'empty') {
            if (this.page != 1) {
                wx.showToast({
                    icon: 'none',
                    title: this.data._t['没有更多了~']
                })
            }
            return;
        }

        app.Util.network.GET({
            url: app.API('product_list'),
            params: Object.assign({}, this.params, {
                page: this.page,
                w2w_session: app.data.w2w_session
            }),
            success: data => {

                if (data.length == 0) {
                    this.setData({
                        bottomStyle: (this.page == 1 ? 'empty' : 'nomore')
                    });
                    if (this.page != 1) {
                        wx.showToast({
                            icon: 'none',
                            title: this.data._t['没有更多了~']
                        })
                    }
                    return;
                }

                var products = this.data.products;
                for (var i = 0; i < data.length; i++) {
                    products.push(data[i]);
                }
                this.setData({
                    products: products
                });
                this.page++;
            }
        });
    },
    onLoad(options) {

      app.configureLanguage();
      app.configureThemeColor()

        if (app.data.cart != null) {
            /*
            wx.showLoading({
                title: '正在加载',
                mask: true
            })*/
            this.setData({
                cart: app.data.cart
            }, () => {
                //wx.hideLoading();
            });
        } else {
            app.checkLogin({
                success: () => {
                    app.refreshCart(cart => {
                        this.setData({
                            cart_quantity: app.data.cart_quantity
                        });
                    });
                }
            })
        }

        this.options = options;
        this.page = 1;
        this.setData({
            currency: app.data.currency,
            products: [],
            bottomStyle: null,
            mode: this.options.mode != undefined ? this.options.mode : null
        });

        var title;
        if (this.params == undefined) {
            this.params = {};
        }

        switch (this.options.mode) {
            case 'all':
                title = this.data._t['所有产品'];
                break;
            case 'search':
                //url = 'product_search';
                title = '搜索 "' + this.options.search + '"';
                this.params.search = this.options.search;
                break;
            case 'category':
                title = this.options.name;
                this.params.category = this.options.id;
                break;
            case 'featured':
                title = this.data._t['精选产品'];
                this.params.featured = true;
                break;
            case 'on_sale':
                title = this.data._t['促销产品'];
                this.params.on_sale = true;
                break;
                /* W2W Extension, Name: w2w-products-favor, Code: favorCase */

/* W2W Extension, Name: w2w-products-favor, Code: favorCase */
        }
        if (title != undefined) {
            wx.setNavigationBarTitle({
                title: title,
            })
        }

        this.loadData();

        /* W2W Extension, Name: w2w-products-filter-and-orderby, Code: filterRequest */

/* W2W Extension, Name: w2w-products-filter-and-orderby, Code: filterRequest */
    },
    /* W2W Extension, Name: w2w-products-filter-and-orderby, Code: filterEvents */

/* W2W Extension, Name: w2w-products-filter-and-orderby, Code: filterEvents */
    /* W2W Extension, Name: w2w-products-favor, Code: favorEvents */

/* W2W Extension, Name: w2w-products-favor, Code: favorEvents */
    onShow() {
        this.setData({
            cart_quantity: app.data.cart_quantity
        });
        app.configureLanguage();
    },
    onPullDownRefresh() {
        /* W2W Extension, Name: w2w-products-filter-and-orderby, Code: refreshFilter */

/* W2W Extension, Name: w2w-products-filter-and-orderby, Code: refreshFilter */
        this.onLoad(this.options);
    },
    onReachBottom() {
        this.loadData();
    },
    onShareAppMessage() {

    }
}))