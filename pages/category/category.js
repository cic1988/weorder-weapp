// pages/category/category.js

const app = getApp();

Page(Object.assign({}, app.Methods, {
    data: Object.assign({}, app.Variables, {
        style: 'default',
        categories: null,
        tabSelectedID: 0,
        title: '分类'
    }),
    goFeatureProducts() {
        wx.navigateTo({
            url: '/pages/product-list/product-list?mode=featured'
        })
    },
    goOnSaleProducts() {
        wx.navigateTo({
            url: '/pages/product-list/product-list?mode=on_sale'
        })
    },
    goCategoryProducts(e) {
        var id = e.currentTarget.dataset.id,
            name = e.currentTarget.dataset.name;
        wx.navigateTo({
            url: '/pages/product-list/product-list?mode=category&id=' + id + '&name=' + name
        })
    },
    // 选项卡切换
    tabChange(e) {
        var selected = e.currentTarget.dataset.id;
        this.setData({  tabSelected: selected  });
    },
    onLoad(options) {
      app.configureThemeColor()
      
        app.Util.network.GET({
            url: app.API('category'),
            // 2018-03-16 添加 pre_page 参数获取所有分类
            params: {
                per_page: 0
            },
            success: data => {
                var firstTopCategory = 0;
                for (var i in data) {
                    if (data[i].parent == 0) {
                        firstTopCategory = data[i].id
                        break;
                    }
                }
                this.setData({
                    categories: data,
                    tabSelected: firstTopCategory
                });
            }
        });
        app.configureLanguage();
    },
    onShow() {
      app.configureLanguage();
    },
    onPullDownRefresh() {
        this.onLoad();
    },
    onReachBottom() {

    }
}))