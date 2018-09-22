// pages/order-list/order-list.js

/**
 * Project: 点餐微信小程序
 * Description: 实现方便点餐
 * Author: Yuan.G
 * Organization: Access
 */

const Zan = require('../../vendor/ZanUI/index');
const app = getApp();

Page(Object.assign({}, Zan.Tab, app.Methods, {
	data: Object.assign({}, app.Variables, {
		orders: [],
		bottomStyle: null,
		tabSelected: 'all',
		tabList: [],
    title: '我的订单'
	}),
	page: 1,
	options: null,
  // init tab list
  initTabList() {

    this.setData({
      tabList: [{
        id: 'all',
        title: this.data._t['所有订单']
      },
      {
        id: 'pending',
        title: this.data._t['待付款']
      },
      {
        id: 'processing',
        title: this.data._t['待发货']
      },
      {
        id: 'shipped',
        title: this.data._t['已发货']
      },
      {
        id: 'completed',
        title: this.data._t['已完成']
      },
      {
        id: 'cancelled',
        title: this.data._t['已取消']
      }]
    });
  },
	// 选项卡变更
	handleZanTabChange({ componentId, selectedId }) {
		if (componentId == 'order-tab') {
			this.setData({ tabSelected: selectedId });
		}
		this.options.status = selectedId;
		this.refreshOrderData();
	},
	// 取消订单
	cancelOrder(e) {
		var id = e.currentTarget.dataset.id;
		app.cancelOrder({
			id: id,
			success: data => {
				var toast = {};
				if (data.success == true) {
          toast.title = this.data._t['取消成功'];
					this.changeOrderStatus(id, 'cancelled');
				}
				else {
          toast.title = this.data._t['取消失败，请稍后再试'];
					toast.icon = 'none';
				}
				wx.showToast(toast);
			}
		});
	},
	// 发起支付
	makePayment(e) {
		var dataset = e.currentTarget.dataset;
		app.requestPayment({
			id: dataset.id,
			success: res => {
				wx.showToast({
          title: this.data._t['支付成功'],
					success: () => {
						this.changeOrderStatus(dataset.id, 'processing');
					}
				});
			},
			fail: res => {
				if (res.errMsg != 'requestPayment:fail cancel') {
					wx.showToast({
            title: this.data._t['支付暂时出现问题，请稍候再试'],
						icon: 'none'
					});
				}
			}
		})
	},
	// 改变页面订单状态
	changeOrderStatus(id, status) {
		var orders = this.data.orders;
		for (var i = 0; i < orders.length; i++) {
			if (orders[i].id == id) {
				orders[i].status = status;
				orders[i]['order_status_desc'] = app.Util.getOrderStatus(orders[i].status);
				this.setData({ orders: orders });
				return;
			}
		}
	},
	// 跳转订单详情
	goOrderDetail(e) {
		var id = e.currentTarget.dataset.id;
		wx.navigateTo({
			url: '/pages/order-detail/order-detail?id=' + id
		})
	},
	// 跳转物流详情
	goShippingDetail(e) {
		var order_id = e.currentTarget.dataset.id;
		wx.navigateTo({
			url: '/pages/shipping-detail/shipping-detail?order_id=' + order_id
		})
	},
	goProductDetail() { },
	loadData(clear) {

		if (this.data.bottomStyle == 'nomore' || this.data.bottomStyle == 'empty') {
			if (this.page != 1) {
				wx.showToast({
					icon: 'none',
          title: this.data._t['没有更多了~']
				})
			}
			return;
		}

		var params = {
			w2w_session: app.data.w2w_session,
			page: this.page
		};
		if (this.options.status != 'all') params.status = this.options.status;
		
		app.Util.network.GET({
			url: app.API('order_list'),
			params: params,
			success: data => {

				var orders = data;

				for (var i = 0; i < orders.length; i++) {
					orders[i]['order_status_desc'] = app.Util.getOrderStatus(orders[i].status);
				}
				if (clear != true) {
					var orders = this.data.orders;
					for (var i = 0; i < data.length; i++) {
						orders.push(data[i]);
					}
				}

				this.setData({
					currency: app.data.currency,
					orders: orders
				})

				if (data.length == 0) {
					this.setData({ bottomStyle: (this.page == 1 ? 'empty' : 'nomore') });
					if (this.page != 1) {
						wx.showToast({
							icon: 'none',
              title: this.data._t['没有更多了~']
						})
					}
					return;
				}

				this.page++;
			}
		});
	},
	refreshOrderData() {
		this.page = 1;
		this.setData({ tabSelected: this.options.status, bottomStyle: null });
		this.loadData(true);
	},
	onLoad(options) {
		this.options = options;
		if (this.options.status == undefined) this.options.status = this.data.tabList[0].id;
		this.refreshOrderData();
		this.isOnLoad = true;

    app.configureLanguage();
    app.configureThemeColor()
    
    this.initTabList();
	},
	onShow() {
		if (this.isOnLoad == true) {
			this.isOnLoad = false;
		}
		else {
			this.refreshOrderData();
		}
	},
	onPullDownRefresh() {
		this.refreshOrderData();
	},
	onReachBottom() {
		this.loadData(false);
	}
}))