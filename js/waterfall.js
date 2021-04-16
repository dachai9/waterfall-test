// 内容宽度
var contentW = $('.content').outerWidth() || 200;

// 内容栏数
var contentCol = parseInt($('.waterfallbox').width() / contentW);
console.log("栏数；", contentCol);

// 存储内容高度的数组，初始化
var colHeight = [];
for (var i = 0; i < contentCol; i++) {
    colHeight[i] = 0;
}

var isFirst = true;

// 在浏览器加载和页面大小发生改变时，重新计算栏数，在防抖时已解决
// $(window).on('resize', function () {
//     reset();
// })
// $(window).on('load', function () {
//     console.log('loadinginging');
//     // reset();
// })

/* --------------------------------------------------------------------------- */

start();

/* --------------------------------------------------------------------------- */

/* 开始函数，初次加载需要请求数据，但请求数据的最好铺满整个元素，因为重新请求是绑定在scroll上的 */
/* 数据的请求个数在ajax的数据那边决定 */
function start() {
    getData(function (data) {
        for (var i = 0; i < data.length; i++) {
            // 拼接
            var imgDom = dataJoint(data[i]);
            // 挂上dom树
            $('.waterfall').append(imgDom);
        }
    });
}

/* --------------------------------------------------------------------------- */

/* 获取数据 */

/* 
返回的数据样式：
data:  {id: 1, uuid: "", add_time: "2021-04-10 09:48:16", update_time: null, ext_data: null, …}
    add_time: "2021-04-10 09:48:16"
    ext_data: null
    id: 1
    imgGoto: 图片地址
    imgintro: 图片介绍
    imgurl: 图片链接
    update_time: null
    uuid: ""
    __proto__: Object 
*/
function getData(callback) {
    // 这里的接口可以获取多个数据，减少ajax请求
    $.ajax({
        // http://open.yesapi.cn/ API官网，可自定义数据库，有多个接口，还不错
        url: 'http://hn216.api.yesapi.cn/?s=App.Table.MultiGet',
        dataType: 'jsonp',
        data: {
            'app_key': '5C77AE541D32CD3BC2DA408567C5E9AE',
            'model_name': 'waterfall',
            'ids': '1, 2, 3, 4, 5, 6, 7',
            'return_data': 1
        },
        cache: false,
        success: function (ret) {
            callback(ret.data.list);
        }
    })
}

/* --------------------------------------------------------------------------- */

/* 对数据进行拼接 */
function dataJoint(data) {
    console.log('data: ', data);
    var imgDOM = '<div class="content"><img src="' + data.imgurl + '" alt=""><p>' + data.imgintro +
        '</p><a href="' + data.imgGoto + '">这是链接' + data.id + '</a></div>'
    return $(imgDOM);
}

/* --------------------------------------------------------------------------- */

/* 这一段是监听waterfall元素新增情况，因为如果每次都对所有的元素进行重新排序，会进行多次的dom操作，但兼容性差 */
var targetNode = document.querySelector(".waterfall");

var observer = new MutationObserver(function (mutationList, observer) {
    waterfall(mutationList)
});

// 在 MutationObserver 实例上调用 `observe` 方法，
// 并将要观察的元素与选项传给此方法
observer.observe(targetNode, { subtree: true, childList: true });

/* --------------------------------------------------------------------------- */

/* 这一段是进行瀑布流 */
function waterfall(data) {
    // 进入waterfall函数
    // 第一次排序时，需要初始化高度数组，以防用户边加载边resize
    if (isFirst) {
        for (var i = 0; i < contentCol; i++) {
            colHeight[i] = 0;
        }
        isFirst = false;
    }

    // data就是新增的元素
    for (var i = 0; i < data.length; i++) {
        var minI = getmin();

        // 因为返回的是NodeList节点，无法用jq的方法写，所以只能转换成js
        data[i].addedNodes[0].style.top = colHeight[minI] + 'px';
        data[i].addedNodes[0].style.left = ((contentW + 15) * minI) + 'px';
        
        // 这是jq的写法，失败，想用jq的写法，只能对jQuery.fn.init {}类型的元素进行操作
        /* data[i].addedNodes[0].css({
            top: colHeight[minI] + 'px',
            left: ((contentW + 10) * minI) + 'px',
        }) */

        // getBoundingClientRect函数是对nodelist元素进行属性查询，包括大小和位置
        colHeight[minI] += data[i].addedNodes[0].getBoundingClientRect().height;
    }
}
/* 到这里结束 */

/* --------------------------------------------------------------------------- */

/* 在resize的时候重新计算栏数，并进行瀑布流加载 */
function reset() {
    // 计算栏数
    contentCol = parseInt($('.waterfallbox').width() / contentW);

    // 初始化高度数组
    colHeight = [];
    for (var i = 0; i < contentCol; i++) {
        colHeight[i] = 0;
    }

    // 对每个元素都得重新瀑布流
    $('.waterfall .content').each(function () {
        var minI = getmin();
        // 这里的 this 指的是 content 内容，15是 margin
        $(this).css({
            top: colHeight[minI] + 'px',
            left: ((contentW + 15) * minI) + 'px',
        })
        colHeight[minI] += $(this).outerHeight();
    });
}

/* --------------------------------------------------------------------------- */

/* 防抖，减少滚动和resize的多次操作，代码是在找防抖和节流时，复制的博主的代码 */
/* 是 https://segmentfault.com/a/1190000018428170 这里 */
function debounce(fn, delay) {
    let timer = null;    //借助闭包
    return function (e) {
        // 每次都clear掉
        clearTimeout(timer);
        timer = setTimeout(() => {
            // 这里的apply主要不是改变this的指向，而是给fn传递参数argument
            fn.apply(this, arguments);
        }, delay);
    }
}

// 然后是执行代码
$('.waterfall').on('scroll', debounce(lazyload, 500));
$(window).on('resize', debounce(reset, 500));

/* --------------------------------------------------------------------------- */

/* 判断是否到达底部 */
function isLazy() {
    // 滚上去的高度
    var watertop = $('.waterfall').scrollTop();
    // 外框的高度
    var waterHeight = $('.waterfallbox').innerHeight();
    // 高度数组最小的高度
    var top = colHeight[getmin()];
    // 如果最小高度比现有高度小，则到底
    if (top <= watertop + waterHeight) {
        $('.loading').css({
            'opacity': '1'
        });
        return true;
    } else {
        return false;
    }
}

/* --------------------------------------------------------------------------- */

/* 进行懒加载 */
function lazyload() {
    if(isLazy) start();
}

/* --------------------------------------------------------------------------- */

/* 获取高度数组的最小高度 */
function getmin() {
    var minI = 0;   // 最小高度的下标
    var minV = colHeight[0];    // 最小高度
    for (var i = 0; i < colHeight.length; i++) {
        if (colHeight[i] < minV) {
            minI = i;
            minV = colHeight[i];
        }
    }
    return minI;
}