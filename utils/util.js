// pages/utils/util.js

const base = require('../i18n/base.js');
const _ = base._;

// 网络请求

// GET请求
function GET(requestHandler) {
    request('GET', requestHandler)
}
// POST请求
function POST(requestHandler) {
    request('POST', requestHandler)
}

function request(method, requestHandler) {

    var app = getApp();

    if (requestHandler.showLoading != false) {

        var title = requestHandler.loadingTitle != undefined ? requestHandler.loadingTitle : base._t()['正在加载'];
        wx.showLoading({
            title: title,
            mask: true
        })
    }

    //if (app.globalData.w2w_session != null && app.globalData.w2w_session != '') {
    //	requestHandler.params = Object.assign({}, requestHandler.params, { w2w_session: app.globalData.w2w_session });
    //}


    wx.request({
        url: requestHandler.url,
        data: requestHandler.params,
        method: method, // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        header: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        success: res => {
            wx.hideLoading();
            if (res.header['X-W2W-Session-Invalid'] == 'True') {
                wx.login({
                    success: res => {
                        app.data.js_code = res.code
                        wx.getUserInfo({
                            success: res => {
                                app.login(res, () => {
                                    app.data.cart = null;
                                    wx.reLaunch({
                                        url: '/pages/index/index'
                                    })
                                });
                            },
                            fail: () => {
                                app.logout();
                            }
                        })
                    }
                })
            }
            if (res.header['X-W2W-Session-Refresh'] == 'True') {
                wx.login({
                    success: res => {
                        app.data.js_code = res.code
                        wx.getUserInfo({
                            success: res => {
                                app.login(res);
                            },
                            fail: () => {
                                app.logout();
                            }
                        })
                    }
                })
            }
            if (requestHandler.success) requestHandler.success(res.data);
        },
        fail: () => {
            wx.hideLoading();
            wx.showToast({
                title: base._t()['加载失败，请尝试刷新'],
                icon: 'none'
            })
            if (requestHandler.fail) requestHandler.fail();
        },
        complete: (res) => {
            wx.stopPullDownRefresh();
            console.log(method + '请求' + requestHandler.url + ': (参数 ' + JSON.stringify(requestHandler.params) + ')', res);
            if (requestHandler.complete) requestHandler.complete();
        }
    })
}

// 日期格式转换
function dateFormat(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

// 数组去重
function unique(arr) {
    var result = [],
        hash = {};
    for (var i = 0, elem;
        (elem = arr[i]) != null; i++) {
        if (!hash[elem]) {
            result.push(elem);
            hash[elem] = true;
        }
    }
    return result;
}

function cloneObj(obj) {
    var str, newobj = obj.constructor === Array ? [] : {};
    if (typeof obj !== 'object') {
        return;
    } else if (JSON) {
        str = JSON.stringify(obj),
            newobj = JSON.parse(str);
    } else {
        for (var i in obj) {
            newobj[i] = typeof obj[i] === 'object' ?
                cloneObj(obj[i]) : obj[i];
        }
    }
    return newobj;
};

var states = {
    CN1: '云南省',
    CN2: '北京市',
    CN3: '天津市',
    CN4: '河北省',
    CN5: '山西省',
    CN6: '内蒙古自治区',
    CN7: '辽宁省',
    CN8: '吉林省',
    CN9: '黑龙江省',
    CN10: '上海市',
    CN11: '江苏省',
    CN12: '浙江省',
    CN13: '安徽省',
    CN14: '福建省',
    CN15: '江西省',
    CN16: '山东省',
    CN17: '河南省',
    CN18: '湖北省',
    CN19: '湖南省',
    CN20: '广东省',
    CN21: '广西壮族自治区',
    CN22: '海南省',
    CN23: '重庆市',
    CN24: '四川省',
    CN25: '贵州省',
    CN26: '陕西省',
    CN27: '甘肃省',
    CN28: '青海省',
    CN29: '宁夏回族自治区',
    CN30: '澳门',
    CN31: '西藏自治区',
    CN32: '新疆维吾尔自治区'
};

// 省名获取省代码
function getStateCode(provinceName) {
    for (var stateCode in states) {
        if (states[stateCode] == provinceName) {
            return stateCode;
        }
    }
}

// 省代码获取省名
function getStateName(stateCode) {
    return states[stateCode];
}

// 精确的乘法运算
function mul(arg1, arg2) {
    var m = 0,
        s1 = arg1.toString(),
        s2 = arg2.toString();
    try {
        m += s1.split('.')[1].length
    } catch (e) {}
    try {
        m += s2.split('.')[1].length
    } catch (e) {}
    return Number(s1.replace('.', '')) * Number(s2.replace('.', '')) / Math.pow(10, m)
}

// 数组是否存在某元素
function in_array(search, array) {
    for (var i in array) {
        if (array[i] == search) {
            return i;
        }
    }
    return -1;
}

// 获取订单状态
function getOrderStatus(status) {
    var status_obj = {
        pending: '待付款',
        processing: '待发货',
        shipped: '已发货',
        received: '已签收',
        'on-hold': '保留',
        completed: '已完成',
        cancelled: '已取消',
        refunded: '已退款',
        failed: '失败订单'
    };
    return status_obj[status];
}

// 去除html标签
function stripHTML(str) {
    var reTag = /<(?:.|\s)*?>/g;
    return str.replace(reTag, '').replace(/↵/g, '').trim();
}

// 复制到剪贴板
function setClipboard(text) {
    wx.setClipboardData({
        data: text,
        success: () => {
            wx.showToast({
                title: '已复制',
            })
        }
    })
}

function getVideoInfo(that, vid) {
    var videoUrl = 'https://vv.video.qq.com/getinfo?otype=json&appver=3.2.19.333&platform=11&defnpayver=1defn=shd&vid=' + vid;
    GET({
        url: videoUrl,
        success: data => {
            var dataJson = data.replace(/QZOutputJson=/, '') + 'qwe',
                dataJson1 = dataJson.replace(/;qwe/, ''),
                data = JSON.parse(dataJson1),
                fn_pre = data.vl.vi[0].lnk,
                streams = data['fl']['fi'],
                seg_cnt = data['vl']['vi'][0]['cl']['fc'],
                host = '';

            for (var i in data['vl']['vi'][0]['ul']['ui']) {
                console.log(data['vl']['vi'][0]['ul']['ui'][i]['url']);
                if (data['vl']['vi'][0]['ul']['ui'][i]['url'].indexOf('tc.qq.com') != -1) {
                    host = data['vl']['vi'][0]['ul']['ui'][i]['url'];
                    break;
                }
            }
            if (parseInt(seg_cnt) == 0) {
                seg_cnt = 1
            }
            var best_quality = streams[streams.length - 1]['name'],
                part_format_id = streams[streams.length - 1]['id'];

            /*for (var i = 1; i < (seg_cnt + 1); i++) {*/
            var filename = fn_pre + '.p' + (part_format_id % 10000) + '.' + 1 + '.mp4';
            requestVideoUrls(that, host, part_format_id, vid, filename);
        }
    })
}

function requestVideoUrls(that, host, part_format_id, vid, fileName) {
    var keyApi = "https://vv.video.qq.com/getkey?otype=json&platform=11&format=" + part_format_id + "&vid=" + vid + "&filename=" + fileName + "&appver=3.2.19.333"
    GET({
        url: keyApi,
        success: data => {
            var dataJson = data.replace(/QZOutputJson=/, '') + 'qwe',
                dataJson1 = dataJson.replace(/;qwe/, ''),
                data = JSON.parse(dataJson1);

            if (data.key != undefined) {
                var vkey = data['key'],
                    url = host + fileName + '?vkey=' + vkey;

                that.setData({
                    videUrl: url
                });
            }
        }
    })
}

module.exports.network = {
    GET: GET,
    POST: POST
}

module.exports.dateFormat = dateFormat;
module.exports.unique = unique;
module.exports.cloneObj = cloneObj;
module.exports.getStateCode = getStateCode;
module.exports.getStateName = getStateName;
module.exports.mul = mul;
module.exports.in_array = in_array;
module.exports.getOrderStatus = getOrderStatus;
module.exports.stripHTML = stripHTML;
module.exports.setClipboard = setClipboard;
module.exports.getVideoInfo = getVideoInfo;