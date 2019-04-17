function init_BDMap() {
    // 百度地图API功能
    var map = new BMap.Map("BDMap");
    map.centerAndZoom(new BMap.Point(116.404, 39.915), 14);
    map.enableScrollWheelZoom();

    var polyline = new BMap.Polyline([
        new BMap.Point(116.399, 39.910),
        new BMap.Point(116.405, 39.920),
        new BMap.Point(116.423493, 39.907445)
    ], {strokeColor:"blue", strokeWeight:2, strokeOpacity:0.5});   //创建折线
    map.addOverlay(polyline);   //增加折线
};
