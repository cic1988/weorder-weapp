// pages/product-detail/product-detail.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const Zan = require('../../vendor/ZanUI/index');
const app = getApp();

Page(Object.assign({}, Zan.Stepper, Zan.Tab, Zan.TopTips, app.Methods, {
    data: Object.assign({}, app.Variables, {
        isVariationPopup: false,
        isAttributePopup: false,
        quantity: 1,
        productTabSelected: 'description',
        productTabList: [{
                id: 'description',
                title: '详情'
            }
            /*{
            	id: 'review',
            	title: '评价'
            }*/
        ],
        descriptionPadding: 10
    }),
    // 打开产品选择弹窗
    openVariationPopup() {
        this.setData({
            isVariationPopup: true
        });
    },
    // 关闭产品选择弹窗
    closeVariationPopup() {
        this.setData({
            isVariationPopup: false
        });
    },
    // 打开产品属性弹窗
    openAttributePopup() {
        this.setData({
            isAttributePopup: true
        });
    },
    // 关闭产品属性弹窗
    closeAttributePopup() {
        this.setData({
            isAttributePopup: false
        });
    },
    // 选项卡变更
    handleZanTabChange({
        componentId,
        selectedId
    }) {
        if (componentId == 'product-tab') {
            this.setData({
                productTabSelected: selectedId
            });
        }
    },
    // 登录成功
    loginSuccess() {
        this.setData({
            cart_quantity: app.data.cart_quantity
        });
    },
    // 选项变更
    variationChange(e) {

        var attribute = e.currentTarget.dataset.attriubte,
            oldOption = e.currentTarget.dataset.oldOption,
            option = e.currentTarget.dataset.option,
            isAvailable = e.currentTarget.dataset.isAvailable;

        if (!isAvailable) {
            return;
        }

        if (oldOption == option) {
            var default_attributes = app.Util.cloneObj(this.data.product.default_attributes);
            delete default_attributes[attribute];
            this.setData({
                ['product.default_attributes']: default_attributes
            });
        } else {
            this.setData({
                ['product.default_attributes.' + attribute + '.option']: option
            });
        }

        this.setSelected();
    },
    // 设置选项 并从已选择选项获取变量产品ID
    setSelected() {

        if (this.data.product.type != 'variable') {
            return;
        }

        var attributes = app.Util.cloneObj(this.data.product.attributes),
            default_attributes = this.data.product.default_attributes,
            variations = this.data.product.variations;

        var variationCount = this.data.variationCount;
        var selectedAllVariation = Object.keys(default_attributes).length == variationCount;

        // 筛选可用选项
        for (var attr_key in attributes) {

            if (attributes[attr_key].variation == false) {
                continue;
            }

            var attribute_options = attributes[attr_key].options;

            for (var opt_index in attribute_options) {
                var attribute_option = attribute_options[opt_index];
                var default_attributes_clone = app.Util.cloneObj(default_attributes);

                if (default_attributes_clone[attr_key]) {
                    default_attributes_clone[attr_key].option = attribute_option.slug;
                } else {
                    default_attributes_clone = Object.assign({}, default_attributes_clone, {
                        [attr_key]: {
                            option: attribute_option.slug
                        }
                    });
                }

                if (this.findVariationMatchAttributes(variations, default_attributes_clone)) {
                    attributes[attr_key].options[opt_index].is_available = true;
                } else {
                    attributes[attr_key].options[opt_index].is_available = false;
                }
            }
        }

        this.setData({
            selectedAllVariation: selectedAllVariation,
            ['product.attributes']: attributes
        });

        var selectedVariation = null,
            inStock = true;

        // 已选择所有变量
        if (selectedAllVariation) {

            // 查找选择的变量
            selectedVariation = this.findVariationMatchAttributes(variations, default_attributes);
            if (selectedVariation) {

                inStock = selectedVariation.in_stock;

                var selectedAttributes = {};
                for (var attr_key in default_attributes) {
                    selectedAttributes['variation[' + attr_key + ']'] = default_attributes[attr_key].option;
                }
                this.setData({
                    selectedAttributes: selectedAttributes,
                    selectedVariation: selectedVariation
                });
            } else {
                this.clearSelected();
            }
        } else {
            this.setData({
                selectedVariation: selectedVariation
            });
        }

    },
    clearSelected() {
        this.setData({
            ['product.default_attributes']: []
        });
        this.setSelected();
    },
    // 属性是否有对应变量
    findVariationMatchAttributes(variations, attributes) {

        for (var v_index in variations) {
            var variation = variations[v_index];
            var match = true;

            for (var attr_key in attributes) {
                var attribute = attributes[attr_key].option,
                    variation_attribute = variation.attributes[attr_key].option;

                if (variation_attribute == '') {
                    continue;
                }
                if (variation_attribute != attribute || variation.visible == false) {
                    match = false;
                    break;
                }
            }
            if (!match) {
                continue;
            }
            return variation;
        }
        return null;
    },
    // 数量选择器处理
    handleZanStepperChange(e) {
        this.setData({
            quantity: e.stepper
        });
    },
    // 添加到购物车
    detailAddToCart(e) {
        var product = this.data.product;
        var params = {
            product_id: product.id,
            quantity: this.data.quantity,
        };
        // 可变产品
        if (product.type == 'variable') {
            if (this.data.selectedAllVariation) {

                if (e.currentTarget.id == 'add-to-cart') {
                    this.openVariationPopup();
                    return;
                }

                params.variation_id = this.data.selectedVariation.id;
                params = Object.assign(params, this.data.selectedAttributes);

                /*// 点击非弹出层按钮时只添加一个
                if (e.currentTarget.id == 'add-to-cart') {
                	params.quantity = 1;
                }*/
            } else {
                if (e.currentTarget.id == 'add-to-cart') {
                    this.openVariationPopup();
                }
                return;
            }
        } else {
            if (!product.in_stock) {
                return;
            }
        }

        this.checkLogin(() => {
            app.Util.network.POST({
                url: app.API('add_to_cart'),
                params: Object.assign({}, {
                        w2w_session: app.data.w2w_session
                    },
                    params
                ),
                success: data => {
                    if (data.errors.length > 0) {
                        this.showZanTopTips(data.errors);
                    } else {
                        this.closeVariationPopup();
                        wx.showToast({
                            title: '添加成功',
                        })
                    }
                    app.updateCart(data);
                    this.setData({
                        cart_quantity: app.data.cart_quantity
                    });
                }
            });
        });
    },
    // 产品画廊全屏查看图片
    galleryViewFullScreen(e) {

        var product_images = this.data.product.images,
            currentURL = e.currentTarget.dataset.src,
            images_urls = [];
        for (var i in product_images) {
            images_urls.push(product_images[i].shop_single);
        }
        wx.previewImage({
            current: currentURL,
            urls: images_urls,
        })
    },
    // 选项弹窗全屏查看图片
    variationViewFullScreen(e) {
        var url = e.currentTarget.dataset.src;
        wx.previewImage({
            urls: [url]
        })
    },
    // 移除指定Tab
    removeTab(name) {
        for (var i in this.data.productTabList) {
            if (this.data.productTabList[i].id == name) {
                this.data.productTabList.splice(i, 1);
                this.setData({
                    productTabList: this.data.productTabList
                });
                break;
            }
        }
    },
    /* W2W Extension, Name: w2w-products-favor, Code: switchFavor */

/* W2W Extension, Name: w2w-products-favor, Code: switchFavor */
    addToCart(e) {
        this.doAddToCart(e, () => {
            this.setData({
                cart_quantity: app.data.cart_quantity
            });
        }, false);
    },
    goProductDetail(e) {
        app.goProductDetail(e, false);
    },
    goCart() {
        wx.switchTab({
            url: '/pages/cart/cart'
        })
    },
    onLoad(options) {

        if (app.data.cart != null) {
            this.setData({
                cart: app.data.cart
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

        // 加载成功前即显示标题
        var product_title = options.name;
        if (product_title != 'undefined') {
            wx.setNavigationBarTitle({
                title: product_title
            })
        }

        this.setData({
            currency: app.data.currency,
            id: options.id,
            product: null,
            product_name: product_title,
            cart_quantity: app.data.cart_quantity,
            selectedAllVariation: null,
            selectedVariation: null,
            selectedAttributes: null
        });

        app.Util.network.GET({
            url: app.API('product') + options.id,
            params: {
                w2w_session: app.data.w2w_session
            },
            success: data => {

                var product = data;

                // 获取相关产品
                if (product.related_ids.length > 0) {
                    var related_ids = {};
                    for (var i in product.related_ids) {
                        related_ids['include[' + i + ']'] = product.related_ids[i];
                    }
                    app.Util.network.GET({
                        url: app.API('product_list'),
                        params: Object.assign({},
                            related_ids, {
                                orderby: 'include'
                            }
                        ),
                        showLoading: false,
                        success: data => {
                            this.setData({
                                related_products: data
                            });
                        }
                    });
                }

                // 产品变量、可见属性个数
                var variationCount = 0,
                    visibleAttributeCount = 0;
                for (var i in product.attributes) {
                    if (product.attributes[i].variation == true) {
                        variationCount++;
                    }
                    if (product.attributes[i].visible == true) {
                        visibleAttributeCount++;
                    }
                }

                // 总库存
                var totalStock = null;
                if (product.type == 'variable') {
                    for (var i in product.variations) {
                        if (product.variations[i].in_stock && product.variations[i].stock_quantity != null) {
                            if (totalStock == null) totalStock = 0;
                            totalStock += product.variations[i].stock_quantity;
                        }
                    }
                } else {
                    totalStock = product.stock_quantity;
                }

                this.setData({
                    product: product,
                    variationCount: variationCount,
                    visibleAttributeCount: visibleAttributeCount,
                    totalStock: totalStock,
                    /* W2W Extension, Name: w2w-products-favor, Code: cartPosition */

/* W2W Extension, Name: w2w-products-favor, Code: cartPosition */
                    //isPopup: options.popup == 'true' ? true : false
                });
                wx.setNavigationBarTitle({
                    title: product.name
                })

                this.setSelected();

                // 描述和短描述
                //var WxParse = require('../../vendor/wxParse/wxParse.js');
                //WxParse.wxParse('short_description', 'html', data.short_description, this, 5);
                //WxParse.wxParse('description', 'html', data.description, this, 5);

                if (data.description == '') {
                    this.removeTab('description');
                }

                // 弹窗
                if (options.popup == 'true') this.openVariationPopup();
            }
        });

        app.configureLanguage();
        app.configureThemeColor()

        // special implementation

        var table = this.data.productTabList;

        for (var i in table) {
          table[i].title = this.data._t['详情'];
        }

        this.setData({
          productTabList: table
        });

    },
    onShow() {
      app.configureLanguage();

    },
    onPullDownRefresh() {
        this.onLoad({
            id: this.data.id,
            name: this.data.product_name,
            popup: false
        });
    },
    onReachBottom() {

    },
    onShareAppMessage() {
        return {
            title: this.data.product.name,
            path: '/pages/product-detail/product-detail?id=' + this.data.product.id + '&name=' + this.data.product.name,
        }
    }
}))